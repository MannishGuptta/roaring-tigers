import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {

  const [status, setStatus] = useState("Testing Supabase connection...");
  const [stats, setStats] = useState({
    cps: 0,
    meetings: 0,
    sales: 0,
    revenue: 0
  });

  useEffect(() => {
    testConnection();
    loadDashboardStats();
  }, []);

  async function testConnection() {
    try {
      const { error } = await supabase
        .from("rms")
        .select("*")
        .limit(1);

      if (error) throw error;

      setStatus("✅ Supabase connected successfully");

    } catch (err) {
      console.error(err);
      setStatus("❌ Supabase connection failed");
    }
  }

  async function loadDashboardStats() {
    try {

      const { data: cpData } = await supabase
        .from("channel_partners")
        .select("*");

      const { data: meetingData } = await supabase
        .from("meetings")
        .select("*");

      const { data: salesData } = await supabase
        .from("sales")
        .select("*");

      let revenue = 0;

      if (salesData) {
        revenue = salesData.reduce(
          (sum, s) => sum + (s.sale_value || 0),
          0
        );
      }

      setStats({
        cps: cpData ? cpData.length : 0,
        meetings: meetingData ? meetingData.length : 0,
        sales: salesData ? salesData.length : 0,
        revenue: revenue
      });

    } catch (err) {
      console.error("Dashboard error:", err);
    }
  }

  return (

    <div style={styles.container}>

      {/* Header */}

      <h1 style={styles.title}>RevenuePilot</h1>
      <p style={styles.subtitle}>Channel Sales Intelligence Platform</p>

      <p style={styles.status}>{status}</p>

      {/* Dashboard Stats */}

      <div style={styles.statsGrid}>

        <div style={styles.card}>
          <h3>Total CPs</h3>
          <p style={styles.number}>{stats.cps}</p>
        </div>

        <div style={styles.card}>
          <h3>Meetings</h3>
          <p style={styles.number}>{stats.meetings}</p>
        </div>

        <div style={styles.card}>
          <h3>Sales</h3>
          <p style={styles.number}>{stats.sales}</p>
        </div>

        <div style={styles.card}>
          <h3>Revenue</h3>
          <p style={styles.number}>
            ₹{stats.revenue.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Navigation Buttons */}

      <div style={styles.actions}>

        <button style={styles.button}>
          Onboard Channel Partner
        </button>

        <button style={styles.button}>
          Log Meeting
        </button>

        <button style={styles.button}>
          Record Sale
        </button>

        <button style={styles.button}>
          View Collections
        </button>

      </div>

    </div>
  );
}

const styles = {

  container: {
    padding: "40px",
    fontFamily: "Arial"
  },

  title: {
    fontSize: "32px",
    marginBottom: "5px"
  },

  subtitle: {
    color: "#666",
    marginBottom: "20px"
  },

  status: {
    marginBottom: "30px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "20px",
    marginBottom: "40px"
  },

  card: {
    padding: "20px",
    background: "#f5f5f5",
    borderRadius: "10px",
    textAlign: "center"
  },

  number: {
    fontSize: "26px",
    fontWeight: "bold"
  },

  actions: {
    display: "flex",
    gap: "15px"
  },

  button: {
    padding: "12px 20px",
    border: "none",
    background: "#667eea",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  }

};
