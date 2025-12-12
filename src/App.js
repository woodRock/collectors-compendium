import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import CollectionList from './CollectionList';
import CollectionDetail from './CollectionDetail';
import SignIn from './SignIn';
import PrivateRoute from './PrivateRoute';
import { AuthProvider, useAuth } from './AuthContext'; // Import useAuth
import { auth } from './firebase'; // Import auth to enable sign out
import { signOut } from 'firebase/auth';
import './App.css';

function MainApp() { // Renamed App to MainApp to avoid confusion with the wrapper
  const { currentUser } = useAuth(); // Use useAuth hook inside MainApp component

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {currentUser && ( // Only show Collections link if logged in
              <li>
                <Link to="/collections">Collections</Link>
              </li>
            )}
            <li>
              {currentUser ? (
                <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Sign Out</button>
              ) : (
                <Link to="/signin">Sign In</Link>
              )}
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/collections"
            element={
              <PrivateRoute>
                <CollectionList />
              </PrivateRoute>
            }
          />
          <Route
            path="/collections/:id"
            element={
              <PrivateRoute>
                <CollectionDetail />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() { // This is the root component now
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;


