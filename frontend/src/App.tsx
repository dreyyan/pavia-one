import { Routes, Route } from "react-router-dom";

// [IMPORT] Routes: Authentication
import Home from "./pages/Home";
import AdminLogin from "./pages/admin/AdminLogin";
import AdviserLogin from "./pages/adviser/AdviserLogin";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

// [IMPORT] Routes: Shared
import AboutUs from "./AboutUs";
import AnnouncementsEvents from "./AnnouncementsEvents";

// [IMPORT] Routes: Adviser
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
import AdviserSettings from "./pages/adviser/AdviserSettings";
import SF1View from "./pages/adviser/school_form_view/SF1View";

// [IMPORT] Routes: Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAdvisers from "./pages/admin/AdminAdvisers";
import AdminSections from "./pages/admin/AdminSections";
import AdminSubjects from "./pages/admin/AdminSubjects";

// [IMPORT] Context & Layout
import PrivateRoute from "./context/PrivateRoute";
import Layout from "./Layout";
import AdminStudentDetails from "./pages/admin/AdminStudentDetails";
import AdminSubjectDetails from "./pages/admin/AdminSubjectDetails";

function App() {
  return (
    <Routes>
      {/* [ROUTES] Public */}
      <Route path="/" element={<Home />} />

      {/* [ROUTES] Authentication */}
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/login/adviser" element={<AdviserLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<Layout />}>
        {/* [ROUTES] Adviser */}
        <Route element={<PrivateRoute role="adviser" />}>
          <Route path="/adviser/dashboard" element={<AdviserDashboard />} />
          <Route path="/adviser/classes" element={<AdviserClassManagement />} />
          <Route path="/adviser/classes/:id" element={<AdviserClassDetails />} />

          <Route path="/adviser/classes/:sectionId/students" element={<AdviserClassStudents />} />
          <Route path="/adviser/classes/:sectionId/students/:studentId" element={<AdviserClassStudentDetails />} />

          <Route path="/adviser/classes/grades/:sectionId" element={<AdviserClassGrades />} />
          <Route path="/adviser/classes/grades/:sectionId/:studentId" element={<AdviserClassStudentGradesOverview />} />
          <Route path="/adviser/classes/grades/:sectionId/:studentId/subjects/:subjectId" element={<AdviserClassStudentGradesDetails />} />

          <Route path="/adviser/school-forms" element={<AdviserSchoolForms />} />
          <Route path="/adviser/school-forms/:sectionId" element={<AdviserClassSchoolForms />} />
          <Route path="/forms/sf1/:sectionId/view" element={<SF1View />} />

          <Route path="/adviser/profile" element={<AdviserProfile />} />
          <Route path="/adviser/settings" element={<AdviserSettings />} />
        </Route>

        {/* [ROUTES] Admin */}
        <Route element={<PrivateRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/students/view/:id" element={<AdminStudentDetails />} />

          <Route path="/admin/advisers" element={<AdminAdvisers />} />
          <Route path="/admin/sections" element={<AdminSections />} />

          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/subjects/view/:id" element={<AdminSubjectDetails />} />
        </Route>

        {/* [ROUTES] Shared */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/announcements-and-events" element={<AnnouncementsEvents />} />
      </Route>
    </Routes>
  );
}

export default App;