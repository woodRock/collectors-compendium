import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

// --- Collection Functions ---

// Add a new collection
export const addCollection = async (userId, collectionName) => {
  try {
    const docRef = await addDoc(collection(db, 'collections'), {
      userId, // Store userId with the collection
      name: collectionName,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding collection: ', e);
    throw e;
  }
};

// Get all collections for a specific user
export const getCollections = async (userId) => {
  try {
    const q = query(collection(db, 'collections'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const collections = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return collections;
  } catch (e) {
    console.error('Error getting collections: ', e);
    throw e;
  }
};

// Update a collection
export const updateCollection = async (id, newName) => {
  try {
    const collectionRef = doc(db, 'collections', id);
    await updateDoc(collectionRef, { name: newName });
  } catch (e) {
    console.error('Error updating collection: ', e);
    throw e;
  }
};

// Delete a collection and its items/images
export const deleteCollection = async (userId, collectionId) => {
  try {
    // Delete all items associated with this collection and user first
    const itemsQuery = query(
      collection(db, 'items'),
      where('userId', '==', userId),
      where('collectionId', '==', collectionId)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    const deleteItemPromises = itemsSnapshot.docs.map(async (itemDoc) => {
      await deleteDoc(doc(db, 'items', itemDoc.id));
    });
    await Promise.all(deleteItemPromises);

    // Then delete the collection itself for this user
    const collectionRef = doc(db, 'collections', collectionId);
    // Optional: Add a check here if you want to ensure the collection belongs to the userId before deleting
    // const collectionDoc = await getDoc(collectionRef);
    // if (collectionDoc.exists() && collectionDoc.data().userId === userId) {
        await deleteDoc(collectionRef);
    // } else {
    //    throw new Error('Collection not found or not owned by user.');
    // }

  } catch (e) {
    console.error('Error deleting collection: ', e);
    throw e;
  }
};

// --- Item Functions ---

// Add a new item to a collection
export const addItem = async (userId, collectionId, itemName, itemDescription, imageData) => {
  try {
    const docRef = await addDoc(collection(db, 'items'), {
      userId, // Store userId with the item
      collectionId,
      name: itemName,
      description: itemDescription,
      imageData, // Store Base64 image data directly
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding item: ', e);
    throw e;
  }
};

// Get items for a specific collection and user
export const getItemsByCollection = async (userId, collectionId) => {
  try {
    const q = query(
      collection(db, 'items'),
      where('userId', '==', userId),
      where('collectionId', '==', collectionId)
    );
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return items;
  } catch (e) {
    console.error('Error getting items: ', e);
    throw e;
  }
};

// Get the image data of the first item in a collection
export const getFirstItemImageForCollection = async (userId, collectionId) => {
  try {
    const q = query(
      collection(db, 'items'),
      where('userId', '==', userId),
      where('collectionId', '==', collectionId),
      orderBy('createdAt', 'asc'), // Order by creation time to get the "first"
      limit(1) // Limit to only one document
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const item = querySnapshot.docs[0].data();
      return item.imageData; // Return the image data
    }
    return null; // No item found
  } catch (e) {
    console.error('Error getting first item image: ', e);
    throw e;
  }
};

// Update an item
export const updateItem = async (id, itemName, itemDescription, imageData) => {
  try {
    const itemRef = doc(db, 'items', id);
    await updateDoc(itemRef, {
      name: itemName,
      description: itemDescription,
      imageData, // Store Base64 image data directly
    });
  } catch (e) {
    console.error('Error updating item: ', e);
    throw e;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(db, 'items', id));
  } catch (e) {
    console.error('Error deleting item: ', e);
    throw e;
  }
};
