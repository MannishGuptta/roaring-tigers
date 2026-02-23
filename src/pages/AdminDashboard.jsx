import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    navigate('/admin');
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default AdminDashboard;
