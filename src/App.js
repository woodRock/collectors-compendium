import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CollectionList from './CollectionList';
import CollectionDetail from './CollectionDetail';
import SignIn from './SignIn';
import ForgotPassword from './ForgotPassword'; // Import ForgotPassword component
import PrivateRoute from './PrivateRoute';
import { AuthProvider, useAuth } from './AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import Mascot from './Mascot'; // Import the Mascot component
import './App.css'; // Import the main App.css

function MainApp() {
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Router>
      <div className="App"> {/* Apply global App class */}
        <nav>
          <ul>
            {currentUser && (
              <li>
                <Link to="/" className="nav-link">Collections</Link> {/* Link to root, which is Collections */}
              </li>
            )}
            <li>
              {currentUser ? (
                <button onClick={handleSignOut} className="nav-button">Sign Out</button>
              ) : (
                <Link to="/signin" className="nav-link">Sign In</Link>
              )}
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Add ForgotPassword route */}
          <Route
            path="/" /* Root path is now Collections */
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
        <Mascot /> {/* Render the Mascot globally */}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;


