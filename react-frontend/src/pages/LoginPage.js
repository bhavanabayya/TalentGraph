import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ({ API_BASE, onLogin, authToken }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (authToken) {
    navigate('/profile');
    return null;
  }

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Enter a valid email.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/auth/send-otp`, { email });
      if (resp.status === 200) {
        setOtpSent(true);
        setMessage('OTP sent to your email.');
        setMessageType('success');
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to send OTP');
      setMessageType('error');
    }
    setLoading(false);
  };

  const verifyLogin = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setMessage('Enter a valid 6-digit OTP.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/auth/verify-otp`, {
        email,
        code: otp,
      });
      if (resp.status === 200) {
        const token = resp.data.access_token;

        // Try to load existing profile
        try {
          const profileResp = await axios.get(
            `${API_BASE}/candidates/by-email/${email}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (profileResp.status === 200) {
            const candidateId = profileResp.data.id;
            onLogin(token, email, candidateId);
            setMessage('Profile loaded! Redirecting...');
            setMessageType('success');
            setTimeout(() => navigate('/profile'), 1500);
          }
        } catch {
          // No profile exists, allow user to create one
          onLogin(token, email, null);
          setMessage('Logged in successfully! Redirecting...');
          setMessageType('success');
          setTimeout(() => navigate('/profile'), 1500);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to verify OTP');
      setMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '550px', marginTop: '40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>Welcome to TalentGraph</h1>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '12px'
        }}>Login</h2>
        <p className="ds-muted" style={{ fontSize: '15px', lineHeight: '1.6' }}>Verify your identity with a one-time password sent to your email.</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`} style={{ marginTop: '24px' }}>
          {message}
        </div>
      )}

      <form onSubmit={!otpSent ? sendOtp : verifyLogin} style={{ marginTop: '36px' }}>
        {!otpSent ? (
          <>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-block"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-block"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-large btn-block spacer-md"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setMessage('');
              }}
            >
              Back
            </button>
          </>
        )}
      </form>

      <div className="alert alert-info" style={{ marginTop: '30px' }}>
        After login you will be redirected to your profile.
      </div>
    </div>
  );
};

export default LoginPage;
