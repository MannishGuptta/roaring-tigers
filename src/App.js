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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboard-cp" element={<OnboardCP />} />
        <Route path="/my-cps" element={<MyCPs />} />
        <Route path="/log-meeting" element={<MeetingLogger />} />
        <Route path="/record-sale" element={<RecordSale />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
