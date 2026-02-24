import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the correct backend URL
      const response = await fetch('https://roaring-tigers-backend.onrender.com/rms');
      const rms = await response.json();
      
      const rm = rms.find(r => r.phone === phone && r.password === password);
      
      if (rm) {
        sessionStorage.setItem('rm', JSON.stringify(rm));
        navigate('/dashboard');
      } else {
        setError('Invalid phone or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        width: '350px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>
          🦁 Roaring Tigers
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Sales CRM
        </p>
        
        <form onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
            required
          />
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: '#f8f9fa',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <strong>Demo:</strong> 9876543210 / rm123
        </div>
      </div>
    </div>
  );
}

export default Login;
