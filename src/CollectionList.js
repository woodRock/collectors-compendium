import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCollections, deleteCollection, getFirstItemImageForCollection } from './firebase_api';
import { useAuth } from './AuthContext';
import CollectionFormModal from './CollectionFormModal'; // Import the new modal component
import './CollectionList.css';
import './CollectionFormModal.css'; // Import modal specific CSS (re-uses generic modal styles)

function CollectionList() {
  const [collections, setCollections] = useState([]);
  const [collectionImages, setCollectionImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionToEditInModal, setCollectionToEditInModal] = useState(null);

  const fetchCollections = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const fetchedCollections = await getCollections(currentUser.uid);
      setCollections(fetchedCollections);

      const images = {};
      for (const collection of fetchedCollections) {
        const imageData = await getFirstItemImageForCollection(currentUser.uid, collection.id);
        images[collection.id] = imageData;
      }
      setCollectionImages(images);

    } catch (err) {
      setError('Failed to fetch collections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchCollections();
    }
  }, [currentUser, fetchCollections]);

  const handleDeleteCollection = async (id) => {
    if (!currentUser) return;
    try {
      await deleteCollection(currentUser.uid, id);
      fetchCollections();
    } catch (err) {
      setError('Failed to delete collection.');
      console.error(err);
    }
  };

  const handleOpenAddCollectionModal = () => {
    setCollectionToEditInModal(null);
    setShowCollectionModal(true);
  };

  const handleOpenEditCollectionModal = (collection) => {
    setCollectionToEditInModal(collection);
    setShowCollectionModal(true);
  };

  const handleCloseCollectionModal = () => {
    setShowCollectionModal(false);
    setCollectionToEditInModal(null);
  };

  const handleCollectionSaved = () => {
    fetchCollections(); // Refresh collections after save/update
  };

  const handleStartInventoryCheck = () => {
    if (collections.length > 0) {
      // Navigate to the first collection in inventory mode
      navigate(`/collections/${collections[0].id}`, { state: { isInventoryMode: true } });
    } else {
      alert('You need to create at least one collection to start an inventory check.');
    }
  };

  if (loading) return <p>Loading collections...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="collection-list-container">
      <h2>Your Collections</h2>
      <button type="button" className="add-collection-button" onClick={handleOpenAddCollectionModal}>
        + Add Collection
      </button>
      <button type="button" className="start-inventory-button" onClick={handleStartInventoryCheck}>
        Start Inventory Check
      </button>

      {collections.length === 0 ? (
        <p className="no-collections">No collections yet. Add one above!</p>
      ) : (
        <ul className="collection-list">
          {collections.map(collection => (
            <li key={collection.id} className="collection-item">
              <Link to={`/collections/${collection.id}`}>
                {collectionImages[collection.id] && (
                  <img
                    src={collectionImages[collection.id]}
                    alt={collection.name}
                    className="collection-display-image"
                  />
                )}
                <span>{collection.name}</span>
              </Link>
              <div className="collection-actions">
                <button type="button" onClick={() => handleOpenEditCollectionModal(collection)}>Edit</button>
                <button type="button" onClick={() => handleDeleteCollection(collection.id)} className="delete">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CollectionFormModal
        isOpen={showCollectionModal}
        onClose={handleCloseCollectionModal}
        currentUser={currentUser}
        onCollectionSaved={handleCollectionSaved}
        collectionToEdit={collectionToEditInModal}
      />
    </div>
  );
}

export default CollectionList;

