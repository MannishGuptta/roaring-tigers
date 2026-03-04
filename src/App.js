import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OnboardCP from './pages/OnboardCP';
import MyCPs from './pages/MyCPs';
import MeetingLogger from './pages/MeetingLogger';
import RecordSale from './pages/RecordSale';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no protection needed */}
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Protected RM routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/onboard-cp" element={
          <ProtectedRoute>
            <OnboardCP />
          </ProtectedRoute>
        } />
        <Route path="/my-cps" element={
          <ProtectedRoute>
            <MyCPs />
          </ProtectedRoute>
        } />
        <Route path="/log-meeting" element={
          <ProtectedRoute>
            <MeetingLogger />
          </ProtectedRoute>
        } />
        <Route path="/record-sale" element={
          <ProtectedRoute>
            <RecordSale />
          </ProtectedRoute>
        } />
        
        {/* Protected Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
