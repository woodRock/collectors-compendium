import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCollections, addCollection, deleteCollection } from './firebase_api';
import { useAuth } from './AuthContext'; // Import useAuth

function CollectionList() {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth(); // Get current user from AuthContext

  const fetchCollections = useCallback(async () => {
    if (!currentUser) return; // Ensure user is logged in
    try {
      setLoading(true);
      const data = await getCollections(currentUser.uid); // Pass userId
      setCollections(data);
    } catch (err) {
      setError('Failed to fetch collections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Dependencies for useCallback

  useEffect(() => {
    if (currentUser) { // Only fetch collections if user is logged in
      fetchCollections();
    }
  }, [currentUser, fetchCollections]); // Re-fetch when currentUser or fetchCollections changes

  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !currentUser) return; // Ensure user is logged in
    try {
      await addCollection(currentUser.uid, newCollectionName); // Pass userId
      setNewCollectionName('');
      fetchCollections(); // Refresh the list
    } catch (err) {
      setError('Failed to add collection.');
      console.error(err);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!currentUser) return; // Ensure user is logged in
    try {
      await deleteCollection(currentUser.uid, id); // Pass userId and collectionId
      fetchCollections(); // Refresh the list
    } catch (err) {
      setError('Failed to delete collection.');
      console.error(err);
    }
  };

  if (loading) return <p>Loading collections...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Your Collections</h2>
      <form onSubmit={handleAddCollection}>
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="New collection name"
        />
        <button type="submit">Add Collection</button>
      </form>

      {collections.length === 0 ? (
        <p>No collections yet. Add one above!</p>
      ) : (
        <ul>
          {collections.map(collection => (
            <li key={collection.id}>
              <Link to={`/collections/${collection.id}`}>{collection.name}</Link>
              <button onClick={() => handleDeleteCollection(collection.id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollectionList;

