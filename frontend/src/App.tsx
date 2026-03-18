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
import AdviserMyClass from "./pages/adviser/AdviserMyClass";
import AdviserClassStudents from "./pages/adviser/AdviserClassStudents";
import AdviserStudentDetails from "./pages/adviser/AdviserStudentDetails";
import AdviserSchoolRegistersForms from "./pages/adviser/AdviserSchoolRegistersForms";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {/* Authentication */}
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/adviser" element={<AdviserLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Adviser */}
        <Route path="/adviser/dashboard" element={<AdviserDashboard />} />

        {/* Class Management */}
        <Route path="/adviser/classes" element={<AdviserClassManagement />} />
        <Route path="/adviser/classes/:id" element={<AdviserMyClass />} />
        <Route path="/adviser/classes/:id/students" element={<AdviserClassStudents />} />
        <Route path="/adviser/classes/:id/students/:studentId" element={<AdviserStudentDetails />} />

        {/* School Registers & Forms */}
        <Route path="/adviser/school-registers-forms" element={<AdviserSchoolRegistersForms />} />

        {/* Shared Endpoints */}
        <Route path="/about-us" element={<AboutUs />} />
      </Route>
    </Routes>
  );
}

export default App;