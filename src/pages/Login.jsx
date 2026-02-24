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

    console.log('Attempting login with:', { phone, password });

    try {
      // First check if JSON Server is reachable
      const response = await fetch('https://roaring-tigers-api.onrender.com/rms');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const allRms = await response.json();
      console.log('All RMs from database:', allRms);
      
      if (!allRms || !Array.isArray(allRms)) {
        throw new Error('Invalid data received from server');
      }
      
      // Find matching RM
      const rm = allRms.find(r => r.phone === phone && r.password === password);
      console.log('Found RM:', rm);
      
      if (rm) {
        console.log('Login successful for:', rm.name);
        sessionStorage.setItem('rm', JSON.stringify(rm));
        
        // Mark attendance
        try {
          await fetch('https://roaring-tigers-api.onrender.com/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rm_id: rm.id,
              date: new Date().toISOString().split('T')[0],
              login_time: new Date().toISOString()
            })
          });
        } catch (attErr) {
          console.log('Attendance marking failed but continuing:', attErr);
        }
        
        navigate('/dashboard');
      } else {
        setError('Invalid phone or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Make sure JSON Server is running on port 3002');
      } else {
        setError(err.message);
      }
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        width: '350px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333', 
          marginBottom: '30px',
          fontSize: '28px'
        }}>
          🛡️ Dholera Tigers
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {error && (
            <div style={{
              color: '#721c24',
              background: '#f8d7da',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.3s'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '14px',
          border: '1px solid #dee2e6'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#495057' }}>
            🔑 Demo Credentials:
          </strong>
          <div style={{ color: '#28a745' }}>✓ Phone: 9876543210</div>
          <div style={{ color: '#28a745' }}>✓ Password: rm123</div>
          <div style={{ marginTop: '8px', color: '#6c757d', fontSize: '12px' }}>
            Make sure JSON Server is running on port 3002
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
