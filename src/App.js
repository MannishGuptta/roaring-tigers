import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybtyvycgmahsxqclkgab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidHl2eWNnbWFoc3hxY2xrZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTgxNjQsImV4cCI6MjA4NzU5NDE2NH0.O3qcr39duZnFxfjTE6DwFY-eQXCLCYCVZ4ijaEFiHxs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function RecordSale() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cp_id: '',
    client_id: '',
    applicant1_name: '',
    applicant_phone: '',
    applicant_email: '',
    project_name: 'Deep Homes',
    plot_number: '',
    plot_value: '',
    booking_amount_paid: '',
    sale_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_status: 'pending',
    notes: ''
  });

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
    try {
      const [cpResult, clientResult] = await Promise.all([
        supabase.from('channel_partners').select('id, name').eq('rm_id', rmId),
        supabase.from('clients').select('id, client_name').eq('rm_id', rmId)
      ]);

      setCps(cpResult.data || []);
      setClients(clientResult.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!rm) throw new Error('Not authenticated');

      const saleData = {
        ...formData,
        rm_id: rm.id,
        cp_id: parseInt(formData.cp_id),
        client_id: parseInt(formData.client_id),
        plot_value: parseFloat(formData.plot_value) || 0,
        booking_amount_paid: parseFloat(formData.booking_amount_paid) || 0,
        amount: parseFloat(formData.amount) || 0
      };

      const { error } = await supabase
        .from('sales')
        .insert([saleData]);

      if (error) throw error;

      setSuccess(true);
      setFormData({
        cp_id: '',
        client_id: '',
        applicant1_name: '',
        applicant_phone: '',
        applicant_email: '',
        project_name: 'Deep Homes',
        plot_number: '',
        plot_value: '',
        booking_amount_paid: '',
        sale_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_status: 'pending',
        notes: ''
      });

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error recording sale:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!rm) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💰 Record Sale</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>

      {success && (
        <div style={styles.successMessage}>
          ✅ Sale recorded successfully! Redirecting...
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Channel Partner *</label>
            <select
              name="cp_id"
              value={formData.cp_id}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select CP</option>
              {cps.map(cp => (
                <option key={cp.id} value={cp.id}>{cp.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Client *</label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.client_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Applicant Name *</label>
          <input
            type="text"
            name="applicant1_name"
            value={formData.applicant1_name}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter applicant name"
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              name="applicant_phone"
              value={formData.applicant_phone}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter phone"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="applicant_email"
              value={formData.applicant_email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter email"
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Project *</label>
            <select
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="Deep Homes">Deep Homes</option>
              <option value="Deep Town Block B">Deep Town Block B</option>
              <option value="Deep City Phase 4">Deep City Phase 4</option>
              <option value="Deep City Phase 2">Deep City Phase 2</option>
              <option value="Deep Commercials">Deep Commercials</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Plot Number</label>
            <input
              type="text"
              name="plot_number"
              value={formData.plot_number}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter plot number"
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Plot Value (₹)</label>
            <input
              type="number"
              name="plot_value"
              value={formData.plot_value}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter plot value"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Booking Amount Paid (₹)</label>
            <input
              type="number"
              name="booking_amount_paid"
              value={formData.booking_amount_paid}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter booking amount"
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sale Date *</label>
            <input
              type="date"
              name="sale_date"
              value={formData.sale_date}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Sale Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter sale amount"
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Payment Status</label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Enter any additional notes..."
            rows="3"
          />
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={loading ? {...styles.submitBtn, ...styles.disabled} : styles.submitBtn}
          >
            {loading ? 'Recording...' : 'Record Sale'}
          </button>
        </div>
      </form>
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  successMessage: {
    padding: '15px',
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  errorMessage: {
    padding: '15px',
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  formGroup: {
    flex: 1,
    marginBottom: '20px'
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '0'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#495057'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
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
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  submitBtn: {
    flex: 2,
    padding: '12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

export default RecordSale;
