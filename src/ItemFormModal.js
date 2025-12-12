import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addItem, updateItem } from './firebase_api';
import { compressImageAndConvertToBase64 } from './imageUtils';

function ItemFormModal({ isOpen, onClose, collectionId, currentUser, onItemSaved, itemToEdit }) {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState(null);
  const [formError, setFormError] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setItemName(itemToEdit.name);
        setItemDescription(itemToEdit.description);
        setCapturedImageBase64(itemToEdit.imageData);
      } else {
        setItemName('');
        setItemDescription('');
        setCapturedImageBase64(null);
      }
      setSelectedImageFile(null);
      setFormError(null);
      setShowCamera(false);
    }
  }, [isOpen, itemToEdit]);

  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setVideoInputDevices(videoDevices);
        console.log('Detected video devices:', videoDevices); // Debug log
      } catch (err) {
        console.error('Error enumerating devices: ', err);
      }
    }
    if (isOpen) { // Only enumerate devices when modal is open
      getCameras();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startCamera = useCallback(async (deviceId) => {
    stopCamera();
    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera: ', err);
      setFormError('Could not access camera. Please ensure permissions are granted.');
      setShowCamera(false);
    }
  }, []); // startCamera's dependencies are internal to its logic or passed as args, so [] is appropriate here

  useEffect(() => {
    if (showCamera && isOpen) {
      const selectedDevice = videoInputDevices[currentCameraIndex];
      startCamera(selectedDevice ? selectedDevice.deviceId : null);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCamera, currentCameraIndex, videoInputDevices, isOpen, startCamera]); // Added startCamera to dependencies

  const handleFlipCamera = () => {
    const nextIndex = (currentCameraIndex + 1) % videoInputDevices.length;
    setCurrentCameraIndex(nextIndex);
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');

      const aspectRatio = video.videoWidth / video.videoHeight;
      let sx, sy, sWidth, sHeight;
      let dx, dy, dWidth, dHeight;

      if (aspectRatio > 1) {
        sHeight = video.videoHeight;
        sWidth = sHeight * (canvas.width / canvas.height);
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = video.videoWidth;
        sHeight = sWidth / (canvas.width / canvas.height);
        sx = 0;
        sy = (video.videoHeight - sHeight) / 2;
      }
      dWidth = canvas.width;
      dHeight = canvas.height;
      dx = 0;
      dy = 0;

      ctx.drawImage(video, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      const base64Image = canvas.toDataURL('image/png');
      setCapturedImageBase64(base64Image);
      stopCamera();
      setShowCamera(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!itemName.trim()) {
      setFormError('Item name cannot be empty.');
      return;
    }
    if (!currentUser) {
      setFormError('User not authenticated.');
      return;
    }

    let imageData = '';
    if (selectedImageFile) {
      try {
        imageData = await compressImageAndConvertToBase64(selectedImageFile);
      } catch (imgError) {
        setFormError('Failed to process image from file input.');
        console.error(imgError);
        return;
      }
    } else if (capturedImageBase64) {
      imageData = capturedImageBase64;
    } else if (itemToEdit && itemToEdit.imageData) {
        // If no new image is selected, and it's an edit, keep the old image data
        imageData = itemToEdit.imageData;
    }

    try {
      if (itemToEdit) {
        await updateItem(
          itemToEdit.id,
          itemName,
          itemDescription,
          imageData
        );
      } else {
        await addItem(currentUser.uid, collectionId, itemName, itemDescription, imageData);
      }
      onItemSaved(); // Callback to refresh the list in CollectionDetail
      onClose();
    } catch (err) {
      setFormError(`Failed to ${itemToEdit ? 'update' : 'add'} item.`);
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>{itemToEdit ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
          <textarea
            placeholder="Item Description"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
          />

          <div>
            <button type="button" onClick={() => setShowCamera(!showCamera)}>
              {showCamera ? 'Hide Camera' : 'Take Photo'}
            </button>
            {!showCamera && (
              <input
                type="file"
                id="itemImageInput"
                accept="image/*"
                onChange={(e) => { setSelectedImageFile(e.target.files[0]); setCapturedImageBase64(null); }}
              />
            )}
          </div>

          {showCamera && (
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline muted></video>
              <div className="camera-actions">
                <button type="button" onClick={takePhoto}>Capture Photo</button>
                {videoInputDevices.length > 1 && (
                  <button type="button" onClick={handleFlipCamera} className="flip-camera-button">Flip Camera</button>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          )}

          {(capturedImageBase64 || (itemToEdit && itemToEdit.imageData && !selectedImageFile && !capturedImageBase64)) && (
            <div className="image-preview">
              <h4>Image Preview:</h4>
              <img
                src={capturedImageBase64 || itemToEdit.imageData}
                alt="Preview"
              />
              <button type="button" onClick={() => setCapturedImageBase64(null)}>Remove Image</button>
            </div>
          )}

          <button type="submit">{itemToEdit ? 'Update Item' : 'Add Item'}</button>
          {formError && <p className="error">{formError}</p>}
        </form>
      </div>
    </div>
  );
}

export default ItemFormModal;
