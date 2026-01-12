/**
 * Sign In page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, candidateAPI } from '../api/client.ts';
import { useAuth } from '../context/authStore.ts';
import '../styles/Auth.css';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data.needs_otp === false && response.data.access_token) {
        // Direct login without OTP - save token and redirect
        login(
          response.data.access_token,
          response.data.user_id,
          response.data.user_type,
          email
        );
        
        // Redirect based on user type
        if (response.data.user_type === 'candidate') {
          // Check if candidate has completed general info
          try {
            const statusRes = await candidateAPI.getMe();
            if (statusRes.data?.is_general_info_complete) {
              // Existing user - go to dashboard
              navigate('/candidate-dashboard');
            } else {
              // New user - go to general info form
              navigate('/general-info');
            }
          } catch (err) {
            console.error('Error checking general info status:', err);
            // Default to general info for safety
            navigate('/general-info');
          }
        } else {
          // If needs_otp is true or no access_token, redirect to OTP
          navigate('/otp-verify');
        }
      }
    } catch (err: any) {
      console.error('[SIGNIN] Error:', err);
      
      // Try to extract error message from various sources
      let errorMsg = 'Login failed';
      
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <a href="/" className="back-link">← Back to Home</a>
          <h2>Sign In</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            Sign Up Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
