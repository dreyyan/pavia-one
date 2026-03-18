import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";
import Modal from "./components/Modal"; // import your custom Modal
import { useState } from "react";

export default function Layout() {
  const location = useLocation();
  const hideHeaderFooter =
    location.pathname === "/login/admin" ||
    location.pathname === "/login/adviser" ||
    location.pathname === "/forgot-password";

  const { showTokenExpiredModal, setShowTokenExpiredModal, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!hideHeaderFooter && <Footer />}

      {/* Token Expired Modal using custom Modal */}
      {showTokenExpiredModal && (
        <Modal
          isOpen={showTokenExpiredModal}
          onClose={() => setShowTokenExpiredModal(false)}
          onConfirm={() => {
            setShowTokenExpiredModal(false);
            logout(); // log out and redirect to login
          }}
          title="Session Expired"
          message="Your session has expired. Please log in again."
          type="error"
        />
      )}
    </div>
  );
}