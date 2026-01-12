/**
 * OTP verification page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client.ts';
import { useAuth } from '../context/authStore.ts';
import { getCompanyRoleFromToken } from '../utils/tokenUtils.ts';
import '../styles/Auth.css';

const OTPVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(localStorage.getItem('pending_email') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/signin');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.sendOTP({ email });
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({ email, code });
      const { access_token, user_id, user_type } = response.data;

      // Extract company role from token if it's a company user
      const companyRole = user_type === 'company' 
        ? getCompanyRoleFromToken(access_token) 
        : null;

      login(access_token, user_id, user_type, email, companyRole || undefined);
      localStorage.removeItem('pending_email');

      // Redirect based on user type
      if (user_type === 'candidate') {
        navigate('/candidate-dashboard');
      } else {
        navigate('/company-dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Email</h2>

        {error && <div className="alert alert-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <p>We'll send a verification code to your email.</p>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <p>Enter the 6-digit code sent to {email}</p>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <p className="small-text">
              {countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default OTPVerifyPage;
