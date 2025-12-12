import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <p>Loading authentication...</p>;
  }

  return currentUser ? children : <Navigate to="/signin" />;
}

export default PrivateRoute;
