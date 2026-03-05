import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LogMeeting from "./pages/LogMeeting";

function Dashboard() {

  const [stats, setStats] = useState({
    cps: 0,
    meetings: 0,
    sales: 0,
    revenue: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {

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
      console.error(err);
    }
  }

  return (

    <div style={{ padding: 40 }}>

      <h1>RevenuePilot</h1>
      <p>Channel Sales Intelligence Platform</p>

      <div style={{ display: "flex", gap: 20, marginTop: 30 }}>

        <div style={cardStyle}>
          <h3>Total CPs</h3>
          <p>{stats.cps}</p>
        </div>

        <div style={cardStyle}>
          <h3>Meetings</h3>
          <p>{stats.meetings}</p>
        </div>

        <div style={cardStyle}>
          <h3>Sales</h3>
          <p>{stats.sales}</p>
        </div>

        <div style={cardStyle}>
          <h3>Revenue</h3>
          <p>₹{stats.revenue.toLocaleString()}</p>
        </div>

      </div>

      <div style={{ marginTop: 40 }}>

        <Link to="/log-meeting">
          <button style={buttonStyle}>
            Log Meeting
          </button>
        </Link>

      </div>

    </div>

  );
}

export default function App() {

  return (

    <Router>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/log-meeting"
          element={<LogMeeting />}
        />

      </Routes>

    </Router>

  );
}

const cardStyle = {
  padding: 20,
  background: "#f5f5f5",
  borderRadius: 10,
  minWidth: 120,
  textAlign: "center"
};

const buttonStyle = {
  padding: "12px 20px",
  background: "#667eea",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};
