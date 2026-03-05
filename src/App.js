import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import MeetingLogger from "./pages/MeetingLogger";
import AdminDashboard from "./pages/AdminDashboard";

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

      {/* Routes */}
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/log-meeting" element={<MeetingLogger />} />

        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>

    </Router>
  );
}

const navbar = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  padding:"15px 30px",
  background:"#5c6bc0"
};

const navlink = {
  color:"#fff",
  marginLeft:20,
  textDecoration:"none",
  fontWeight:"500"
};
