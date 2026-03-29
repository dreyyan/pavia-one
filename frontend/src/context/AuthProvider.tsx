import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Layout() {
  const location = useLocation();

  // Hide header/footer on login or password pages
  const hideHeaderFooter =
    location.pathname === "/login/admin" ||
    location.pathname === "/login/adviser" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}