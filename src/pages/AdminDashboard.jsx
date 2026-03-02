import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// At the top of the file, right after imports
console.log('AdminDashboard.jsx loaded');

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month'); // 'today', 'week', 'month'
  const [rms, setRms] = useState([]);
  const [cps, setCps] = useState([]);
  const [sales, setSales] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [targets, setTargets] = useState([]);
  const [rmPerformance, setRmPerformance] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [kpiAnalysis, setKpiAnalysis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showRMModal, setShowRMModal] = useState(false);
  const [showCPModal, setShowCPModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showTransferCPModal, setShowTransferCPModal] = useState(false);
  const [showTransferSalesModal, setShowTransferSalesModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [rmForm, setRmForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    status: 'active'
  });

  const [cpForm, setCpForm] = useState({
    cp_name: '',
    phone: '',
    email: '',
    address: '',
    cp_type: 'individual',
    operating_markets: '',
    industry: '',
    expected_monthly_business: '',
    rm_id: '',
    status: 'active',
    onboard_date: new Date().toISOString().split('T')[0]
  });

  const [salesForm, setSalesForm] = useState({
    rm_id: '',
    cp_id: '',
    applicant_name: '',
    applicant_phone: '',
    applicant_email: '',
    project_name: '',
    plot_number: '',
    plot_size: '',
    plot_value: '',
    booking_amount_paid: '',
    booking_date: new Date().toISOString().split('T')[0],
    sale_date: new Date().toISOString().split('T')[0],
    sale_amount: '',
    payment_status: 'pending',
    due_date: '',
    due_date_options: '30 days',
    discount_amount: 0,
    tax_amount: 0,
    invoice_number: '',
    notes: ''
  });

  const [targetForm, setTargetForm] = useState({
    rm_id: '',
    period: '',
    cp_onboarding_target: '',
    active_cp_target: '',
    meetings_target: '',
    revenue_target: ''
  });

  const [transferCPForm, setTransferCPForm] = useState({
    cp_id: '',
    from_rm_id: '',
    to_rm_id: ''
  });

  const [transferSalesForm, setTransferSalesForm] = useState({
    sale_id: '',
    from_cp_id: '',
    to_cp_id: ''
  });

  const navigate = useNavigate();
  const API_URL = 'https://roaring-tigers-backend.onrender.com';

  // ============= HANDLER FUNCTIONS =============
  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    navigate('/admin');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#28a745';
    if (percentage >= 80) return '#ffc107';
    if (percentage >= 50) return '#fd7e14';
    return '#dc3545';
  };

  const getPeriodLabel = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'This Month';
    }
  };

  const getDateRange = (range) => {
    const today = new Date();
    let startDate = new Date();
    
    switch(range) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        // Week starts on Monday
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(today.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    return startDate;
  };

  const getCurrentPeriod = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  // Load all data function
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${API_URL}/rms`),
        fetch(`${API_URL}/channel_partners`),
        fetch(`${API_URL}/sales`),
        fetch(`${API_URL}/meetings`),
        fetch(`${API_URL}/kpi_targets`)
      ]);
      
      const rmsData = await rmsRes.json() || [];
      const cpsData = await cpsRes.json() || [];
      const salesData = await salesRes.json() || [];
      const meetingsData = await meetingsRes.json() || [];
      const targetsData = await targetsRes.json() || [];
      
      setRms(rmsData);
      setCps(cpsData);
      setSales(salesData);
      setMeetings(meetingsData);
      setTargets(targetsData);
      
      // Calculate RM performance with time range
      calculateRmPerformance(rmsData, cpsData, salesData, meetingsData, targetsData, timeRange);
      
      // Calculate team stats
      calculateTeamStats(rmsData, cpsData, salesData, meetingsData, timeRange);
      
      // Calculate KPI analysis
      calculateKPIAnalysis(rmsData, cpsData, salesData, meetingsData, targetsData, timeRange);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    loadAllData();
  }, [navigate, timeRange]);

  // ============= CALCULATION FUNCTIONS =============
  const calculateRmPerformance = (rmsData, cpsData, salesData, meetingsData, targetsData, range) => {
    const startDate = getDateRange(range);
    
    const performance = rmsData.map(rm => {
      const rmId = String(rm.id);
      
      // Get RM's CPs
      const rmCPs = cpsData.filter(cp => String(cp.rm_id) === rmId);
      
      // Get RM's sales in date range
      const rmSales = salesData.filter(sale => 
        String(sale.rm_id) === rmId && 
        new Date(sale.sale_date) >= startDate
      );
      
      // Get RM's meetings in date range
      const rmMeetings = meetingsData.filter(meeting => 
        String(meeting.rm_id) === rmId && 
        new Date(meeting.meeting_date) >= startDate
      );
      
      // CPs onboarded in date range
      const rmCPsOnboarded = rmCPs.filter(cp => 
        cp.onboard_date && new Date(cp.onboard_date) >= startDate
      );
      
      // Calculate active CPs (CPs with sales in date range)
      const cpWithSales = new Set();
      rmSales.forEach(sale => {
        if (sale.cp_id) cpWithSales.add(String(sale.cp_id));
      });
      const activeCPs = cpWithSales.size;
      
      // Get current period targets from kpi_targets
      const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      
      // Get all targets for this RM for current month
      const rmKpiTargets = targetsData.filter(t => 
        String(t.rm_id) === rmId && 
        t.target_month && t.target_month.startsWith(currentMonth)
      );
      
      // Extract weekly and monthly targets based on time range
      let cpTarget = 0;
      let activeTarget = 0;
      let meetingsTarget = 0;
      let revenueTarget = 0;
      
      if (range === 'week') {
        // For week view, use weekly_target
        cpTarget = rmKpiTargets.find(t => t.kpi_type === 'cp_onboarded')?.weekly_target || 0;
        activeTarget = rmKpiTargets.find(t => t.kpi_type === 'cp_active')?.weekly_target || 0;
        meetingsTarget = rmKpiTargets.find(t => t.kpi_type === 'meetings')?.weekly_target || 0;
        revenueTarget = rmKpiTargets.find(t => t.kpi_type === 'sales_amount')?.weekly_target || 0;
      } else if (range === 'today') {
        // For today view, calculate daily from weekly
        const weekTarget = rmKpiTargets.find(t => t.kpi_type === 'cp_onboarded')?.weekly_target || 0;
        cpTarget = Math.round(weekTarget / 7);
        activeTarget = Math.round((rmKpiTargets.find(t => t.kpi_type === 'cp_active')?.weekly_target || 0) / 7);
        meetingsTarget = Math.round((rmKpiTargets.find(t => t.kpi_type === 'meetings')?.weekly_target || 0) / 7);
        revenueTarget = Math.round((rmKpiTargets.find(t => t.kpi_type === 'sales_amount')?.weekly_target || 0) / 7);
      } else {
        // For month view, use monthly_target
        cpTarget = rmKpiTargets.find(t => t.kpi_type === 'cp_onboarded')?.monthly_target || 0;
        activeTarget = rmKpiTargets.find(t => t.kpi_type === 'cp_active')?.monthly_target || 0;
        meetingsTarget = rmKpiTargets.find(t => t.kpi_type === 'meetings')?.monthly_target || 0;
        revenueTarget = rmKpiTargets.find(t => t.kpi_type === 'sales_amount')?.monthly_target || 0;
      }
      
      // Calculate achievements
      const achievements = {
        cp_onboarding: rmCPsOnboarded.length,
        active_cp: activeCPs,
        meetings: rmMeetings.length,
        revenue: rmSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
      };
      
      // Calculate percentages vs target
      const percentages = {
        cp_onboarding: cpTarget ? Math.round((achievements.cp_onboarding / cpTarget) * 100) : 0,
        active_cp: activeTarget ? Math.round((achievements.active_cp / activeTarget) * 100) : 0,
        meetings: meetingsTarget ? Math.round((achievements.meetings / meetingsTarget) * 100) : 0,
        revenue: revenueTarget ? Math.round((achievements.revenue / revenueTarget) * 100) : 0
      };
      
      // Calculate remaining days and required daily rates
      const today = new Date();
      const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
      const totalDays = range === 'today' ? 1 : range === 'week' ? 7 : 
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysRemaining = totalDays - daysElapsed;
      
      // Calculate required daily rate to meet target
      const requiredDaily = {
        cp_onboarding: cpTarget ? (cpTarget - achievements.cp_onboarding) / Math.max(1, daysRemaining) : 0,
        active_cp: activeTarget ? (activeTarget - achievements.active_cp) / Math.max(1, daysRemaining) : 0,
        meetings: meetingsTarget ? (meetingsTarget - achievements.meetings) / Math.max(1, daysRemaining) : 0,
        revenue: revenueTarget ? (revenueTarget - achievements.revenue) / Math.max(1, daysRemaining) : 0
      };
      
      // Determine status
      const avgPercentage = Object.values(percentages).reduce((a, b) => a + b, 0) / 4;
      let status = '🔴 Off Track';
      if (avgPercentage >= 100) status = '✅ Achieved';
      else if (avgPercentage >= 80) status = '⚠️ At Risk';
      else if (avgPercentage >= 50) status = '📉 Behind';
      
      return {
        ...rm,
        achievements,
        targets: {
          cp_onboarding_target: cpTarget,
          active_cp_target: activeTarget,
          meetings_target: meetingsTarget,
          revenue_target: revenueTarget
        },
        percentages,
        requiredDaily,
        status,
        avgPercentage,
        daysRemaining
      };
    });
    
    setRmPerformance(performance);
  };

  const calculateTeamStats = (rmsData, cpsData, salesData, meetingsData, range) => {
    const startDate = getDateRange(range);
    
    const stats = {
      totalRMs: rmsData.length,
      totalCPs: cpsData.length,
      totalSales: salesData.length,
      totalMeetings: meetingsData.length,
      totalRevenue: salesData.reduce((sum, s) => sum + (s.sale_amount || 0), 0),
      
      periodStats: {
        cp_onboarding: cpsData.filter(cp => cp.onboard_date && new Date(cp.onboard_date) >= startDate).length,
        sales: salesData.filter(sale => new Date(sale.sale_date) >= startDate).length,
        meetings: meetingsData.filter(meeting => new Date(meeting.meeting_date) >= startDate).length,
        revenue: salesData.filter(sale => new Date(sale.sale_date) >= startDate)
                         .reduce((sum, s) => sum + (s.sale_amount || 0), 0)
      },
      
      activeCPs: new Set(salesData.map(s => s.cp_id)).size,
      
      topPerformer: null,
      needsAttention: []
    };
    
    // Find top performer and those needing attention
    if (rmPerformance.length > 0) {
      const sorted = [...rmPerformance].sort((a, b) => b.avgPercentage - a.avgPercentage);
      stats.topPerformer = sorted[0];
      stats.needsAttention = sorted.filter(rm => rm.avgPercentage < 50);
    }
    
    setTeamStats(stats);
  };

  const calculateKPIAnalysis = (rmsData, cpsData, salesData, meetingsData, targetsData, range) => {
    const startDate = getDateRange(range);
    const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM
    
    // Get all kpi_targets for current month
    const monthTargets = targetsData.filter(t => 
      t.target_month && t.target_month.startsWith(currentMonth)
    );
    
    // Aggregate team targets based on time range
    let teamTargets = {
      cp_onboarding: 0,
      active_cp: 0,
      meetings: 0,
      revenue: 0
    };
    
    if (range === 'week') {
      // Sum weekly targets
      teamTargets.cp_onboarding = monthTargets
        .filter(t => t.kpi_type === 'cp_onboarded')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      teamTargets.active_cp = monthTargets
        .filter(t => t.kpi_type === 'cp_active')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      teamTargets.meetings = monthTargets
        .filter(t => t.kpi_type === 'meetings')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      teamTargets.revenue = monthTargets
        .filter(t => t.kpi_type === 'sales_amount')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
    } else if (range === 'today') {
      // Sum daily targets (weekly / 7)
      const weeklyCP = monthTargets
        .filter(t => t.kpi_type === 'cp_onboarded')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      const weeklyActive = monthTargets
        .filter(t => t.kpi_type === 'cp_active')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      const weeklyMeetings = monthTargets
        .filter(t => t.kpi_type === 'meetings')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      const weeklyRevenue = monthTargets
        .filter(t => t.kpi_type === 'sales_amount')
        .reduce((sum, t) => sum + (t.weekly_target || 0), 0);
      
      teamTargets.cp_onboarding = Math.round(weeklyCP / 7);
      teamTargets.active_cp = Math.round(weeklyActive / 7);
      teamTargets.meetings = Math.round(weeklyMeetings / 7);
      teamTargets.revenue = Math.round(weeklyRevenue / 7);
    } else {
      // Sum monthly targets
      teamTargets.cp_onboarding = monthTargets
        .filter(t => t.kpi_type === 'cp_onboarded')
        .reduce((sum, t) => sum + (t.monthly_target || 0), 0);
      teamTargets.active_cp = monthTargets
        .filter(t => t.kpi_type === 'cp_active')
        .reduce((sum, t) => sum + (t.monthly_target || 0), 0);
      teamTargets.meetings = monthTargets
        .filter(t => t.kpi_type === 'meetings')
        .reduce((sum, t) => sum + (t.monthly_target || 0), 0);
      teamTargets.revenue = monthTargets
        .filter(t => t.kpi_type === 'sales_amount')
        .reduce((sum, t) => sum + (t.monthly_target || 0), 0);
    }
    
    // Calculate team achievements in date range
    const teamAchievements = {
      cp_onboarding: cpsData.filter(cp => cp.onboard_date && new Date(cp.onboard_date) >= startDate).length,
      active_cp: new Set(salesData.filter(s => new Date(s.sale_date) >= startDate).map(s => s.cp_id)).size,
      meetings: meetingsData.filter(m => new Date(m.meeting_date) >= startDate).length,
      revenue: salesData.filter(s => new Date(s.sale_date) >= startDate)
                       .reduce((sum, s) => sum + (s.sale_amount || 0), 0)
    };
    
    // Calculate percentages
    const percentages = {
      cp_onboarding: teamTargets.cp_onboarding ? Math.round((teamAchievements.cp_onboarding / teamTargets.cp_onboarding) * 100) : 0,
      active_cp: teamTargets.active_cp ? Math.round((teamAchievements.active_cp / teamTargets.active_cp) * 100) : 0,
      meetings: teamTargets.meetings ? Math.round((teamAchievements.meetings / teamTargets.meetings) * 100) : 0,
      revenue: teamTargets.revenue ? Math.round((teamAchievements.revenue / teamTargets.revenue) * 100) : 0
    };
    
    // Calculate remaining days and required daily rates
    const today = new Date();
    const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = range === 'today' ? 1 : range === 'week' ? 7 : 
      new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDays - daysElapsed;
    
    const requiredDaily = {
      cp_onboarding: (teamTargets.cp_onboarding - teamAchievements.cp_onboarding) / Math.max(1, daysRemaining),
      active_cp: (teamTargets.active_cp - teamAchievements.active_cp) / Math.max(1, daysRemaining),
      meetings: (teamTargets.meetings - teamAchievements.meetings) / Math.max(1, daysRemaining),
      revenue: (teamTargets.revenue - teamAchievements.revenue) / Math.max(1, daysRemaining)
    };
    
    // Predict end of period values
    const projectedValues = {
      cp_onboarding: teamAchievements.cp_onboarding + (requiredDaily.cp_onboarding * daysRemaining),
      active_cp: teamAchievements.active_cp + (requiredDaily.active_cp * daysRemaining),
      meetings: teamAchievements.meetings + (requiredDaily.meetings * daysRemaining),
      revenue: teamAchievements.revenue + (requiredDaily.revenue * daysRemaining)
    };
    
    // Generate recommendations based on percentages
    const recommendations = {};
    
    if (percentages.cp_onboarding < 80) {
      recommendations.cp_onboarding = {
        gap: teamTargets.cp_onboarding - teamAchievements.cp_onboarding,
        dailyNeeded: requiredDaily.cp_onboarding.toFixed(1),
        action: requiredDaily.cp_onboarding > 2 ? 
          "Urgent: Need to significantly increase CP onboarding. Focus on high-potential leads." :
          "Focus on converting interested prospects to onboarded CPs."
      };
    }
    
    if (percentages.active_cp < 80) {
      recommendations.active_cp = {
        gap: teamTargets.active_cp - teamAchievements.active_cp,
        dailyNeeded: requiredDaily.active_cp.toFixed(1),
        action: "Work with CPs who have shown interest to close their first deals."
      };
    }
    
    if (percentages.meetings < 80) {
      recommendations.meetings = {
        gap: teamTargets.meetings - teamAchievements.meetings,
        dailyNeeded: requiredDaily.meetings.toFixed(1),
        action: requiredDaily.meetings > 3 ?
          "Increase meeting frequency. Block dedicated prospecting time daily." :
          "Maintain current meeting pace with quality focus."
      };
    }
    
    if (percentages.revenue < 80) {
      recommendations.revenue = {
        gap: formatCurrency(teamTargets.revenue - teamAchievements.revenue),
        dailyNeeded: formatCurrency(requiredDaily.revenue),
        action: requiredDaily.revenue > 100000 ?
          "Focus on high-value deals and follow up on pending proposals." :
          "Push for closing smaller deals quickly to build momentum."
      };
    }
    
    setKpiAnalysis({
      teamTargets,
      teamAchievements,
      percentages,
      requiredDaily,
      projectedValues,
      recommendations,
      daysRemaining
    });
  };

  // ============= CRUD HANDLERS =============
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await fetch(`${API_URL}/${type}/${id}`, { method: 'DELETE' });
      loadAllData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Error deleting item');
    }
  };

  // RM Handlers
  const handleAddRM = () => {
    setEditingItem(null);
    setRmForm({ name: '', phone: '', email: '', password: '', status: 'active' });
    setShowRMModal(true);
  };

  const handleEditRM = (rm) => {
    setEditingItem(rm);
    setRmForm({
      name: rm.name,
      phone: rm.phone,
      email: rm.email,
      password: '',
      status: rm.status
    });
    setShowRMModal(true);
  };

  const handleRMSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/rms/${editingItem.id}` : `${API_URL}/rms`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rmForm)
      });
      
      if (response.ok) {
        setShowRMModal(false);
        await loadAllData();
        alert('RM saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to save RM:', errorText);
        alert('Failed to save RM');
      }
    } catch (err) {
      console.error('Error saving RM:', err);
      alert('Error saving RM: ' + err.message);
    }
  };

  // CP Handlers
  const handleAddCP = () => {
    setEditingItem(null);
    setCpForm({
      cp_name: '',
      phone: '',
      email: '',
      address: '',
      cp_type: 'individual',
      operating_markets: '',
      industry: '',
      expected_monthly_business: '',
      rm_id: rms.length > 0 ? rms[0].id : '',
      status: 'active',
      onboard_date: new Date().toISOString().split('T')[0]
    });
    setShowCPModal(true);
  };

  const handleEditCP = (cp) => {
    setEditingItem(cp);
    setCpForm({
      cp_name: cp.cp_name,
      phone: cp.phone,
      email: cp.email || '',
      address: cp.address || '',
      cp_type: cp.cp_type,
      operating_markets: cp.operating_markets || '',
      industry: cp.industry || '',
      expected_monthly_business: cp.expected_monthly_business || '',
      rm_id: cp.rm_id,
      status: cp.status,
      onboard_date: cp.onboard_date || new Date().toISOString().split('T')[0]
    });
    setShowCPModal(true);
  };

  const handleCPSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/channel_partners/${editingItem.id}` : `${API_URL}/channel_partners`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpForm)
      });
      
      if (response.ok) {
        setShowCPModal(false);
        await loadAllData();
        alert('CP saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to save CP:', errorText);
        alert('Failed to save CP');
      }
    } catch (err) {
      console.error('Error saving CP:', err);
      alert('Error saving CP: ' + err.message);
    }
  };

  // Transfer CP Handler
  const handleOpenTransferCP = (cp) => {
    setTransferCPForm({
      cp_id: cp.id,
      from_rm_id: cp.rm_id,
      to_rm_id: cp.rm_id
    });
    setShowTransferCPModal(true);
  };

  const handleTransferCP = async (e) => {
    e.preventDefault();
    if (transferCPForm.from_rm_id === transferCPForm.to_rm_id) {
      alert('Please select a different RM to transfer to');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/channel_partners/${transferCPForm.cp_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rm_id: transferCPForm.to_rm_id })
      });
      
      if (response.ok) {
        setShowTransferCPModal(false);
        await loadAllData();
        alert('CP transferred successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to transfer CP:', errorText);
        alert('Failed to transfer CP');
      }
    } catch (err) {
      console.error('Error transferring CP:', err);
      alert('Error transferring CP: ' + err.message);
    }
  };

  // Sales Handlers
  const handleAddSale = () => {
    setEditingItem(null);
    setSalesForm({
      rm_id: rms.length > 0 ? rms[0].id : '',
      cp_id: cps.length > 0 ? cps[0].id : '',
      applicant_name: '',
      applicant_phone: '',
      applicant_email: '',
      project_name: '',
      plot_number: '',
      plot_size: '',
      plot_value: '',
      booking_amount_paid: '',
      booking_date: new Date().toISOString().split('T')[0],
      sale_date: new Date().toISOString().split('T')[0],
      sale_amount: '',
      payment_status: 'pending',
      due_date: '',
      due_date_options: '30 days',
      discount_amount: 0,
      tax_amount: 0,
      invoice_number: '',
      notes: ''
    });
    setShowSalesModal(true);
  };

  const handleEditSale = (sale) => {
    setEditingItem(sale);
    setSalesForm({
      rm_id: sale.rm_id,
      cp_id: sale.cp_id,
      applicant_name: sale.applicant_name || '',
      applicant_phone: sale.applicant_phone || '',
      applicant_email: sale.applicant_email || '',
      project_name: sale.project_name || '',
      plot_number: sale.plot_number || '',
      plot_size: sale.plot_size || '',
      plot_value: sale.plot_value || '',
      booking_amount_paid: sale.booking_amount_paid || '',
      booking_date: sale.booking_date || new Date().toISOString().split('T')[0],
      sale_date: sale.sale_date || new Date().toISOString().split('T')[0],
      sale_amount: sale.sale_amount || '',
      payment_status: sale.payment_status || 'pending',
      due_date: sale.due_date || '',
      due_date_options: sale.due_date_options || '30 days',
      discount_amount: sale.discount_amount || 0,
      tax_amount: sale.tax_amount || 0,
      invoice_number: sale.invoice_number || '',
      notes: sale.notes || ''
    });
    setShowSalesModal(true);
  };

  const handleSaleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/sales/${editingItem.id}` : `${API_URL}/sales`;
      const method = editingItem ? 'PUT' : 'POST';
      
      // Calculate amount if not provided
      const saleAmount = salesForm.sale_amount || 
        (salesForm.plot_value ? parseFloat(salesForm.plot_value) - (parseFloat(salesForm.discount_amount) || 0) : 0);
      
      const saleData = {
        ...salesForm,
        sale_amount: saleAmount,
        rm_id: parseInt(salesForm.rm_id),
        cp_id: parseInt(salesForm.cp_id),
        plot_value: parseFloat(salesForm.plot_value) || 0,
        plot_size: parseFloat(salesForm.plot_size) || 0,
        booking_amount_paid: parseFloat(salesForm.booking_amount_paid) || 0,
        discount_amount: parseFloat(salesForm.discount_amount) || 0,
        tax_amount: parseFloat(salesForm.tax_amount) || 0
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      
      if (response.ok) {
        setShowSalesModal(false);
        await loadAllData();
        alert('Sale saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to save sale:', errorText);
        alert('Failed to save sale');
      }
    } catch (err) {
      console.error('Error saving sale:', err);
      alert('Error saving sale: ' + err.message);
    }
  };

  // Transfer Sale Handler
  const handleOpenTransferSale = (sale) => {
    setTransferSalesForm({
      sale_id: sale.id,
      from_cp_id: sale.cp_id,
      to_cp_id: sale.cp_id
    });
    setShowTransferSalesModal(true);
  };

  const handleTransferSale = async (e) => {
    e.preventDefault();
    if (transferSalesForm.from_cp_id === transferSalesForm.to_cp_id) {
      alert('Please select a different CP to transfer to');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/sales/${transferSalesForm.sale_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cp_id: transferSalesForm.to_cp_id })
      });
      
      if (response.ok) {
        setShowTransferSalesModal(false);
        await loadAllData();
        alert('Sale transferred successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to transfer sale:', errorText);
        alert('Failed to transfer sale');
      }
    } catch (err) {
      console.error('Error transferring sale:', err);
      alert('Error transferring sale: ' + err.message);
    }
  };

  // Target Handlers
  const handleAddTarget = (rm) => {
    setEditingItem(null);
    setTargetForm({
      rm_id: rm.id,
      period: getCurrentPeriod(),
      cp_onboarding_target: '',
      active_cp_target: '',
      meetings_target: '',
      revenue_target: ''
    });
    setShowTargetModal(true);
  };

  const handleTargetSave = async (e) => {
    e.preventDefault();
    try {
      // Parse the period from form (e.g., "march-2026")
      const periodStr = targetForm.period;
      console.log('Period from form:', periodStr);
      
      // Split into month and year
      const [monthName, yearStr] = periodStr.split('-');
      const year = parseInt(yearStr);
      
      // Convert month name to month number (0-11)
      const monthMap = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3,
        'may': 4, 'june': 5, 'july': 6, 'august': 7,
        'september': 8, 'october': 9, 'november': 10, 'december': 11
      };
      
      const monthIndex = monthMap[monthName.toLowerCase()];
      
      if (monthIndex === undefined) {
        throw new Error(`Invalid month name: ${monthName}`);
      }
      
      // Create date and format as YYYY-MM-DD for month
      const targetDate = new Date(year, monthIndex, 1);
      const formattedMonth = targetDate.toISOString().split('T')[0];
      
      // Calculate weekly targets (monthly target / 4)
      const monthlyValues = {
        cp_onboarding: parseInt(targetForm.cp_onboarding_target) || 0,
        active_cp: parseInt(targetForm.active_cp_target) || 0,
        meetings: parseInt(targetForm.meetings_target) || 0,
        revenue: parseInt(targetForm.revenue_target) || 0
      };
      
      const weeklyValues = {
        cp_onboarding: Math.round(monthlyValues.cp_onboarding / 4),
        active_cp: Math.round(monthlyValues.active_cp / 4),
        meetings: Math.round(monthlyValues.meetings / 4),
        revenue: Math.round(monthlyValues.revenue / 4)
      };
      
      console.log('Monthly targets:', monthlyValues);
      console.log('Weekly targets (approx):', weeklyValues);
      
      // Prepare targets for each KPI type with both weekly and monthly
      const kpiTargets = [
        {
          rm_id: targetForm.rm_id,
          kpi_type: 'cp_onboarded',
          weekly_target: weeklyValues.cp_onboarding,
          monthly_target: monthlyValues.cp_onboarding,
          target_month: formattedMonth,
          target_week: formattedMonth
        },
        {
          rm_id: targetForm.rm_id,
          kpi_type: 'cp_active',
          weekly_target: weeklyValues.active_cp,
          monthly_target: monthlyValues.active_cp,
          target_month: formattedMonth,
          target_week: formattedMonth
        },
        {
          rm_id: targetForm.rm_id,
          kpi_type: 'meetings',
          weekly_target: weeklyValues.meetings,
          monthly_target: monthlyValues.meetings,
          target_month: formattedMonth,
          target_week: formattedMonth
        },
        {
          rm_id: targetForm.rm_id,
          kpi_type: 'sales_amount',
          weekly_target: weeklyValues.revenue,
          monthly_target: monthlyValues.revenue,
          target_month: formattedMonth,
          target_week: formattedMonth
        }
      ];

      console.log('Saving KPI targets to kpi_targets table:', kpiTargets);

      // Save each target to kpi_targets table
      for (const target of kpiTargets) {
        const response = await fetch(`${API_URL}/kpi_targets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save ${target.kpi_type}:`, errorText);
          alert(`Failed to save ${target.kpi_type} target`);
          return;
        }
      }
      
      alert('Targets saved successfully with weekly and monthly values!');
      setShowTargetModal(false);
      await loadAllData();
      
    } catch (err) {
      console.error('Error saving targets:', err);
      alert('Error saving targets: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error loading dashboard</h2>
        <p>{error}</p>
        <button onClick={loadAllData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Roaring Tigers CRM Management</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Time Range Filter */}
      <div style={styles.filterBar}>
        <div style={styles.filterLabel}>View performance for:</div>
        <div style={styles.filterButtons}>
          <button
            onClick={() => setTimeRange('today')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'today' ? '#3498db' : '#f8f9fa',
              color: timeRange === 'today' ? 'white' : '#495057',
              borderColor: timeRange === 'today' ? '#3498db' : '#dee2e6'
            }}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'week' ? '#3498db' : '#f8f9fa',
              color: timeRange === 'week' ? 'white' : '#495057',
              borderColor: timeRange === 'week' ? '#3498db' : '#dee2e6'
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'month' ? '#3498db' : '#f8f9fa',
              color: timeRange === 'month' ? 'white' : '#495057',
              borderColor: timeRange === 'month' ? '#3498db' : '#dee2e6'
            }}
          >
            This Month
          </button>
        </div>
        <div style={styles.filterInfo}>
          Showing {getPeriodLabel()} performance
        </div>
      </div>

      {/* Team Overview Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalRMs || 0}</div>
            <div style={styles.statLabel}>Total RMs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤝</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalCPs || 0}</div>
            <div style={styles.statLabel}>Total CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>{teamStats.activeCPs || 0}</div>
            <div style={styles.statLabel}>Active CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>{teamStats.periodStats?.sales || 0}</div>
            <div style={styles.statLabel}>Sales {getPeriodLabel()}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div>
            <div style={styles.statValue}>{teamStats.periodStats?.meetings || 0}</div>
            <div style={styles.statLabel}>Meetings {getPeriodLabel()}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💵</div>
          <div>
            <div style={styles.statValue}>{formatCurrency(teamStats.periodStats?.revenue || 0)}</div>
            <div style={styles.statLabel}>Revenue {getPeriodLabel()}</div>
          </div>
        </div>
      </div>

      {/* KPI Analysis Section */}
      {kpiAnalysis.teamTargets && (
        <div style={styles.kpiSection}>
          <h2 style={styles.sectionTitle}>📊 Team KPI Analysis - {getPeriodLabel()}</h2>
          
          <div style={styles.kpiGrid}>
            {/* CP Onboarding KPI */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiTitle}>CP Onboarding</span>
                <span style={styles.kpiTarget}>Target: {kpiAnalysis.teamTargets.cp_onboarding}</span>
              </div>
              <div style={styles.kpiProgress}>
                <div style={styles.progressLabels}>
                  <span>Achieved: {kpiAnalysis.teamAchievements.cp_onboarding}</span>
                  <span>{kpiAnalysis.percentages.cp_onboarding}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(kpiAnalysis.percentages.cp_onboarding, 100)}%`,
                    backgroundColor: getProgressColor(kpiAnalysis.percentages.cp_onboarding)
                  }} />
                </div>
              </div>
              
              <div style={styles.kpiDetails}>
                <div style={styles.kpiRow}>
                  <span>Remaining:</span>
                  <strong>{Math.max(0, kpiAnalysis.teamTargets.cp_onboarding - kpiAnalysis.teamAchievements.cp_onboarding)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Days left:</span>
                  <strong>{kpiAnalysis.daysRemaining}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Daily needed:</span>
                  <strong>{kpiAnalysis.requiredDaily.cp_onboarding?.toFixed(1)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Projected:</span>
                  <strong>{Math.round(kpiAnalysis.projectedValues.cp_onboarding)}</strong>
                </div>
              </div>
              
              {kpiAnalysis.recommendations.cp_onboarding && (
                <div style={styles.recommendation}>
                  <span style={styles.recommendationIcon}>💡</span>
                  <span style={styles.recommendationText}>
                    {kpiAnalysis.recommendations.cp_onboarding.action}
                  </span>
                </div>
              )}
            </div>

            {/* Active CP KPI */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiTitle}>Active CPs</span>
                <span style={styles.kpiTarget}>Target: {kpiAnalysis.teamTargets.active_cp}</span>
              </div>
              <div style={styles.kpiProgress}>
                <div style={styles.progressLabels}>
                  <span>Achieved: {kpiAnalysis.teamAchievements.active_cp}</span>
                  <span>{kpiAnalysis.percentages.active_cp}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(kpiAnalysis.percentages.active_cp, 100)}%`,
                    backgroundColor: getProgressColor(kpiAnalysis.percentages.active_cp)
                  }} />
                </div>
              </div>
              
              <div style={styles.kpiDetails}>
                <div style={styles.kpiRow}>
                  <span>Remaining:</span>
                  <strong>{Math.max(0, kpiAnalysis.teamTargets.active_cp - kpiAnalysis.teamAchievements.active_cp)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Days left:</span>
                  <strong>{kpiAnalysis.daysRemaining}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Daily needed:</span>
                  <strong>{kpiAnalysis.requiredDaily.active_cp?.toFixed(1)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Projected:</span>
                  <strong>{Math.round(kpiAnalysis.projectedValues.active_cp)}</strong>
                </div>
              </div>
              
              {kpiAnalysis.recommendations.active_cp && (
                <div style={styles.recommendation}>
                  <span style={styles.recommendationIcon}>💡</span>
                  <span style={styles.recommendationText}>
                    {kpiAnalysis.recommendations.active_cp.action}
                  </span>
                </div>
              )}
            </div>

            {/* Meetings KPI */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiTitle}>Meetings</span>
                <span style={styles.kpiTarget}>Target: {kpiAnalysis.teamTargets.meetings}</span>
              </div>
              <div style={styles.kpiProgress}>
                <div style={styles.progressLabels}>
                  <span>Achieved: {kpiAnalysis.teamAchievements.meetings}</span>
                  <span>{kpiAnalysis.percentages.meetings}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(kpiAnalysis.percentages.meetings, 100)}%`,
                    backgroundColor: getProgressColor(kpiAnalysis.percentages.meetings)
                  }} />
                </div>
              </div>
              
              <div style={styles.kpiDetails}>
                <div style={styles.kpiRow}>
                  <span>Remaining:</span>
                  <strong>{Math.max(0, kpiAnalysis.teamTargets.meetings - kpiAnalysis.teamAchievements.meetings)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Days left:</span>
                  <strong>{kpiAnalysis.daysRemaining}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Daily needed:</span>
                  <strong>{kpiAnalysis.requiredDaily.meetings?.toFixed(1)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Projected:</span>
                  <strong>{Math.round(kpiAnalysis.projectedValues.meetings)}</strong>
                </div>
              </div>
              
              {kpiAnalysis.recommendations.meetings && (
                <div style={styles.recommendation}>
                  <span style={styles.recommendationIcon}>💡</span>
                  <span style={styles.recommendationText}>
                    {kpiAnalysis.recommendations.meetings.action}
                  </span>
                </div>
              )}
            </div>

            {/* Revenue KPI */}
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiTitle}>Revenue</span>
                <span style={styles.kpiTarget}>Target: {formatCurrency(kpiAnalysis.teamTargets.revenue)}</span>
              </div>
              <div style={styles.kpiProgress}>
                <div style={styles.progressLabels}>
                  <span>Achieved: {formatCurrency(kpiAnalysis.teamAchievements.revenue)}</span>
                  <span>{kpiAnalysis.percentages.revenue}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(kpiAnalysis.percentages.revenue, 100)}%`,
                    backgroundColor: getProgressColor(kpiAnalysis.percentages.revenue)
                  }} />
                </div>
              </div>
              
              <div style={styles.kpiDetails}>
                <div style={styles.kpiRow}>
                  <span>Remaining:</span>
                  <strong>{formatCurrency(Math.max(0, kpiAnalysis.teamTargets.revenue - kpiAnalysis.teamAchievements.revenue))}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Days left:</span>
                  <strong>{kpiAnalysis.daysRemaining}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Daily needed:</span>
                  <strong>{formatCurrency(kpiAnalysis.requiredDaily.revenue)}</strong>
                </div>
                <div style={styles.kpiRow}>
                  <span>Projected:</span>
                  <strong>{formatCurrency(kpiAnalysis.projectedValues.revenue)}</strong>
                </div>
              </div>
              
              {kpiAnalysis.recommendations.revenue && (
                <div style={styles.recommendation}>
                  <span style={styles.recommendationIcon}>💡</span>
                  <span style={styles.recommendationText}>
                    {kpiAnalysis.recommendations.revenue.action}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Performer & Needs Attention */}
      <div style={styles.alertsSection}>
        {teamStats.topPerformer && (
          <div style={styles.topPerformerCard}>
            <h3>🏆 Top Performer - {getPeriodLabel()}</h3>
            <div style={styles.topPerformerDetails}>
              <span style={styles.topPerformerName}>{teamStats.topPerformer.name}</span>
              <span style={styles.topPerformerScore}>{Math.round(teamStats.topPerformer.avgPercentage)}% achieved</span>
            </div>
          </div>
        )}
        
        {teamStats.needsAttention && teamStats.needsAttention.length > 0 && (
          <div style={styles.attentionCard}>
            <h3>🚨 RMs Needing Attention</h3>
            {teamStats.needsAttention.map(rm => (
              <div key={rm.id} style={styles.attentionItem}>
                <span>{rm.name}</span>
                <span style={styles.attentionScore}>{Math.round(rm.avgPercentage)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('overview')} style={{...styles.tab, background: activeTab === 'overview' ? '#3498db' : '#f8f9fa', color: activeTab === 'overview' ? 'white' : '#333'}}>📊 Team Overview</button>
        <button onClick={() => setActiveTab('rms')} style={{...styles.tab, background: activeTab === 'rms' ? '#3498db' : '#f8f9fa', color: activeTab === 'rms' ? 'white' : '#333'}}>👥 RMs ({rms.length})</button>
        <button onClick={() => setActiveTab('targets')} style={{...styles.tab, background: activeTab === 'targets' ? '#3498db' : '#f8f9fa', color: activeTab === 'targets' ? 'white' : '#333'}}>🎯 Targets ({targets.length})</button>
        <button onClick={() => setActiveTab('cps')} style={{...styles.tab, background: activeTab === 'cps' ? '#3498db' : '#f8f9fa', color: activeTab === 'cps' ? 'white' : '#333'}}>🤝 CPs ({cps.length})</button>
        <button onClick={() => setActiveTab('sales')} style={{...styles.tab, background: activeTab === 'sales' ? '#3498db' : '#f8f9fa', color: activeTab === 'sales' ? 'white' : '#333'}}>💰 Sales ({sales.length})</button>
        <button onClick={() => setActiveTab('meetings')} style={{...styles.tab, background: activeTab === 'meetings' ? '#3498db' : '#f8f9fa', color: activeTab === 'meetings' ? 'white' : '#333'}}>📅 Meetings ({meetings.length})</button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Team Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={styles.sectionTitle}>Individual RM Performance - {getPeriodLabel()}</h2>
            <div style={styles.rmPerformanceGrid}>
              {rmPerformance.map(rm => (
                <div key={rm.id} style={styles.rmPerformanceCard}>
                  <div style={styles.rmCardHeader}>
                    <span style={styles.rmCardName}>{rm.name}</span>
                    <span style={{...styles.rmCardStatus, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                      {rm.status}
                    </span>
                  </div>
                  
                  <div style={styles.rmCardStats}>
                    <div style={styles.rmStat}>
                      <span>CPs:</span>
                      <strong>{rm.achievements.cp_onboarding}</strong>
                      {rm.targets && <small>/{rm.targets.cp_onboarding_target}</small>}
                    </div>
                    <div style={styles.rmStat}>
                      <span>Active:</span>
                      <strong>{rm.achievements.active_cp}</strong>
                      {rm.targets && <small>/{rm.targets.active_cp_target}</small>}
                    </div>
                    <div style={styles.rmStat}>
                      <span>Meetings:</span>
                      <strong>{rm.achievements.meetings}</strong>
                      {rm.targets && <small>/{rm.targets.meetings_target}</small>}
                    </div>
                    <div style={styles.rmStat}>
                      <span>Revenue:</span>
                      <strong>{formatCurrency(rm.achievements.revenue)}</strong>
                      {rm.targets && <small>/{formatCurrency(rm.targets.revenue_target)}</small>}
                    </div>
                  </div>
                  
                  <div style={styles.rmCardFooter}>
                    <span style={styles.rmProgress}>{Math.round(rm.avgPercentage)}% achieved</span>
                    <span style={styles.rmStatus}>{rm.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RMs Tab */}
        {activeTab === 'rms' && (
          <div>
            <div style={styles.tabHeader}>
              <h2 style={styles.sectionTitle}>Relationship Managers</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={loadAllData} style={{...styles.addButton, background: '#3498db'}}>🔄 Refresh</button>
                <button onClick={handleAddRM} style={styles.addButton}>➕ Add RM</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rms.map(rm => (
                  <tr key={rm.id}>
                    <td>{rm.id}</td>
                    <td>{rm.name}</td>
                    <td>{rm.phone}</td>
                    <td>{rm.email}</td>
                    <td>
                      <span style={{...styles.badge, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                        {rm.status}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEditRM(rm)} style={styles.editBtn} title="Edit">✏️</button>
                      <button onClick={() => handleAddTarget(rm)} style={styles.targetBtn} title="Set Target">🎯</button>
                      <button onClick={() => handleDelete('rms', rm.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div>
            <h2 style={styles.sectionTitle}>Monthly Targets</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>RM</th>
                  <th>Period</th>
                  <th>CP Target</th>
                  <th>Active CP</th>
                  <th>Meetings</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(target => {
                  const rm = rms.find(r => String(r.id) === String(target.rm_id));
                  return (
                    <tr key={target.id}>
                      <td>{rm?.name || target.rm_id}</td>
                      <td>{target.period}</td>
                      <td>{target.cp_onboarding_target}</td>
                      <td>{target.active_cp_target}</td>
                      <td>{target.meetings_target}</td>
                      <td>{formatCurrency(target.revenue_target)}</td>
                      <td>
                        <button onClick={() => handleDelete('targets', target.id)} style={styles.deleteBtn}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CPs Tab */}
        {activeTab === 'cps' && (
          <div>
            <div style={styles.tabHeader}>
              <h2 style={styles.sectionTitle}>Channel Partners</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={loadAllData} style={{...styles.addButton, background: '#3498db'}}>🔄 Refresh</button>
                <button onClick={handleAddCP} style={styles.addButton}>➕ Add CP</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>RM</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cps.map(cp => {
                  const rm = rms.find(r => String(r.id) === String(cp.rm_id));
                  return (
                    <tr key={cp.id}>
                      <td>{cp.id}</td>
                      <td>{cp.cp_name}</td>
                      <td>{cp.phone}</td>
                      <td>{rm?.name || cp.rm_id}</td>
                      <td>{cp.cp_type}</td>
                      <td>
                        <span style={{...styles.badge, background: cp.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                          {cp.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditCP(cp)} style={styles.editBtn} title="Edit">✏️</button>
                        <button onClick={() => handleOpenTransferCP(cp)} style={styles.transferBtn} title="Transfer to another RM">🔄</button>
                        <button onClick={() => handleDelete('channel_partners', cp.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div>
            <div style={styles.tabHeader}>
              <h2 style={styles.sectionTitle}>Sales Records</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={loadAllData} style={{...styles.addButton, background: '#3498db'}}>🔄 Refresh</button>
                <button onClick={handleAddSale} style={styles.addButton}>➕ Add Sale</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>RM</th>
                  <th>CP</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const rm = rms.find(r => String(r.id) === String(sale.rm_id));
                  const cp = cps.find(c => String(c.id) === String(sale.cp_id));
                  return (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{rm?.name || sale.rm_id}</td>
                      <td>{cp?.cp_name || sale.cp_id}</td>
                      <td>{sale.applicant_name}</td>
                      <td>{formatCurrency(sale.sale_amount)}</td>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                      <td>
                        <span style={{...styles.badge, background: sale.payment_status === 'completed' ? '#d4edda' : '#fff3cd'}}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditSale(sale)} style={styles.editBtn} title="Edit">✏️</button>
                        <button onClick={() => handleOpenTransferSale(sale)} style={styles.transferBtn} title="Transfer to another CP">🔄</button>
                        <button onClick={() => handleDelete('sales', sale.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <h2 style={styles.sectionTitle}>Meeting Logs</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>RM</th>
                  <th>CP</th>
                  <th>Date</th>
                  <th>Outcome</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(meeting => {
                  const rm = rms.find(r => String(r.id) === String(meeting.rm_id));
                  const cp = cps.find(c => String(c.id) === String(meeting.cp_id));
                  return (
                    <tr key={meeting.id}>
                      <td>{meeting.id}</td>
                      <td>{rm?.name || meeting.rm_id}</td>
                      <td>{cp?.cp_name || meeting.cp_id}</td>
                      <td>{new Date(meeting.meeting_date).toLocaleDateString()}</td>
                      <td>{meeting.outcome}</td>
                      <td>
                        <button onClick={() => handleDelete('meetings', meeting.id)} style={styles.deleteBtn}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RM Modal */}
      {showRMModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{editingItem ? 'Edit RM' : 'Add New RM'}</h3>
            <form onSubmit={handleRMSave}>
              <input type="text" placeholder="Name" value={rmForm.name} onChange={(e) => setRmForm({...rmForm, name: e.target.value})} required style={styles.modalInput} />
              <input type="tel" placeholder="Phone" value={rmForm.phone} onChange={(e) => setRmForm({...rmForm, phone: e.target.value})} required style={styles.modalInput} />
              <input type="email" placeholder="Email" value={rmForm.email} onChange={(e) => setRmForm({...rmForm, email: e.target.value})} required style={styles.modalInput} />
              <input type="password" placeholder="Password" value={rmForm.password} onChange={(e) => setRmForm({...rmForm, password: e.target.value})} required={!editingItem} style={styles.modalInput} />
              <select value={rmForm.status} onChange={(e) => setRmForm({...rmForm, status: e.target.value})} style={styles.modalInput}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowRMModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CP Modal */}
      {showCPModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{editingItem ? 'Edit CP' : 'Add New CP'}</h3>
            <form onSubmit={handleCPSave}>
              <input type="text" placeholder="CP Name" value={cpForm.cp_name} onChange={(e) => setCpForm({...cpForm, cp_name: e.target.value})} required style={styles.modalInput} />
              <input type="tel" placeholder="Phone" value={cpForm.phone} onChange={(e) => setCpForm({...cpForm, phone: e.target.value})} required style={styles.modalInput} />
              <input type="email" placeholder="Email" value={cpForm.email} onChange={(e) => setCpForm({...cpForm, email: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Address" value={cpForm.address} onChange={(e) => setCpForm({...cpForm, address: e.target.value})} style={styles.modalInput} />
              <select value={cpForm.cp_type} onChange={(e) => setCpForm({...cpForm, cp_type: e.target.value})} style={styles.modalInput}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <input type="text" placeholder="Operating Markets" value={cpForm.operating_markets} onChange={(e) => setCpForm({...cpForm, operating_markets: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Industry" value={cpForm.industry} onChange={(e) => setCpForm({...cpForm, industry: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Expected Monthly Business" value={cpForm.expected_monthly_business} onChange={(e) => setCpForm({...cpForm, expected_monthly_business: e.target.value})} style={styles.modalInput} />
              <input type="date" placeholder="Onboard Date" value={cpForm.onboard_date} onChange={(e) => setCpForm({...cpForm, onboard_date: e.target.value})} style={styles.modalInput} />
              <select value={cpForm.rm_id} onChange={(e) => setCpForm({...cpForm, rm_id: e.target.value})} required style={styles.modalInput}>
                <option value="">Select RM</option>
                {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
              </select>
              <select value={cpForm.status} onChange={(e) => setCpForm({...cpForm, status: e.target.value})} style={styles.modalInput}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCPModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer CP Modal */}
      {showTransferCPModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Transfer Channel Partner to Another RM</h3>
            <form onSubmit={handleTransferCP}>
              <p><strong>From RM:</strong> {rms.find(r => r.id === transferCPForm.from_rm_id)?.name}</p>
              <select
                value={transferCPForm.to_rm_id}
                onChange={(e) => setTransferCPForm({...transferCPForm, to_rm_id: parseInt(e.target.value)})}
                required
                style={styles.modalInput}
              >
                <option value="">Select Target RM</option>
                {rms.filter(rm => rm.id !== transferCPForm.from_rm_id).map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowTransferCPModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Modal */}
      {showSalesModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{editingItem ? 'Edit Sale' : 'Add New Sale'}</h3>
            <form onSubmit={handleSaleSave}>
              <select
                value={salesForm.rm_id}
                onChange={(e) => setSalesForm({...salesForm, rm_id: parseInt(e.target.value)})}
                required
                style={styles.modalInput}
              >
                <option value="">Select RM</option>
                {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
              </select>
              
              <select
                value={salesForm.cp_id}
                onChange={(e) => setSalesForm({...salesForm, cp_id: parseInt(e.target.value)})}
                required
                style={styles.modalInput}
              >
                <option value="">Select CP</option>
                {cps.map(cp => <option key={cp.id} value={cp.id}>{cp.cp_name}</option>)}
              </select>
              
              <input type="text" placeholder="Applicant Name" value={salesForm.applicant_name} onChange={(e) => setSalesForm({...salesForm, applicant_name: e.target.value})} required style={styles.modalInput} />
              <input type="tel" placeholder="Applicant Phone" value={salesForm.applicant_phone} onChange={(e) => setSalesForm({...salesForm, applicant_phone: e.target.value})} style={styles.modalInput} />
              <input type="email" placeholder="Applicant Email" value={salesForm.applicant_email} onChange={(e) => setSalesForm({...salesForm, applicant_email: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Project Name" value={salesForm.project_name} onChange={(e) => setSalesForm({...salesForm, project_name: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Plot Number" value={salesForm.plot_number} onChange={(e) => setSalesForm({...salesForm, plot_number: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Plot Size (sq ft)" value={salesForm.plot_size} onChange={(e) => setSalesForm({...salesForm, plot_size: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Plot Value" value={salesForm.plot_value} onChange={(e) => setSalesForm({...salesForm, plot_value: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Booking Amount Paid" value={salesForm.booking_amount_paid} onChange={(e) => setSalesForm({...salesForm, booking_amount_paid: e.target.value})} style={styles.modalInput} />
              <input type="date" placeholder="Booking Date" value={salesForm.booking_date} onChange={(e) => setSalesForm({...salesForm, booking_date: e.target.value})} style={styles.modalInput} />
              <input type="date" placeholder="Sale Date" value={salesForm.sale_date} onChange={(e) => setSalesForm({...salesForm, sale_date: e.target.value})} required style={styles.modalInput} />
              <input type="number" placeholder="Sale Amount" value={salesForm.sale_amount} onChange={(e) => setSalesForm({...salesForm, sale_amount: e.target.value})} required style={styles.modalInput} />
              
              <select value={salesForm.payment_status} onChange={(e) => setSalesForm({...salesForm, payment_status: e.target.value})} style={styles.modalInput}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
              
              <input type="text" placeholder="Invoice Number" value={salesForm.invoice_number} onChange={(e) => setSalesForm({...salesForm, invoice_number: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Discount Amount" value={salesForm.discount_amount} onChange={(e) => setSalesForm({...salesForm, discount_amount: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Tax Amount" value={salesForm.tax_amount} onChange={(e) => setSalesForm({...salesForm, tax_amount: e.target.value})} style={styles.modalInput} />
              <textarea placeholder="Notes" value={salesForm.notes} onChange={(e) => setSalesForm({...salesForm, notes: e.target.value})} style={styles.modalInput} rows="3" />
              
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowSalesModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Sales Modal */}
      {showTransferSalesModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Transfer Sale to Another CP</h3>
            <form onSubmit={handleTransferSale}>
              <p><strong>From CP:</strong> {cps.find(c => c.id === transferSalesForm.from_cp_id)?.cp_name}</p>
              <select
                value={transferSalesForm.to_cp_id}
                onChange={(e) => setTransferSalesForm({...transferSalesForm, to_cp_id: parseInt(e.target.value)})}
                required
                style={styles.modalInput}
              >
                <option value="">Select Target CP</option>
                {cps.filter(cp => cp.id !== transferSalesForm.from_cp_id).map(cp => (
                  <option key={cp.id} value={cp.id}>{cp.cp_name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowTransferSalesModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Set Monthly Target</h3>
            <form onSubmit={handleTargetSave}>
              <input
                type="text"
                placeholder="Period (e.g., march-2026)"
                value={targetForm.period}
                onChange={(e) => setTargetForm({...targetForm, period: e.target.value})}
                required
                style={styles.modalInput}
              />
              <input
                type="number"
                placeholder="CP Onboarding Target"
                value={targetForm.cp_onboarding_target}
                onChange={(e) => setTargetForm({...targetForm, cp_onboarding_target: e.target.value})}
                required
                style={styles.modalInput}
              />
              <input
                type="number"
                placeholder="Active CP Target"
                value={targetForm.active_cp_target}
                onChange={(e) => setTargetForm({...targetForm, active_cp_target: e.target.value})}
                required
                style={styles.modalInput}
              />
              <input
                type="number"
                placeholder="Meetings Target"
                value={targetForm.meetings_target}
                onChange={(e) => setTargetForm({...targetForm, meetings_target: e.target.value})}
                required
                style={styles.modalInput}
              />
              <input
                type="number"
                placeholder="Revenue Target (₹)"
                value={targetForm.revenue_target}
                onChange={(e) => setTargetForm({...targetForm, revenue_target: e.target.value})}
                required
                style={styles.modalInput}
              />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowTargetModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  loading: {
    fontSize: '18px',
    color: '#666'
  },
  errorContainer: {
    padding: '40px',
    textAlign: 'center'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
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
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  filterBar: {
    background: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#495057'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '8px 16px',
    border: '2px solid',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filterInfo: {
    fontSize: '14px',
    color: '#666',
    marginLeft: 'auto'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  statCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statIcon: {
    fontSize: '24px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '11px',
    color: '#666'
  },
  kpiSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 20px 0'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  kpiCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  kpiTitle: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  kpiTarget: {
    fontSize: '12px',
    color: '#666'
  },
  kpiProgress: {
    marginBottom: '10px'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '5px'
  },
  progressBar: {
    height: '8px',
    background: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  kpiDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px',
    fontSize: '12px',
    marginBottom: '10px'
  },
  kpiRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0'
  },
  recommendation: {
    display: 'flex',
    gap: '5px',
    padding: '8px',
    background: '#fff3cd',
    borderRadius: '4px',
    fontSize: '12px',
    marginTop: '10px'
  },
  recommendationIcon: {
    fontSize: '14px'
  },
  recommendationText: {
    flex: 1,
    color: '#856404'
  },
  alertsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px'
  },
  topPerformerCard: {
    background: '#d4edda',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #c3e6cb'
  },
  topPerformerDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px'
  },
  topPerformerName: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  topPerformerScore: {
    background: '#155724',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  attentionCard: {
    background: '#f8d7da',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #f5c6cb'
  },
  attentionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    margin: '5px 0',
    background: 'white',
    borderRadius: '4px'
  },
  attentionScore: {
    color: '#dc3545',
    fontWeight: 'bold'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    background: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    flexWrap: 'wrap'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '80px'
  },
  content: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  rmPerformanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  rmPerformanceCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  rmCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  rmCardName: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  rmCardStatus: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  rmCardStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '10px'
  },
  rmStat: {
    fontSize: '12px'
  },
  rmCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid #dee2e6',
    paddingTop: '8px',
    fontSize: '12px'
  },
  rmProgress: {
    fontWeight: 'bold',
    color: '#3498db'
  },
  rmStatus: {
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  editBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#ffc107',
    color: '#333'
  },
  targetBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#17a2b8',
    color: 'white'
  },
  transferBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#6f42c1',
    color: 'white'
  },
  deleteBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#dc3545',
    color: 'white'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },
  modalCancel: {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  modalSave: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default AdminDashboard;
