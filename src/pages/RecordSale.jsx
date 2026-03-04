import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../supabaseClient';

function RecordSale() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
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
    plot_size: '',
    plot_value: '',
    booking_amount_paid: '',
    booking_date: new Date().toISOString().split('T')[0],
    sale_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_status: 'pending',
    payment_mode: '',
    due_date: '',
    due_date_options: '30 days',
    discount_amount: 0,
    tax_amount: 0,
    invoice_number: '',
    notes: ''
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateAmount = () => {
    const plotValue = parseFloat(formData.plot_value) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    const tax = parseFloat(formData.tax_amount) || 0;
    return plotValue - discount + tax;
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

      // Validate required fields
      if (!formData.cp_id) throw new Error('Please select a Channel Partner');
      if (!formData.client_id) throw new Error('Please select a Client');
      if (!formData.applicant1_name) throw new Error('Please enter applicant name');
      if (!formData.amount && !formData.plot_value) throw new Error('Please enter sale amount or plot value');

      // Calculate final amount if not provided
      const saleAmount = formData.amount || calculateAmount();

      // Prepare sale data for Supabase
      const saleData = {
        rm_id: rm.id,
        cp_id: parseInt(formData.cp_id),
        client_id: parseInt(formData.client_id),
        applicant1_name: formData.applicant1_name,
        applicant_phone: formData.applicant_phone || null,
        applicant_email: formData.applicant_email || null,
        project_name: formData.project_name,
        plot_number: formData.plot_number || null,
        plot_size: parseFloat(formData.plot_size) || null,
        plot_value: parseFloat(formData.plot_value) || 0,
        booking_amount_paid: parseFloat(formData.booking_amount_paid) || 0,
        booking_date: formData.booking_date || null,
        sale_date: formData.sale_date,
        amount: parseFloat(saleAmount),
        payment_status: formData.payment_status,
        payment_mode: formData.payment_mode || null,
        due_date: formData.due_date || null,
        due_date_options: formData.due_date_options,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null
      };

      console.log('Submitting sale data:', saleData);

      // Save to Supabase
      const { data, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select();

      if (error) throw error;

      console.log('Sale recorded successfully:', data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        cp_id: '',
        client_id: '',
        applicant1_name: '',
        applicant_phone: '',
        applicant_email: '',
        project_name: 'Deep Homes',
        plot_number: '',
        plot_size: '',
        plot_value: '',
        booking_amount_paid: '',
        booking_date: new Date().toISOString().split('T')[0],
        sale_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_status: 'pending',
        payment_mode: '',
        due_date: '',
        due_date_options: '30 days',
        discount_amount: 0,
        tax_amount: 0,
        invoice_number: '',
        notes: ''
      });

      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error recording sale:', err);
      setError(err.message || 'Failed to record sale. Please try again.');
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
        <h1 style={styles.title}>💰 Record New Sale</h1>
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
        {/* Party Selection */}
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Channel Partner *</label>
            <select
              name="cp_id"
              value={formData.cp_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select CP</option>
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Client *</label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.client_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Applicant Details */}
        <div style={styles.sectionTitle}>Applicant Details</div>
        
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

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              name="applicant_phone"
              value={formData.applicant_phone}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter phone number"
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
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Project Details */}
        <div style={styles.sectionTitle}>Project Details</div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Project *</label>
            <select
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              required
              style={styles.select}
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

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Plot Size (sq ft)</label>
            <input
              type="number"
              name="plot_size"
              value={formData.plot_size}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter plot size"
            />
          </div>

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
        </div>

        {/* Financial Details */}
        <div style={styles.sectionTitle}>Financial Details</div>

        <div style={styles.row}>
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Booking Date</label>
            <input
              type="date"
              name="booking_date"
              value={formData.booking_date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sale Date *</label>
            <input
              type="date"
              name="sale_date"
              value={formData.sale_date}
              onChange={handleChange}
              required
              style={styles.input}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Sale Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              style={styles.input}
              placeholder="Leave blank to auto-calculate"
            />
            <small style={styles.helperText}>
              Auto-calculated: Plot Value - Discount + Tax
            </small>
          </div>
        </div>

        {/* Payment Details */}
        <div style={styles.sectionTitle}>Payment Details</div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Status</label>
            <select
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Mode</label>
            <select
              name="payment_mode"
              value={formData.payment_mode}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select Mode</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Due Date Options</label>
            <select
              name="due_date_options"
              value={formData.due_date_options}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="30 days">30 days</option>
              <option value="45 days">45 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Discount Amount (₹)</label>
            <input
              type="number"
              name="discount_amount"
              value={formData.discount_amount}
              onChange={handleChange}
              style={styles.input}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tax Amount (₹)</label>
            <input
              type="number"
              name="tax_amount"
              value={formData.tax_amount}
              onChange={handleChange}
              style={styles.input}
              min="0"
            />
          </div>
        </div>

        {/* Invoice & Notes */}
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Invoice Number</label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter invoice number"
            />
          </div>
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
            {loading ? 'Recording...' : 'Record Sale'}
          </button>
        </div>
      </form>

      {/* Tips Section */}
      <div style={styles.tips}>
        <h3 style={styles.tipsTitle}>📝 Sale Recording Tips:</h3>
        <ul style={styles.tipsList}>
          <li>Select the correct Channel Partner and Client</li>
          <li>Enter accurate plot and payment details</li>
          <li>Sale amount auto-calculates from plot value - discount + tax</li>
          <li>Set due date for balance payment tracking</li>
          <li>Add invoice number for future reference</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
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
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#495057',
    margin: '20px 0 15px 0',
    paddingBottom: '5px',
    borderBottom: '2px solid #e9ecef'
  },
  formGroup: {
    flex: 1,
    marginBottom: '15px'
  },
  row: {
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
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '80px'
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
  helperText: {
    fontSize: '11px',
    color: '#666',
    marginTop: '3px',
    display: 'block'
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

export default RecordSale;
