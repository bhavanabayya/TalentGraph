/**
 * Main App component with routing
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authStore.ts';

// Pages
import WelcomePage from './pages/WelcomePage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';
import SignInPage from './pages/SignInPage.tsx';
import OTPVerifyPage from './pages/OTPVerifyPage.tsx';
import GeneralInfoPage from './pages/GeneralInfoPage.tsx';
import EditGeneralInfoPage from './pages/EditGeneralInfoPage.tsx';
import CandidateDashboard from './pages/CandidateDashboard.tsx';
import EditProfilePage from './pages/EditProfilePage.tsx';
import CompanyDashboard from './pages/CompanyDashboard.tsx';
import JobPreferencesPage from './pages/JobPreferencesPage.tsx';
import ProfileDashboard from './pages/ProfileDashboard.tsx';
import JobDetailPage from './pages/JobDetailPage.tsx';

import './App.css';

// Protected route wrapper
interface ProtectedRouteProps {
  element: React.ReactNode;
  requiredUserType?: 'candidate' | 'company';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  requiredUserType,
}) => {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" />;
  }

  return <>{element}</>;
};

const App: React.FC = () => {
  const { loadFromStorage } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Load auth state from localStorage on app mount
    loadFromStorage();
    // Mark loading as complete so routes can render
    setIsLoading(false);
  }, []);

  // Show nothing while loading to prevent flash of login screen
  if (isLoading) {
    return <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/otp-verify" element={<OTPVerifyPage />} />

        {/* Protected candidate routes */}
        <Route
          path="/general-info"
          element={
            <ProtectedRoute
              element={<GeneralInfoPage />}
              requiredUserType="candidate"
            />
          }
        />

        <Route
          path="/edit-general-info"
          element={
            <ProtectedRoute
              element={<EditGeneralInfoPage />}
              requiredUserType="candidate"
            />
          }
        />

        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute
              element={<CandidateDashboard />}
              requiredUserType="candidate"
            />
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute
              element={<EditProfilePage />}
              requiredUserType="candidate"
            />
          }
        />

        <Route
          path="/profile-dashboard"
          element={
            <ProtectedRoute
              element={<ProfileDashboard />}
              requiredUserType="candidate"
            />
          }
        />

        <Route
          path="/job-preferences"
          element={
            <ProtectedRoute
              element={<JobPreferencesPage />}
              requiredUserType="candidate"
            />
          }
        />

        {/* Protected company routes */}
        <Route
          path="/company-dashboard"
          element={
            <ProtectedRoute
              element={<CompanyDashboard />}
              requiredUserType="company"
            />
          }
        />

        <Route
          path="/job/:jobId"
          element={
            <ProtectedRoute
              element={<JobDetailPage />}
              requiredUserType="company"
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
