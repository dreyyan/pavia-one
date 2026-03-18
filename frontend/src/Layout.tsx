import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext"; // we’ll create this

export default function Layout() {
  const location = useLocation();
  const hideHeaderFooter =
    location.pathname === "/login/admin" ||
    location.pathname === "/login/adviser" ||
    location.pathname === "/forgot-password";

  const { showTokenExpiredModal, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideHeaderFooter && <Footer />}

      {/* Token Expired Modal */}
      {showTokenExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 text-center space-y-4 shadow-lg">
            <h2 className="text-lg font-bold">Session Expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-white rounded-md font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}