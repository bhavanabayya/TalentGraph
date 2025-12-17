import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ResumesPage from './pages/ResumesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import Sidebar from './components/Sidebar';

const API_BASE = 'http://127.0.0.1:8000';

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [authedEmail, setAuthedEmail] = useState(localStorage.getItem('authedEmail') || null);
  const [candidateId, setCandidateId] = useState(localStorage.getItem('candidateId') || null);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  useEffect(() => {
    if (authedEmail) {
      localStorage.setItem('authedEmail', authedEmail);
    } else {
      localStorage.removeItem('authedEmail');
    }
  }, [authedEmail]);

  useEffect(() => {
    if (candidateId) {
      localStorage.setItem('candidateId', candidateId);
    } else {
      localStorage.removeItem('candidateId');
    }
  }, [candidateId]);

  const handleLogout = () => {
    setAuthToken(null);
    setAuthedEmail(null);
    setCandidateId(null);
    localStorage.clear();
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar 
          authToken={authToken} 
          authedEmail={authedEmail} 
          onLogout={handleLogout}
        />
        <main className="main-content">
          <Routes>
            <Route
              path="/login"
              element={
                <LoginPage
                  API_BASE={API_BASE}
                  onLogin={(token, email, candidateId) => {
                    setAuthToken(token);
                    setAuthedEmail(email);
                    setCandidateId(candidateId);
                  }}
                  authToken={authToken}
                />
              }
            />
            <Route
              path="/profile"
              element={
                authToken ? (
                  <ProfilePage
                    API_BASE={API_BASE}
                    authToken={authToken}
                    authedEmail={authedEmail}
                    candidateId={candidateId}
                    onCandidateIdChange={setCandidateId}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/resumes"
              element={
                authToken ? (
                  <ResumesPage
                    API_BASE={API_BASE}
                    authToken={authToken}
                    candidateId={candidateId}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/applications"
              element={
                authToken ? (
                  <ApplicationsPage
                    API_BASE={API_BASE}
                    authToken={authToken}
                    candidateId={candidateId}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<Navigate to={authToken ? '/profile' : '/login'} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
