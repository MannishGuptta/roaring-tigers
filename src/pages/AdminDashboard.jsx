import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Admin login attempt with:', { email });

      // Query for admin user (you can have a separate admin table or role field)
      const { data, error } = await supabase
        .from('rms')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (error) {
        console.error('Login error:', error);
        setError('Invalid credentials');
        return;
      }

      if (!data) {
        setError('Invalid credentials');
        return;
      }

      // Check if user has admin role (you can add a role field to your rms table)
      // For now, using a simple check - you can customize this
      if (data.email === 'admin@example.com' || data.phone === '9876543210') {
        console.log('Admin login successful:', data.name);
        
        // Store admin data in session
        sessionStorage.setItem('user', JSON.stringify(data));
        sessionStorage.setItem('isAdmin', 'true');
        
        navigate('/admin/dashboard');
      } else {
        setError('Not authorized as admin');
      }

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
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Roaring Tigers CRM</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
        
        <div style={styles.demoCredentials}>
          <p style={styles.demoTitle}>Demo Admin Credentials:</p>
          <p style={styles.demoText}>Email: admin@example.com</p>
          <p style={styles.demoText}>Password: admin123</p>
          <p style={styles.demoText}>Or use RM: 9876543210 / rm123</p>
        </div>

        <div style={styles.backLink}>
          <a href="/" style={styles.link}>← Back to RM Login</a>
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
    backgroundColor: '#343a40',
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
  },
  backLink: {
    marginTop: '20px',
    textAlign: 'center'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px'
  }
};

export default AdminLogin;
