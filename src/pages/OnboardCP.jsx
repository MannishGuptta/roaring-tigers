import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function OnboardCP() {
  const [rm, setRm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [aadharFile, setAadharFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',  // Changed from cp_name to match DB
    phone: '',
    email: '',
    address: '',
    commission_rate: 5.0, // Added to match DB
    status: 'active',
    join_date: new Date().toISOString().split('T')[0],
    gst_number: '',
    pan_number: '',
    aadhar_number: '',
    pan_verified: false,
    aadhar_verified: false,
    documents_submitted: false
  });
  
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userData);
    setRm(user);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePanUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPanFile(file);
      console.log('PAN card selected:', file.name);
    }
  };

  const handleAadharUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadharFile(file);
      console.log('Aadhar card selected:', file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!rm) {
        throw new Error('You must be logged in');
      }

      // Prepare CP data for Supabase
      const cpData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        rm_id: rm.id,
        commission_rate: parseFloat(formData.commission_rate) || 0,
        status: formData.status,
        join_date: formData.join_date,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        aadhar_number: formData.aadhar_number || null,
        pan_verified: formData.pan_verified,
        aadhar_verified: formData.aadhar_verified,
        documents_submitted: !!(panFile || aadharFile || formData.pan_number || formData.aadhar_number)
      };

      console.log('Submitting CP data:', cpData);

      // Save to Supabase
      const { data, error } = await supabase
        .from('channel_partners')
        .insert([cpData])
        .select();

      if (error) throw error;

      console.log('CP added successfully:', data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        commission_rate: 5.0,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        gst_number: '',
        pan_number: '',
        aadhar_number: '',
        pan_verified: false,
        aadhar_verified: false,
        documents_submitted: false
      });
      setPanFile(null);
      setAadharFile(null);

      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error saving CP:', err);
      setError(err.message || 'Failed to add CP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!rm) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>➕ Onboard New Channel Partner</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>

      {success && (
        <div style={styles.successMessage}>
          ✅ Channel Partner onboarded successfully! Redirecting...
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          {/* Left Column - Basic Info */}
          <div style={styles.column}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>CP Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter channel partner name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Enter phone number"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter email address"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{...styles.input, minHeight: '80px'}}
                placeholder="Enter complete address"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>GST Number</label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter GST number (optional)"
              />
            </div>
          </div>

          {/* Right Column - Documents */}
          <div style={styles.column}>
            <h3 style={styles.sectionTitle}>Document Details</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>PAN Number</label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter PAN number"
                maxLength="10"
              />
            </div>

            <div style={styles.uploadGroup}>
              <label style={styles.label}>Upload PAN Card</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handlePanUpload}
                style={styles.fileInput}
              />
              {panFile && (
                <span style={styles.fileName}>✓ {panFile.name}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Aadhar Number</label>
              <input
                type="text"
                name="aadhar_number"
                value={formData.aadhar_number}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter Aadhar number"
                maxLength="12"
              />
            </div>

            <div style={styles.uploadGroup}>
              <label style={styles.label}>Upload Aadhar Card</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleAadharUpload}
                style={styles.fileInput}
              />
              {aadharFile && (
                <span style={styles.fileName}>✓ {aadharFile.name}</span>
              )}
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="pan_verified"
                  checked={formData.pan_verified}
                  onChange={handleChange}
                />
                PAN verified
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="aadhar_verified"
                  checked={formData.aadhar_verified}
                  onChange={handleChange}
                />
                Aadhar verified
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Join Date</label>
              <input
                type="date"
                name="join_date"
                value={formData.join_date}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'wait' : 'pointer'
          }}>
            {loading ? 'Saving...' : 'Onboard Channel Partner'}
          </button>
        </div>
      </form>

      <div style={styles.tips}>
        <h3 style={styles.tipsTitle}>📝 Document Guidelines:</h3>
        <ul style={styles.tipsList}>
          <li>PAN number should be 10 characters (e.g., ABCDE1234F)</li>
          <li>Aadhar number should be 12 digits</li>
          <li>Upload clear scanned copies (PDF, JPG, PNG)</li>
          <li>Maximum file size: 5MB per document</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    color: '#333',
    margin: 0
  },
  backBtn: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  successMessage: {
    background: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '16px',
    border: '1px solid #c3e6cb'
  },
  errorMessage: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '16px',
    border: '1px solid #f5c6cb'
  },
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '30px'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#495057',
    margin: '0 0 10px 0',
    paddingBottom: '5px',
    borderBottom: '2px solid #e9ecef'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontWeight: 'bold',
    color: '#495057',
    fontSize: '14px'
  },
  input: {
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  select: {
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer'
  },
  uploadGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  fileInput: {
    padding: '8px',
    border: '2px dashed #dee2e6',
    borderRadius: '6px',
    background: '#f8f9fa',
    cursor: 'pointer'
  },
  fileName: {
    fontSize: '12px',
    color: '#28a745'
  },
  checkboxGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    borderTop: '1px solid #dee2e6',
    paddingTop: '20px'
  },
  cancelBtn: {
    padding: '12px 24px',
    background: 'white',
    color: '#6c757d',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  submitBtn: {
    padding: '12px 24px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  tips: {
    background: '#e7f3ff',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #b8daff'
  },
  tipsTitle: {
    margin: '0 0 10px 0',
    color: '#004085',
    fontSize: '16px'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#004085',
    lineHeight: '1.6'
  }
};

export default OnboardCP;
