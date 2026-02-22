// Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";

export default function Layout() {
  const location = useLocation();
  const hideHeader = location.pathname === "/login" || location.pathname === "/sign-up" || location.pathname === "/forgot";
  const hideFooter = location.pathname === "/login" || location.pathname === "/sign-up" || location.pathname === "/forgot";

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}