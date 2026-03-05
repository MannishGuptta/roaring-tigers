import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import MeetingLogger from "./MeetingLogger";
import OnboardCP from "./OnboardCP";
import MyCPs from "./MyCPs";
import RecordSale from "./RecordSale";

function Dashboard() {
  return (

    <div style={{ padding: 40 }}>

      <h1>RevenuePilot</h1>
      <h2>Sales Command System</h2>

      <div style={{ marginTop: 40 }}>

        <Link to="/onboard-cp">
          <button style={btn}>Onboard Channel Partner</button>
        </Link>

        <br /><br />

        <Link to="/log-meeting">
          <button style={btn}>Log Meeting</button>
        </Link>

        <br /><br />

        <Link to="/my-cps">
          <button style={btn}>My Channel Partners</button>
        </Link>

        <br /><br />

        <Link to="/record-sale">
          <button style={btn}>Record Sale</button>
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

        <Route path="/onboard-cp" element={<OnboardCP />} />

        <Route path="/log-meeting" element={<MeetingLogger />} />

        <Route path="/my-cps" element={<MyCPs />} />

        <Route path="/record-sale" element={<RecordSale />} />

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
  cursor: "pointer",
  width: 250
};
