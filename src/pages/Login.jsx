import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase directly in the frontend
const supabaseUrl = 'https://ybtyvycgmahsxqclkgab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidHl2eWNnbWFoc3hxY2xrZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTgxNjQsImV4cCI6MjA4NzU5NDE2NH0.O3qcr39duZnFxfjTE6DwFY-eQXCLCYCVZ4ijaEFiHxs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('1. Attempting login with:', { phone, password });

      // Query Supabase without .single() to avoid errors
      const { data, error } = await supabase
        .from('rms')
        .select('*')
        .eq('phone', phone)
        .eq('password_hash', password);

      console.log('2. Full response:', { data, error });

      // Check for database error
      if (error) {
        console.log('3. Database error:', error);
        setError('Login failed: ' + error.message);
        return;
      }

      // Check if no user found
      if (!data || data.length === 0) {
        console.log('3. No matching user found');
        setError('Invalid phone or password');
        return;
      }

      // Check if multiple users found (shouldn't happen, but just in case)
      if (data.length > 1) {
        console.log('3. Multiple users found:', data.length);
        setError('Multiple accounts found with same credentials');
        return;
      }

      // Success! Exactly one user found
      const user = data[0];
      console.log('4. Login successful for:', user.name);
      
      // Store user data in session
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // TEMPORARY: Always go to RM dashboard for testing
      // You can change this logic later based on user role
      navigate('/rm/dashboard');

      // Original logic commented out for now:
      // if (phone === '9876543210') {
      //   navigate('/admin/dashboard');
      // } else {
      //   navigate('/rm/dashboard');
      // }

    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Roaring Tigers</h1>
        <p style={styles.subtitle}>Sales CRM</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={styles.demoCredentials}>
          <p style={styles.demoTitle}>Demo Credentials:</p>
          <p style={styles.demoText}>Phone: 9876543210</p>
          <p style={styles.demoText}>Password: rm123</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 5px 0',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 30px 0',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px',
    textAlign: 'center'
  },
  demoCredentials: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    textAlign: 'center'
  },
  demoTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#495057',
    margin: '0 0 10px 0'
  },
  demoText: {
    fontSize: '13px',
    color: '#666',
    margin: '5px 0'
  }
};

export default Login;
