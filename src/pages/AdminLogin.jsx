import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('admin', JSON.stringify({ username: 'admin' }));
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} /><br/>
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><br/>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit">{loading ? 'Loading...' : 'Login'}</button>
      </form>
    </div>
  );
}

export default AdminLogin;
