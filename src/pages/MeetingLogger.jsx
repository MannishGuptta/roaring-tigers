import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../supabaseClient';

function MeetingLogger() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_type: 'introductory',
    meeting_category: 'client',
    cp_id: '',
    client_id: '',
    notes: '',
    outcome: 'followup',
    status: 'scheduled'
  });

  // Check authentication and fetch initial data
  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userData);
    setRm(user);
    fetchData(user.id);
  }, [navigate]);

  const fetchData = async (rmId) => {
    setFetchingData(true);
    try {
      // Fetch CPs and clients for this RM
      const [cpResult, clientResult] = await Promise.all([
        supabase.from('channel_partners').select('id, name').eq('rm_id', rmId),
        supabase.from('clients').select('id, client_name').eq('rm_id', rmId)
      ]);

      if (cpResult.error) throw cpResult.error;
      if (clientResult.error) throw clientResult.error;

      setCps(cpResult.data || []);
      setClients(clientResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load required data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Reset cp_id/client_id when category changes
    if (e.target.name === 'meeting_category') {
      setFormData(prev => ({
        ...prev,
        meeting_category: e.target.value,
        cp_id: '',
        client_id: ''
      }));
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

      // Validate based on meeting category
      if (formData.meeting_category === 'cp' && !formData.cp_id) {
        throw new Error('Please select a Channel Partner');
      }
      if (formData.meeting_category === 'client' && !formData.client_id) {
        throw new Error('Please select a Client');
      }

      // Prepare meeting data for Supabase
      const meetingData = {
        rm_id: rm.id,
        meeting_date: formData.meeting_date,
        meeting_type: formData.meeting_type,
        meeting_category: formData.meeting_category,
        cp_id: formData.cp_id ? parseInt(formData.cp_id) : null,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        notes: formData.notes || null,
        outcome: formData.outcome || null,
        status: formData.status
      };

      console.log('Submitting meeting data:', meetingData);

      // Save to Supabase
      const { data, error } = await supabase
        .from('meetings')
        .insert([meetingData])
        .select();

      if (error) throw error;

      console.log('Meeting logged successfully:', data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_type: 'introductory',
        meeting_category: 'client',
        cp_id: '',
        client_id: '',
        notes: '',
        outcome: 'followup',
        status: 'scheduled'
      });

      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error logging meeting:', err);
      setError(err.message || 'Failed to log meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!rm || fetchingData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📝 Log Meeting</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>

      {success && (
        <div style={styles.successMessage}>
          ✅ Meeting logged successfully! Redirecting...
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Meeting Date */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Date *</label>
          <input
            type="date"
            name="meeting_date"
            value={formData.meeting_date}
            onChange={handleChange}
            required
            style={styles.input}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Meeting Type and Category */}
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Type *</label>
            <select
              name="meeting_type"
              value={formData.meeting_type}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="introductory">Introductory</option>
              <option value="follow-up">Follow-up</option>
              <option value="site visit">Site Visit</option>
              <option value="negotiation">Negotiation</option>
              <option value="documentation">Documentation</option>
              <option value="training">Training</option>
              <option value="review">Review</option>
              <option value="strategy">Strategy</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Category *</label>
            <select
              name="meeting_category"
              value={formData.meeting_category}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="prospect">Prospect (Potential CP)</option>
              <option value="cp">Channel Partner</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        {/* Conditional Fields based on Category */}
        {formData.meeting_category === 'cp' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Channel Partner *</label>
            <select
              name="cp_id"
              value={formData.cp_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Choose a CP...</option>
              {cps.map(cp => (
                <option key={cp.id} value={cp.id}>{cp.name}</option>
              ))}
            </select>
            {cps.length === 0 && (
              <p style={styles.warning}>
                ⚠️ No CPs found. <Link to="/onboard-cp" style={styles.link}>Onboard a CP first</Link>
              </p>
            )}
          </div>
        )}

        {formData.meeting_category === 'client' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Client *</label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Choose a Client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.client_name}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <p style={styles.warning}>⚠️ No clients found.</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Enter meeting notes, discussion points, next steps..."
            rows="4"
          />
        </div>

        {/* Outcome and Status */}
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Outcome</label>
            <select
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="followup">Follow-up Required</option>
              <option value="deal">Deal Closed</option>
              <option value="">Pending / No Decision</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={styles.buttonGroup}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={loading ? {...styles.submitBtn, ...styles.disabled} : styles.submitBtn}
          >
            {loading ? 'Logging...' : 'Log Meeting'}
          </button>
        </div>
      </form>

      {/* Tips Section */}
      <div style={styles.tips}>
        <h3 style={styles.tipsTitle}>📝 Meeting Tips:</h3>
        <ul style={styles.tipsList}>
          <li>Choose the correct meeting category (Prospect/CP/Client)</li>
          <li>Add detailed notes about discussion points</li>
          <li>Mark outcome to track meeting effectiveness</li>
          <li>Schedule follow-up meetings if needed</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh'
  },
  loading: {
    fontSize: '18px',
    color: '#666'
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
    padding: '15px',
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  errorMessage: {
    padding: '15px',
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  formGroup: {
    flex: 1,
    marginBottom: '20px'
  },
  row: {
    display: 'flex',
    gap: '20px',
    marginBottom: '0'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#495057'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '100px'
  },
  warning: {
    marginTop: '5px',
    fontSize: '12px',
    color: '#856404'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: 'white',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  submitBtn: {
    flex: 2,
    padding: '12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
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

export default MeetingLogger;
