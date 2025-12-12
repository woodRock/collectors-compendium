import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getItemsByCollection, addItem, updateItem, deleteItem, getCollections } from './firebase_api';
import { compressImageAndConvertToBase64 } from './imageUtils'; // Import the image utility
import { useAuth } from './AuthContext'; // Import useAuth

function CollectionDetail() {
  const { id } = useParams();
  const [collectionName, setCollectionName] = useState('');
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null); // For file input fallback
  const [capturedImageBase64, setCapturedImageBase64] = useState(null); // For camera captured image
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Camera related states and refs
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const fetchCollectionAndItems = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const allCollections = await getCollections(currentUser.uid);
      const currentCollection = allCollections.find(col => col.id === id);
      if (currentCollection) {
        setCollectionName(currentCollection.name);
      } else {
        setError('Collection not found or not owned by you.');
        setLoading(false);
        return;
      }

      const data = await getItemsByCollection(currentUser.uid, id);
      setItems(data);
    } catch (err) {
      setError('Failed to fetch collection details or items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, id]); // Dependencies for useCallback

  useEffect(() => {
    if (currentUser) {
      fetchCollectionAndItems();
    }
  }, [currentUser, fetchCollectionAndItems]); // fetchCollectionAndItems is now a stable dependency

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup function for camera stream
    return () => {
      stopCamera();
    };
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera: ', err);
      setError('Could not access camera. Please ensure permissions are granted.');
      setShowCamera(false); // Hide camera UI if access fails
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // Set canvas dimensions to the desired output size (224x224)
      canvas.width = 224;
      canvas.height = 224;

      const ctx = canvas.getContext('2d');
      // Draw the current video frame onto the canvas, cropping to fit 224x224
      const aspectRatio = video.videoWidth / video.videoHeight;
      let sx, sy, sWidth, sHeight; // Source rectangle
      let dx, dy, dWidth, dHeight; // Destination rectangle

      // Calculate source and destination to crop the center and fit to 224x224
      if (aspectRatio > 1) { // Landscape video
        sHeight = video.videoHeight;
        sWidth = sHeight * (canvas.width / canvas.height); // Crop width to match canvas aspect
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
      } else { // Portrait or square video
        sWidth = video.videoWidth;
        sHeight = sWidth / (canvas.width / canvas.height); // Crop height to match canvas aspect
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
      stopCamera(); // Stop camera after taking photo
      setShowCamera(false); // Hide camera UI
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !currentUser) return;

    let imageData = '';
    if (selectedImageFile) {
      try {
        imageData = await compressImageAndConvertToBase64(selectedImageFile);
      } catch (imgError) {
        setError('Failed to process image from file input.');
        console.error(imgError);
        return;
      }
    } else if (capturedImageBase64) {
      imageData = capturedImageBase64; // Use directly as it's already processed
    }

    try {
      if (editingItem) {
        await updateItem(
          editingItem.id,
          newItemName,
          newItemDescription,
          imageData || editingItem.imageData
        );
        setEditingItem(null);
      } else {
        await addItem(currentUser.uid, id, newItemName, newItemDescription, imageData);
      }
      setNewItemName('');
      setNewItemDescription('');
      setSelectedImageFile(null);
      setCapturedImageBase64(null);
      if (document.getElementById('itemImageInput')) document.getElementById('itemImageInput').value = null;
      fetchCollectionAndItems();
    } catch (err) {
      setError(`Failed to ${editingItem ? 'update' : 'add'} item.`);
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!currentUser) return;
    try {
      await deleteItem(itemId);
      fetchCollectionAndItems();
    } catch (err) {
      setError('Failed to delete item.');
      console.error(err);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDescription(item.description);
    setSelectedImageFile(null);
    setCapturedImageBase64(item.imageData); // Show existing image if any
    if (document.getElementById('itemImageInput')) document.getElementById('itemImageInput').value = null;
    setShowCamera(false);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewItemDescription('');
    setSelectedImageFile(null);
    setCapturedImageBase64(null);
    if (document.getElementById('itemImageInput')) document.getElementById('itemImageInput').value = null;
    setShowCamera(false);
  }

  if (loading) return <p>Loading collection details...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>{collectionName}</h2>
      <h3>Items:</h3>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Item name"
          required
        />
        <textarea
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          placeholder="Item description"
        />

        {/* Camera or File Input */}
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
          <div>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '224px', height: '224px', objectFit: 'cover', border: '1px solid black' }}></video>
            <button type="button" onClick={takePhoto}>Capture Photo</button>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas> {/* Hidden canvas for processing */}
          </div>
        )}

        {(capturedImageBase64 || (editingItem && editingItem.imageData)) && (
          <div>
            <h4>Image Preview:</h4>
            <img
              src={capturedImageBase64 || editingItem.imageData}
              alt="Preview"
              style={{ maxWidth: '224px', maxHeight: '224px', objectFit: 'cover', border: '1px solid black' }}
            />
            <button type="button" onClick={() => setCapturedImageBase64(null)}>Remove Image</button>
          </div>
        )}

        <button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</button>
        {editingItem && <button type="button" onClick={handleCancelEdit}>Cancel Edit</button>}
      </form>

      {items.length === 0 ? (
        <p>No items in this collection yet. Add one above!</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {items.map(item => (
            <li key={item.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              {item.imageData && (
                <img
                  src={item.imageData}
                  alt={item.name}
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', margin: '10px 0' }}
                />
              )}
              <div>
                <button type="button" onClick={() => handleEditItem(item)}>Edit</button>
                <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollectionDetail;

