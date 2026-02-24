import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RecordSale() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showManualProject, setShowManualProject] = useState(false);
  const [showManualUnit, setShowManualUnit] = useState(false);
  const [showManualPaymentPlan, setShowManualPaymentPlan] = useState(false);
  
  const [formData, setFormData] = useState({
    // Link to CP (automatically linked to RM)
    cp_id: '',
    
    // Applicant Details (property owner)
    applicant_name: '',
    applicant_phone: '',
    
    // Payer Details (can be different from applicant)
    payer_name: '',
    payer_phone: '',
    payer_email: '',
    payer_address: '',
    
    // Property Details
    sale_date: new Date().toISOString().split('T')[0],
    project_name: '',
    manual_project: '',
    unit_type: 'plot',
    manual_unit_type: '',
    plot_size: '',
    number_of_plots: '1',
    unit_number: '',
    
    // Financial Details
    sale_amount: '',
    booking_amount: '',
    
    // Payment Plan
    payment_plan: '',
    manual_payment_plan: '',
    
    // Payment Details
    payment_mode: '',
    manual_payment_mode: '',
    payment_reference: '',
    payment_date: '',
    
    // Commission
    commission_amount: '',
    
    // Additional
    notes: '',
    status: 'completed'
  });

  const navigate = useNavigate();

  // Project Options
  const projectOptions = [
    { value: 'deep_city_homes', label: 'Deep City Homes' },
    { value: 'deep_town_block_b', label: 'Deep Town Block B' },
    { value: 'deep_city_phase_2', label: 'Deep City Phase 2' },
    { value: 'deep_city_phase_4', label: 'Deep City Phase 4' },
    { value: 'deep_commercials', label: 'Deep Commercials' },
    { value: 'others', label: 'Others' }
  ];

  // Unit Type Options (simplified)
  const unitTypeOptions = [
    { value: 'plot', label: 'Plot' },
    { value: 'others', label: 'Others' }
  ];

  // Payment Plan Options (simplified)
  const paymentPlanOptions = [
    { value: '30_days', label: '30 Days' },
    { value: '45_days', label: '45 Days' },
    { value: '60_days', label: '60 Days' },
    { value: 'others', label: 'Others' }
  ];

  // Payment Mode Options
  const paymentModeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' },
    { value: 'others', label: 'Others' }
  ];

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
      const response = await fetch('https://roaring-tigers-backend.onrender.com/channel_partners');
      const allCPs = await response.json();
      const rmCPs = allCPs.filter(cp => String(cp.rm_id) === String(rmId));
      setCps(rmCPs);
    } catch (err) {
      console.error('Error fetching CPs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle "Others" options
    if (name === 'project_name') {
      setShowManualProject(value === 'others');
    }
    if (name === 'unit_type') {
      setShowManualUnit(value === 'others');
    }
    if (name === 'payment_plan') {
      setShowManualPaymentPlan(value === 'others');
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Prepare final values
      const finalProject = formData.project_name === 'others' ? formData.manual_project : formData.project_name;
      const finalUnitType = formData.unit_type === 'others' ? formData.manual_unit_type : formData.unit_type;
      const finalPaymentPlan = formData.payment_plan === 'others' ? formData.manual_payment_plan : formData.payment_plan;

      const saleData = {
        ...formData,
        rm_id: rm.id,
        project_name: finalProject,
        unit_type: finalUnitType,
        payment_plan: finalPaymentPlan,
        sale_amount: parseFloat(formData.sale_amount) || 0,
        booking_amount: parseFloat(formData.booking_amount) || 0,
        commission_amount: parseFloat(formData.commission_amount) || 0,
        number_of_plots: parseInt(formData.number_of_plots) || 1,
        sale_date: formData.sale_date,
        payment_date: formData.payment_date || formData.sale_date,
        status: 'completed'
      };

      console.log('Submitting sale:', saleData);

      const response = await fetch('https://roaring-tigers-backend.onrender.com/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) throw new Error('Failed to save sale');

      setSuccess(true);
      
      // Reset form
      setFormData({
        cp_id: '',
        applicant_name: '',
        applicant_phone: '',
        payer_name: '',
        payer_phone: '',
        payer_email: '',
        payer_address: '',
        sale_date: new Date().toISOString().split('T')[0],
        project_name: '',
        manual_project: '',
        unit_type: 'plot',
        manual_unit_type: '',
        plot_size: '',
        number_of_plots: '1',
        unit_number: '',
        sale_amount: '',
        booking_amount: '',
        payment_plan: '',
        manual_payment_plan: '',
        payment_mode: '',
        manual_payment_mode: '',
        payment_reference: '',
        payment_date: '',
        commission_amount: '',
        notes: '',
        status: 'completed'
      });

      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error saving sale:', err);
      alert('Error saving sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!rm) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>💰 Record New Sale</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div style={styles.successMessage}>
          ✅ Sale recorded successfully!
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Link to CP */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Channel Partner</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Channel Partner *</label>
            <select
              name="cp_id"
              value={formData.cp_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">-- Select CP --</option>
              {cps.map(cp => (
                <option key={cp.id} value={cp.id}>
                  {cp.cp_name} - {cp.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applicant Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Applicant (Property Owner)</h3>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Applicant Name *</label>
              <input
                type="text"
                name="applicant_name"
                value={formData.applicant_name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Full name of property owner"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Applicant Phone *</label>
              <input
                type="tel"
                name="applicant_phone"
                value={formData.applicant_phone}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>

        {/* Payer Details (Optional - if different from applicant) */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Payer Details (if different from applicant)</h3>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payer Name</label>
              <input
                type="text"
                name="payer_name"
                value={formData.payer_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Person making payment"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payer Phone</label>
              <input
                type="tel"
                name="payer_phone"
                value={formData.payer_phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="Phone number"
              />
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payer Email</label>
              <input
                type="email"
                name="payer_email"
                value={formData.payer_email}
                onChange={handleChange}
                style={styles.input}
                placeholder="Email address"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payer Address</label>
              <input
                type="text"
                name="payer_address"
                value={formData.payer_address}
                onChange={handleChange}
                style={styles.input}
                placeholder="Address"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Property Details</h3>
          
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
                <option value="">-- Select Project --</option>
                {projectOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {showManualProject && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Specify Project</label>
                <input
                  type="text"
                  name="manual_project"
                  value={formData.manual_project}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Enter project name"
                />
              </div>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Type *</label>
              <select
                name="unit_type"
                value={formData.unit_type}
                onChange={handleChange}
                required
                style={styles.select}
              >
                {unitTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {showManualUnit && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Specify Unit Type</label>
                <input
                  type="text"
                  name="manual_unit_type"
                  value={formData.manual_unit_type}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Enter unit type"
                />
              </div>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Plot Size</label>
              <input
                type="text"
                name="plot_size"
                value={formData.plot_size}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 200 sq yards"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Plots</label>
              <input
                type="number"
                name="number_of_plots"
                value={formData.number_of_plots}
                onChange={handleChange}
                min="1"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Plot/Unit Number</label>
            <input
              type="text"
              name="unit_number"
              value={formData.unit_number}
              onChange={handleChange}
              style={styles.input}
              placeholder="Plot/Unit number"
            />
          </div>
        </div>

        {/* Financial Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Financial Details</h3>
          
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Sale Amount (₹) *</label>
              <input
                type="number"
                name="sale_amount"
                value={formData.sale_amount}
                onChange={handleChange}
                required
                style={styles.input}
                min="0"
                step="1000"
                placeholder="Total sale value"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Booking Amount (₹)</label>
              <input
                type="number"
                name="booking_amount"
                value={formData.booking_amount}
                onChange={handleChange}
                style={styles.input}
                min="0"
                step="1000"
                placeholder="Amount paid at booking"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Payment Details</h3>
          
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Plan *</label>
              <select
                name="payment_plan"
                value={formData.payment_plan}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">-- Select Payment Plan --</option>
                {paymentPlanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {showManualPaymentPlan && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Specify Payment Plan</label>
                <input
                  type="text"
                  name="manual_payment_plan"
                  value={formData.manual_payment_plan}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Enter payment plan"
                />
              </div>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Mode *</label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">-- Select Payment Mode --</option>
                {paymentModeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Reference</label>
              <input
                type="text"
                name="payment_reference"
                value={formData.payment_reference}
                onChange={handleChange}
                style={styles.input}
                placeholder="Cheque/Transaction ID"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Date</label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* Commission */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Commission</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Commission Amount (₹)</label>
            <input
              type="number"
              name="commission_amount"
              value={formData.commission_amount}
              onChange={handleChange}
              style={styles.input}
              min="0"
              step="100"
              placeholder="Commission for CP"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Additional Information</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Sale Date</label>
            <input
              type="date"
              name="sale_date"
              value={formData.sale_date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Any additional notes about the sale"
              rows="3"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'wait' : 'pointer'
          }}>
            {loading ? 'Recording Sale...' : 'Record Sale'}
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
  section: {
    marginBottom: '30px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    color: '#495057',
    borderBottom: '2px solid #dee2e6',
    paddingBottom: '10px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px'
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
    padding: '10px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white'
  },
  textarea: {
    padding: '10px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
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

export default RecordSale;
