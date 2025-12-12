import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getItemsByCollection, deleteItem, getCollections } from './firebase_api';
import { useAuth } from './AuthContext';
import ItemFormModal from './ItemFormModal'; // Import the new modal component
import './CollectionDetail.css';
import './ItemFormModal.css'; // Import modal specific CSS

function CollectionDetail() {
  const { id } = useParams();
  const [collectionName, setCollectionName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [itemToEditInModal, setItemToEditInModal] = useState(null);

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
  }, [currentUser, id]);

  useEffect(() => {
    if (currentUser) {
      fetchCollectionAndItems();
    }
  }, [currentUser, fetchCollectionAndItems]);

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

  const handleOpenAddItemModal = () => {
    setItemToEditInModal(null); // Ensure no item is being edited when adding new
    setShowModal(true);
  };

  const handleOpenEditItemModal = (item) => {
    setItemToEditInModal(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setItemToEditInModal(null);
  };

  const handleItemSaved = () => {
    fetchCollectionAndItems(); // Refresh items after save/update
  };

  if (loading) return <p>Loading collection details...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="collection-detail-container">
      <h2>{collectionName}</h2>
      
      <button type="button" className="add-item-button" onClick={handleOpenAddItemModal}>
        + Add Item
      </button>

      {items.length === 0 ? (
        <p>No items in this collection yet. Add one above!</p>
      ) : (
        <ul className="item-list">
          {items.map(item => (
            <li key={item.id} className="item-card">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              {item.imageData && (
                <img
                  src={item.imageData}
                  alt={item.name}
                />
              )}
              <div className="item-actions">
                <button type="button" onClick={() => handleOpenEditItemModal(item)}>Edit</button>
                <button type="button" onClick={() => handleDeleteItem(item.id)} className="delete">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ItemFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        collectionId={id}
        currentUser={currentUser}
        onItemSaved={handleItemSaved}
        itemToEdit={itemToEditInModal}
      />
    </div>
  );
}

export default CollectionDetail;

