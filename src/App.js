import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LogMeeting from "./pages/LogMeeting";

function Dashboard() {
  return (
    <div style={{ padding: 40 }}>

      <h1>RevenuePilot</h1>
      <h2>Sales Command System</h2>

      <div style={{ marginTop: 40 }}>
        <Link to="/log-meeting">
          <button style={btn}>
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

        <Route path="/" element={<Dashboard />} />

        <Route path="/log-meeting" element={<LogMeeting />} />

      </Routes>

    </Router>

  );
}

const btn = {
  padding: "12px 20px",
  background: "#667eea",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};
