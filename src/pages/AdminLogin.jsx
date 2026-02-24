import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        sessionStorage.setItem('admin', JSON.stringify({ 
          username: 'admin', 
          role: 'administrator',
          loginTime: new Date().toISOString()
        }));
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={styles.container}>
      {/* Background Decoration */}
      <div style={styles.backgroundDecoration}>
        <div style={styles.circle1}></div>
        <div style={styles.circle2}></div>
      </div>

      {/* Login Card */}
      <div style={styles.loginCard}>
        {/* Logo and Header */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>👑</div>
          <h1 style={styles.title}>Admin Portal</h1>
          <p style={styles.subtitle}>Roaring Tigers CRM</p>
        </div>

        {/* Welcome Message */}
        <div style={styles.welcomeBox}>
          <p style={styles.welcomeText}>
            Welcome back! Please enter your credentials to access the admin dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Username Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>👤</span>
              Username
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={styles.input}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔒</span>
              Password
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span style={styles.checkboxText}>Remember me</span>
            </label>
            <a href="#" style={styles.forgotLink} onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              ...(loading && styles.loginButtonDisabled)
            }}
          >
            {loading ? (
              <span style={styles.loadingSpinner}>
                <span style={styles.spinner}></span>
                Authenticating...
              </span>
            ) : (
              <span style={styles.buttonContent}>
                <span>Login to Dashboard</span>
                <span style={styles.buttonIcon}>→</span>
              </span>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div style={styles.securityNote}>
          <span style={styles.securityIcon}>🔐</span>
          <span style={styles.securityText}>
            Secure login. All actions are logged for security purposes.
          </span>
        </div>

        {/* Demo Credentials */}
        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>📋 Demo Credentials</p>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Username:</span>
            <code style={styles.demoValue}>admin</code>
          </div>
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Password:</span>
            <code style={styles.demoValue}>admin123</code>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            © 2026 Roaring Tigers CRM. All rights reserved.
          </p>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>Privacy</a>
            <span style={styles.footerDivider}>•</span>
            <a href="#" style={styles.footerLink}>Terms</a>
            <span style={styles.footerDivider}>•</span>
            <a href="#" style={styles.footerLink}>Help</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  backgroundDecoration: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  circle1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    top: '-100px',
    right: '-50px'
  },
  circle2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    bottom: '-150px',
    left: '-100px'
  },
  loginCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    width: '90%',
    maxWidth: '450px',
    padding: '40px',
    position: 'relative',
    zIndex: 10
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    fontSize: '60px',
    marginBottom: '10px',
    animation: 'bounce 2s infinite'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  welcomeBox: {
    background: '#f0f5ff',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    border: '1px solid #d0e0ff'
  },
  welcomeText: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  errorBox: {
    background: '#fee',
    borderRadius: '8px',
    padding: '12px 15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #fcc'
  },
  errorIcon: {
    fontSize: '18px'
  },
  errorText: {
    color: '#c00',
    fontSize: '14px',
    flex: 1
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  labelIcon: {
    fontSize: '16px'
  },
  inputWrapper: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    background: '#fff'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px'
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '5px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  checkboxText: {
    userSelect: 'none'
  },
  forgotLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'color 0.3s'
  },
  loginButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  },
  loginButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  buttonIcon: {
    fontSize: '18px',
    transition: 'transform 0.3s'
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  securityIcon: {
    fontSize: '18px'
  },
  securityText: {
    fontSize: '13px',
    color: '#666'
  },
  demoBox: {
    background: '#f8f9fa',
    borderRadius: '10px',
    padding: '15px',
    marginTop: '20px'
  },
  demoTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057'
  },
  demoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  demoLabel: {
    fontSize: '13px',
    color: '#666',
    width: '70px'
  },
  demoValue: {
    background: '#e9ecef',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#2c3e50'
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 10px 0'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '12px'
  },
  footerLink: {
    color: '#667eea',
    textDecoration: 'none'
  },
  footerDivider: {
    color: '#ccc'
  }
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
  button:hover .buttonIcon {
    transform: translateX(5px);
  }
  a:hover {
    color: #764ba2 !important;
    text-decoration: underline !important;
  }
`;
document.head.appendChild(styleSheet);

export default AdminLogin;
