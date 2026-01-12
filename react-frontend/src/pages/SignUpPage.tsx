/**
 * Sign Up page
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/client.ts';
import '../styles/Auth.css';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get('type') || 'candidate') as 'candidate' | 'company';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'HR' | 'RECRUITER'>('RECRUITER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one digit');
      return;
    }

    // eslint-disable-next-line no-useless-escape
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&* etc)');
      return;
    }

    setLoading(true);
    try {
      const signupPayload: any = {
        email,
        password,
        user_type: userType,
      };

      // Add company_role for company users
      if (userType === 'company') {
        signupPayload.company_role = selectedRole;
      }

      const response = await authAPI.signup(signupPayload);

      if (response.data?.ok === false) {
        setError(response.data?.message || 'Signup failed');
        return;
      }

      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err: any) {
      console.error('[SIGNUP] Error:', err);
      
      // Try to extract error message from various sources
      let errorMsg = 'Signup failed';
      
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
          <h2>Sign Up</h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', margin: '10px 0 0 0' }}>
            As a {userType === 'candidate' ? 'Candidate' : 'Company'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
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
              placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special char"
            />
            <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
              Must be at least 8 characters with uppercase, digit, and special character
            </small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          {userType === 'company' && (
            <div className="form-group">
              <label>Select Your Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Admin Role */}
                <div 
                  onClick={() => setSelectedRole('ADMIN')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    border: selectedRole === 'ADMIN' ? '2px solid #667eea' : '1.5px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: selectedRole === 'ADMIN' ? 'rgba(102, 126, 234, 0.08)' : '#fafbfc',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole !== 'ADMIN') {
                      e.currentTarget.style.borderColor = '#ccc';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole !== 'ADMIN') {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.backgroundColor = '#fafbfc';
                    }
                  }}
                >
                  <input
                    type="radio"
                    id="role-admin"
                    name="company-role"
                    value="ADMIN"
                    checked={selectedRole === 'ADMIN'}
                    onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'HR' | 'RECRUITER')}
                    style={{ 
                      marginRight: '12px', 
                      marginTop: '4px', 
                      flexShrink: 0,
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                    }}
                  />
                  <label htmlFor="role-admin" style={{ margin: 0, cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '4px', fontSize: '15px' }}>
                      Admin
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                      Full access to all company features and job postings
                    </div>
                  </label>
                </div>

                {/* HR Role */}
                <div 
                  onClick={() => setSelectedRole('HR')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    border: selectedRole === 'HR' ? '2px solid #667eea' : '1.5px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: selectedRole === 'HR' ? 'rgba(102, 126, 234, 0.08)' : '#fafbfc',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole !== 'HR') {
                      e.currentTarget.style.borderColor = '#ccc';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole !== 'HR') {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.backgroundColor = '#fafbfc';
                    }
                  }}
                >
                  <input
                    type="radio"
                    id="role-hr"
                    name="company-role"
                    value="HR"
                    checked={selectedRole === 'HR'}
                    onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'HR' | 'RECRUITER')}
                    style={{ 
                      marginRight: '12px', 
                      marginTop: '4px', 
                      flexShrink: 0,
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                    }}
                  />
                  <label htmlFor="role-hr" style={{ margin: 0, cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '4px', fontSize: '15px' }}>
                      HR
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                      Access to all company job postings and candidate management
                    </div>
                  </label>
                </div>

                {/* Recruiter Role */}
                <div 
                  onClick={() => setSelectedRole('RECRUITER')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    border: selectedRole === 'RECRUITER' ? '2px solid #667eea' : '1.5px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: selectedRole === 'RECRUITER' ? 'rgba(102, 126, 234, 0.08)' : '#fafbfc',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole !== 'RECRUITER') {
                      e.currentTarget.style.borderColor = '#ccc';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole !== 'RECRUITER') {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.backgroundColor = '#fafbfc';
                    }
                  }}
                >
                  <input
                    type="radio"
                    id="role-recruiter"
                    name="company-role"
                    value="RECRUITER"
                    checked={selectedRole === 'RECRUITER'}
                    onChange={(e) => setSelectedRole(e.target.value as 'ADMIN' | 'HR' | 'RECRUITER')}
                    style={{ 
                      marginRight: '12px', 
                      marginTop: '4px', 
                      flexShrink: 0,
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                    }}
                  />
                  <label htmlFor="role-recruiter" style={{ margin: 0, cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '4px', fontSize: '15px' }}>
                      Recruiter
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                      Post and manage your own job postings
                    </div>
                  </label>
                </div>
              </div>
              <small style={{ color: '#999', display: 'block', marginTop: '12px', fontSize: '12px' }}>
                This role determines which features you can access after signing in
              </small>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/signin')}
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
