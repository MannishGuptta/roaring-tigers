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
      console.log('1. Attempting login with:', { phone, password });
      
      const response = await fetch('https://roaring-tigers-backend.onrender.com/rms');
      console.log('2. Response status:', response.status);
      
      const rms = await response.json();
      console.log('3. Raw RM data:', rms);
      console.log('4. Number of RMs:', rms.length);
      console.log('5. First RM sample:', rms[0]);
      
      // Check each field carefully
      const rm = rms.find(r => {
        console.log('Comparing:', {
          rmPhone: r.phone,
          inputPhone: phone,
          phoneMatch: String(r.phone) === String(phone),
          rmPassword: r.password,
          inputPassword: password,
          passwordMatch: String(r.password) === String(password)
        });
        return String(r.phone) === String(phone) && String(r.password) === String(password);
      });
      
      console.log('6. Found RM:', rm);
      
      if (rm) {
        console.log('7. Login successful for:', rm.name);
        sessionStorage.setItem('rm', JSON.stringify(rm));
        navigate('/dashboard');
      } else {
        console.log('7. No matching RM found');
        setError('Invalid phone or password');
      }
    } catch (err) {
      console.error('8. Login error:', err);
      setError('Connection error: ' + err.message);
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
          <strong>Demo Credentials:</strong><br />
          Phone: 9876543210<br />
          Password: rm123
        </div>
      </div>
    </div>
  );
}

export default Login;
