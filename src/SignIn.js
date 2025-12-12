import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuth } from './AuthContext';
import './SignIn.css';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signin-container">
      {currentUser ? (
        <div className="welcome-message">
          <h2>Welcome, {currentUser.email}</h2>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <h2>Sign Up / Sign In</h2>
          <form>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" onClick={handleSignIn}>Sign In</button>
            <button type="submit" onClick={handleSignUp}>Sign Up</button>
          </form>
          <div className="forgot-password-link"> {/* Add a div for styling if needed */}
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default SignIn;