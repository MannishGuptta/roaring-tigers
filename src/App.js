import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MeetingLogger from "./pages/MeetingLogger";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <Router>

      <Routes>

        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Log Meeting */}
        <Route path="/log-meeting" element={<MeetingLogger />} />

        {/* Admin Login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>

    </Router>
  );
}

export default App;
