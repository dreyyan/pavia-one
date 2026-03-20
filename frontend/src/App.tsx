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
import AdviserClassDetails from "./pages/adviser/AdviserClassDetails";
import AdviserClassStudents from "./pages/adviser/AdviserClassStudents";
import AdviserClassStudentDetails from "./pages/adviser/AdviserClassStudentDetails";
import AdviserClassSchoolForms from "./pages/adviser/AdviserClassSchoolForms";
import AdviserSchoolForms from "./pages/adviser/AdviserSchoolForms";
import AdviserClassGrades from "./pages/adviser/AdviserClassGrades";
import AdviserClassStudentGradesOverview from "./pages/adviser/AdviserClassStudentGradesOverview";
import AdviserClassStudentGradesDetails from "./pages/adviser/AdviserClassStudentGradesDetails";
import AdviserProfile from "./pages/adviser/AdviserProfile";

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
        <Route path="/adviser/classes/:id" element={<AdviserClassDetails />} />
        {/* [1] View Students */}
        <Route path="/adviser/classes/:sectionId/students" element={<AdviserClassStudents />} />
        <Route path="/adviser/classes/:sectionId/students/:studentId" element={<AdviserClassStudentDetails />} />
        {/* [3] Grades */}
        <Route path="/adviser/classes/grades/:sectionId" element={<AdviserClassGrades />} />
        <Route path="/adviser/classes/grades/:sectionId/:studentId" element={<AdviserClassStudentGradesOverview />} />
        <Route path="/adviser/classes/grades/:sectionId/:studentId/subjects/:subjectId" element={<AdviserClassStudentGradesDetails />}
        />

        {/* School Forms */}
        <Route path="/adviser/school-forms" element={<AdviserSchoolForms />} />
        <Route path="/adviser/school-forms/:sectionId" element={<AdviserClassSchoolForms />} />

        {/* Profile */}
        <Route path="/adviser/profile" element={<AdviserProfile />} />

        {/* Shared Endpoints */}
        <Route path="/about-us" element={<AboutUs />} />
      </Route>
    </Routes>
  );
}

export default App;