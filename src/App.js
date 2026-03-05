import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LogMeeting from "./pages/LogMeeting";

export default function App() {
  return (
    <Router>
      <div style={layout}>

        {/* Top Navigation */}
        <nav style={navbar}>

          <div style={logo}>
            RevenuePilot
          </div>

          <div style={navLinks}>
            <Link style={link} to="/">Dashboard</Link>
            <Link style={link} to="/log-meeting">Log Meeting</Link>
          </div>

        </nav>

        {/* Page Content */}
        <div style={content}>
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
        </div>

      </div>
    </Router>
  );
}

const layout = {
  fontFamily: "Arial, sans-serif"
};

const navbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 30px",
  background: "#667eea",
  color: "white"
};

const logo = {
  fontSize: "20px",
  fontWeight: "bold"
};

const navLinks = {
  display: "flex",
  gap: "20px"
};

const link = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold"
};

const content = {
  padding: "30px"
};
