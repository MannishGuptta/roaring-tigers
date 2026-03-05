import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import LogMeeting from "./pages/LogMeeting";
import AdminDashboard from "./pages/AdminDashboard";

function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>RevenuePilot</h1>
      <h2>Sales Command System</h2>

      <div style={{ marginTop: 20 }}>
        <Link to="/log-meeting">
          <button style={btn}>Log Meeting</button>
        </Link>

        <Link to="/admin">
          <button style={btn}>Admin Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>

      {/* Top Navigation */}
      <div style={navbar}>
        <h3 style={{color:"#fff"}}>RevenuePilot</h3>

        <div>
          <Link to="/" style={navlink}>Dashboard</Link>
          <Link to="/log-meeting" style={navlink}>Log Meeting</Link>
          <Link to="/admin" style={navlink}>Admin</Link>
        </div>
      </div>

      {/* Page Routes */}
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/log-meeting" element={<LogMeeting />} />

        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>

    </Router>
  );
}

const navbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 30px",
  background: "#5c6bc0"
};

const navlink = {
  color: "#fff",
  marginLeft: 20,
  textDecoration: "none",
  fontWeight: "500"
};

const btn = {
  padding: "12px 20px",
  marginRight: 10,
  background: "#5c6bc0",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};
