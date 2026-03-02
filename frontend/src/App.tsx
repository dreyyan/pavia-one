import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// [IMPORT] Components
import Layout from "./Layout";
import AdminLogin from "./pages/AdminLogin"; 
import AdviserLogin from "./pages/AdviserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import AboutUs from "./AboutUs";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/adviser" element={<AdviserLogin />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/about-us" element={<AboutUs />} />
      </Route>
    </Routes>
  );
}

export default App;