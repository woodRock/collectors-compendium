import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import { getItemsByCollection, deleteItem, getCollections, updateItemFoundStatus } from './firebase_api';
import { useAuth } from './AuthContext';
import ItemFormModal from './ItemFormModal'; // Import the new modal component
import './CollectionDetail.css';
import './ItemFormModal.css'; // Import modal specific CSS

function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Initialize useLocation
  const [collectionName, setCollectionName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [itemToEditInModal, setItemToEditInModal] = useState(null);

  const [isInventoryMode, setIsInventoryMode] = useState(location.state?.isInventoryMode || false);
  const [allUserCollections, setAllUserCollections] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => {
    setIsInventoryMode(location.state?.isInventoryMode || false);
  }, [location.state?.isInventoryMode]);

  const fetchCollectionAndItems = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const allCollections = await getCollections(currentUser.uid);
      setAllUserCollections(allCollections); // Store all collections for navigation
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
      // Initialize checkedItems based on the 'found' status
      const initialCheckedItems = new Set(data.filter(item => item.found).map(item => item.id));
      setCheckedItems(initialCheckedItems);
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

  const handleBackToCollections = () => {
    navigate('/'); // Navigate to the root, which is the collections list
  };

  const handleToggleInventoryMode = () => {
    const newInventoryMode = !isInventoryMode;
    setIsInventoryMode(newInventoryMode);
    // When entering inventory mode, re-fetch items to ensure checkedItems is correctly initialized
    // This is especially important if 'found' status can change from other sources
    if (newInventoryMode) {
      fetchCollectionAndItems();
    }
  };

  const handleItemCheck = async (itemId, isChecked) => {
    try {
      await updateItemFoundStatus(itemId, isChecked);
      setCheckedItems(prev => {
        const newSet = new Set(prev);
        if (isChecked) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });
      // Optionally, update the local items array to reflect the change immediately
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, found: isChecked } : item
        )
      );
    } catch (err) {
      setError('Failed to update item found status.');
      console.error(err);
    }
  };


  const handleNextCollection = () => {
    const currentIndex = allUserCollections.findIndex(col => col.id === id);
    if (currentIndex !== -1 && currentIndex < allUserCollections.length - 1) {
      const nextCollectionId = allUserCollections[currentIndex + 1].id;
      navigate(`/collections/${nextCollectionId}`, { state: { isInventoryMode: true } });
    } else {
      // If it's the last collection or no next collection, finish inventory mode
      handleFinishInventoryMode();
    }
  };

  const handleFinishInventoryMode = () => {
    setIsInventoryMode(false);
    navigate('/'); // Go back to the collection list after finishing
  };

  if (loading) return <p>Loading collection details...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="collection-detail-container">
      <button type="button" onClick={handleBackToCollections} className="back-button">
        &lt; Back to Collections
      </button>
      <h2>{collectionName}</h2>
      {!isInventoryMode && (
        <button type="button" className="add-item-button" onClick={handleOpenAddItemModal}>
          + Add Item
        </button>
      )}

      <div className="collection-actions">
        <button
          type="button"
          className="inventory-mode-toggle-button"
          onClick={handleToggleInventoryMode}
        >
          {isInventoryMode ? 'Exit Inventory Mode' : 'Start Inventory Check'}
        </button>
      </div>

      {isInventoryMode && (
        <div className="inventory-navigation">
          <button type="button" onClick={handleNextCollection}>
            Next Collection
          </button>
          <button type="button" onClick={handleFinishInventoryMode}>
            Finish Inventory Check
          </button>
        </div>
      )}
      
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
                {isInventoryMode && (
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item.id)}
                    onChange={(e) => handleItemCheck(item.id, e.target.checked)}
                  />
                )}
                {!isInventoryMode && (
                  <>
                    <button type="button" onClick={() => handleOpenEditItemModal(item)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteItem(item.id)} className="delete">Delete</button>
                  </>
                )}
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

