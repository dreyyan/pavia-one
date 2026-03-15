import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// [IMPORT] Components
import Layout from "./Layout";
import AdminLogin from "./pages/admin/AdminLogin"; 
import AdviserLogin from "./pages/adviser/AdviserLogin";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import AboutUs from "./AboutUs";
import AdviserDashboard from "./pages/adviser/AdviserDashboard";
import AdviserClassManagement from "./pages/adviser/AdviserClassManagement";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/adviser" element={<AdviserLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/adviser/dashboard" element={<AdviserDashboard />} />
        <Route path="/adviser/classes" element={<AdviserClassManagement />} />
        <Route path="/about-us" element={<AboutUs />} />
      </Route>
    </Routes>
  );
}

export default App;