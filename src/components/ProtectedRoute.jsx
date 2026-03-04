import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const userData = sessionStorage.getItem('user');
    setIsAuthenticated(!!userData);
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Checking authentication...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated, render the child component
  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    fontSize: '18px',
    color: '#666'
  }
};

export default ProtectedRoute;
