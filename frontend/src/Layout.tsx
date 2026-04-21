import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useAuth } from "./context/useAuth";
import Modal from "./components/Modal";

export default function Layout() {
  const location = useLocation();

  const hideHeader =
    location.pathname === "/" ||
    location.pathname === "/login/admin" ||
    location.pathname === "/login/adviser" ||
    location.pathname === "/forgot-password";

  const hideFooter =
    location.pathname === "/login/admin" ||
    location.pathname === "/login/adviser" ||
    location.pathname === "/forgot-password";

  const { showTokenExpiredModal, setShowTokenExpiredModal, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}

      {/* [MODAL] Token Expired */}
      {showTokenExpiredModal && (
        <Modal
          isOpen={showTokenExpiredModal}
          onClose={() => setShowTokenExpiredModal(false)}
          onConfirm={() => {
            setShowTokenExpiredModal(false);
            logout();
          }}
          title="Session Expired"
          message="Your session has expired. Please log in again."
          type="error"
        />
      )}
    </div>
  );
}