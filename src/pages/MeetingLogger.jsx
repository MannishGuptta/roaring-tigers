import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MeetingLogger() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  
  const [formData, setFormData] = useState({
    cp_id: '',
    meeting_type: 'prospecting', // prospecting, existing_cp, client
    meeting_date: new Date().toISOString().slice(0, 16),
    outcome: '', // interested, not_interested, follow_up, deal_win
    notes: '',
    follow_up_date: '',
    follow_up_time: '',
    follow_up_notes: ''
  });

  const [dealData, setDealData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    sale_amount: '',
    product_service: '',
    invoice_number: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const rmData = sessionStorage.getItem('rm');
    if (!rmData) {
      navigate('/');
      return;
    }
    const rm = JSON.parse(rmData);
    setRm(rm);
    fetchCPs(rm.id);
  }, [navigate]);

  const fetchCPs = async (rmId) => {
    try {
      const response = await fetch('http://localhost:3002/channel_partners');
      const allCPs = await response.json();
      // Filter CPs for this RM
      const rmCPs = allCPs.filter(cp => String(cp.rm_id) === String(rmId));
      setCps(rmCPs);
    } catch (err) {
      console.error('Error fetching CPs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDealChange = (e) => {
    const { name, value } = e.target;
    setDealData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOutcomeSelect = (outcome) => {
    setFormData(prev => ({ ...prev, outcome }));
    if (outcome === 'deal_win') {
      setShowDealForm(true);
    } else {
      setShowDealForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Prepare meeting data
      const meetingData = {
        rm_id: rm.id,
        cp_id: formData.cp_id,
        meeting_type: formData.meeting_type,
        meeting_date: formData.meeting_date,
        outcome: formData.outcome,
        notes: formData.notes,
        status: formData.outcome === 'follow_up' ? 'follow_up_pending' : 'completed'
      };

      // Add follow-up if needed
      if (formData.outcome === 'follow_up' && formData.follow_up_date && formData.follow_up_time) {
        meetingData.follow_up_date = `${formData.follow_up_date}T${formData.follow_up_time}`;
        meetingData.follow_up_notes = formData.follow_up_notes;
      }

      // Save meeting
      const meetingResponse = await fetch('http://localhost:3002/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });

      if (!meetingResponse.ok) throw new Error('Failed to save meeting');
      
      const savedMeeting = await meetingResponse.json();
      console.log('Meeting saved:', savedMeeting);

      // If deal won, save the sale
      if (formData.outcome === 'deal_win') {
        const saleData = {
          rm_id: rm.id,
          cp_id: formData.cp_id,
          meeting_id: savedMeeting.id,
          client_name: dealData.client_name,
          client_phone: dealData.client_phone,
          client_email: dealData.client_email,
          sale_amount: parseFloat(dealData.sale_amount),
          product_service: dealData.product_service,
          invoice_number: dealData.invoice_number,
          sale_date: new Date().toISOString().split('T')[0],
          status: 'completed'
        };

        const saleResponse = await fetch('http://localhost:3002/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        });

        if (!saleResponse.ok) throw new Error('Failed to save sale');
        
        const savedSale = await saleResponse.json();
        console.log('Sale saved:', savedSale);
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        cp_id: '',
        meeting_type: 'prospecting',
        meeting_date: new Date().toISOString().slice(0, 16),
        outcome: '',
        notes: '',
        follow_up_date: '',
        follow_up_time: '',
        follow_up_notes: ''
      });
      setDealData({
        client_name: '',
        client_phone: '',
        client_email: '',
        sale_amount: '',
        product_service: '',
        invoice_number: ''
      });
      setShowDealForm(false);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error saving meeting:', err);
      alert('Error saving meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!rm) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📝 Log Meeting</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div style={styles.successMessage}>
          ✅ Meeting logged successfully!
          {formData.outcome === 'deal_win' && ' Deal and sale recorded!'}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* CP Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Channel Partner *</label>
          <select
            name="cp_id"
            value={formData.cp_id}
            onChange={handleChange}
            required
            style={styles.select}
          >
            <option value="">-- Select a CP --</option>
            {cps.map(cp => (
              <option key={cp.id} value={cp.id}>
                {cp.cp_name} - {cp.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Meeting Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Type *</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="meeting_type"
                value="prospecting"
                checked={formData.meeting_type === 'prospecting'}
                onChange={handleChange}
              />
              🎯 Prospecting (New CP)
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="meeting_type"
                value="existing_cp"
                checked={formData.meeting_type === 'existing_cp'}
                onChange={handleChange}
              />
              🤝 Existing CP
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="meeting_type"
                value="client"
                checked={formData.meeting_type === 'client'}
                onChange={handleChange}
              />
              👔 Client Meeting
            </label>
          </div>
        </div>

        {/* Date and Time */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Date & Time *</label>
          <input
            type="datetime-local"
            name="meeting_date"
            value={formData.meeting_date}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Notes *</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required
            rows="4"
            style={styles.textarea}
            placeholder="Enter meeting details, discussion points, etc..."
          />
        </div>

        {/* Outcome Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Outcome *</label>
          <div style={styles.outcomeGrid}>
            <button
              type="button"
              onClick={() => handleOutcomeSelect('interested')}
              style={{
                ...styles.outcomeBtn,
                background: formData.outcome === 'interested' ? '#28a745' : '#f8f9fa',
                color: formData.outcome === 'interested' ? 'white' : '#495057'
              }}
            >
              👍 Interested
            </button>
            <button
              type="button"
              onClick={() => handleOutcomeSelect('not_interested')}
              style={{
                ...styles.outcomeBtn,
                background: formData.outcome === 'not_interested' ? '#dc3545' : '#f8f9fa',
                color: formData.outcome === 'not_interested' ? 'white' : '#495057'
              }}
            >
              👎 Not Interested
            </button>
            <button
              type="button"
              onClick={() => handleOutcomeSelect('follow_up')}
              style={{
                ...styles.outcomeBtn,
                background: formData.outcome === 'follow_up' ? '#ffc107' : '#f8f9fa',
                color: formData.outcome === 'follow_up' ? 'white' : '#495057'
              }}
            >
              ⏰ Follow Up
            </button>
            <button
              type="button"
              onClick={() => handleOutcomeSelect('deal_win')}
              style={{
                ...styles.outcomeBtn,
                background: formData.outcome === 'deal_win' ? '#17a2b8' : '#f8f9fa',
                color: formData.outcome === 'deal_win' ? 'white' : '#495057'
              }}
            >
              💰 Deal Won
            </button>
          </div>
        </div>

        {/* Follow Up Fields */}
        {formData.outcome === 'follow_up' && (
          <div style={styles.followUpSection}>
            <h3 style={styles.sectionTitle}>⏰ Follow Up Details</h3>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Follow Up Date *</label>
                <input
                  type="date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Follow Up Time *</label>
                <input
                  type="time"
                  name="follow_up_time"
                  value={formData.follow_up_time}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Follow Up Notes</label>
              <textarea
                name="follow_up_notes"
                value={formData.follow_up_notes}
                onChange={handleChange}
                rows="3"
                style={styles.textarea}
                placeholder="What needs to be discussed in the follow-up?"
              />
            </div>
          </div>
        )}

        {/* Deal Win Fields */}
        {showDealForm && (
          <div style={styles.dealSection}>
            <h3 style={styles.sectionTitle}>💰 Deal Details</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Client Name *</label>
              <input
                type="text"
                name="client_name"
                value={dealData.client_name}
                onChange={handleDealChange}
                required
                style={styles.input}
                placeholder="Enter client name"
              />
            </div>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Client Phone</label>
                <input
                  type="tel"
                  name="client_phone"
                  value={dealData.client_phone}
                  onChange={handleDealChange}
                  style={styles.input}
                  placeholder="Phone number"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Client Email</label>
                <input
                  type="email"
                  name="client_email"
                  value={dealData.client_email}
                  onChange={handleDealChange}
                  style={styles.input}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sale Amount (₹) *</label>
                <input
                  type="number"
                  name="sale_amount"
                  value={dealData.sale_amount}
                  onChange={handleDealChange}
                  required
                  style={styles.input}
                  placeholder="Amount"
                  min="0"
                  step="1000"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product/Service</label>
                <input
                  type="text"
                  name="product_service"
                  value={dealData.product_service}
                  onChange={handleDealChange}
                  style={styles.input}
                  placeholder="Product or service sold"
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Invoice Number</label>
              <input
                type="text"
                name="invoice_number"
                value={dealData.invoice_number}
                onChange={handleDealChange}
                style={styles.input}
                placeholder="Invoice number (if available)"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.outcome}
            style={{
              ...styles.submitBtn,
              opacity: loading || !formData.outcome ? 0.7 : 1,
              cursor: loading || !formData.outcome ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Log Meeting'}
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
    marginBottom: '20px',
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
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#495057',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer'
  },
  outcomeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  outcomeBtn: {
    padding: '12px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  followUpSection: {
    marginTop: '20px',
    padding: '20px',
    background: '#fff3cd',
    borderRadius: '6px',
    border: '1px solid #ffeeba'
  },
  dealSection: {
    marginTop: '20px',
    padding: '20px',
    background: '#d1ecf1',
    borderRadius: '6px',
    border: '1px solid #bee5eb'
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    color: '#856404'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #dee2e6'
  },
  cancelBtn: {
    padding: '12px 24px',
    background: 'white',
    color: '#6c757d',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '12px 24px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default MeetingLogger;
