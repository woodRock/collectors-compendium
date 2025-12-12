import React, { useState, useEffect } from 'react';
import { addCollection, updateCollection } from './firebase_api';

function CollectionFormModal({ isOpen, onClose, currentUser, onCollectionSaved, collectionToEdit }) {
  const [collectionName, setCollectionName] = useState('');
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (collectionToEdit) {
        setCollectionName(collectionToEdit.name);
      } else {
        setCollectionName('');
      }
      setFormError(null);
    }
  }, [isOpen, collectionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!collectionName.trim()) {
      setFormError('Collection name cannot be empty.');
      return;
    }
    if (!currentUser) {
      setFormError('User not authenticated.');
      return;
    }

    try {
      if (collectionToEdit) {
        await updateCollection(collectionToEdit.id, collectionName);
      } else {
        await addCollection(currentUser.uid, collectionName);
      }
      onCollectionSaved();
      onClose();
    } catch (err) {
      setFormError(`Failed to ${collectionToEdit ? 'update' : 'add'} collection.`);
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>{collectionToEdit ? 'Edit Collection' : 'Add New Collection'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Collection Name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            required
          />
          <button type="submit">{collectionToEdit ? 'Update Collection' : 'Add Collection'}</button>
          {formError && <p className="error">{formError}</p>}
        </form>
      </div>
    </div>
  );
}

export default CollectionFormModal;
