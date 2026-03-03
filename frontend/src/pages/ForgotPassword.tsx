import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ImageHeader from "../components/ImageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import Modal from "../components/Modal";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // *ROLE (from query string)
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get("role") || "adviser"; // default role

  // *STATES
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // *HANDLES
  const handleReset = async () => {
    // ![ERROR] Empty Email
    if (!email.trim()) {
      setModalMessage("Please enter your email address.");
      setShowModal(true);
      return;
    }

    // ![ERROR] Invalid Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setModalMessage("Please enter a valid email address.");
      setShowModal(true);
      return;
    }

    try {
      // Call backend
      const res = await fetch("/api/auth/password/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalMessage(data.message || "Failed to send reset link.");
        setShowModal(true);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setModalMessage("Something went wrong. Please try again.");
      setShowModal(true);
    }
  };

  return (
    <div className="pb-20">
      {/* [COMPONENT] Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Reset Error"
          message={modalMessage}
        />
      )}

      {/* [COMPONENT] Image Header */}
      <ImageHeader />

      <div className="flex flex-col pt-15 px-6">
        {/* Header */}
        <h1 className="text-[var(--color-primary-700)]">Forgot Password</h1>

        <p className="label-caption text-[var(--color-text-800)] mt-2 mb-6">
          Enter your email address and we’ll send you a password reset link.
        </p>

        {!isSubmitted ? (
          <>
            {/* [SECTION] Input Field */}
            <div className="mb-8">
              <InputField
                label="Email Address"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                iconSrc="email-icon.svg"
              />
            </div>

            {/* [PRIMARY BUTTON] Send Reset */}
            <PrimaryButton text="Send Reset Link" onClick={handleReset} />
          </>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm text-[var(--color-text-900)] text-center">
                If an account exists for <strong>{email}</strong>, you will
                receive a password reset link shortly.
              </p>
            </div>

            <PrimaryButton
              text="Return to Login"
              onClick={() =>
                navigate(role === "admin" ? "/login/admin" : "/login/adviser")
              }
            />
          </>
        )}

        {/* [SECTION] Back to Login Link */}
        {!isSubmitted && (
          <div className="flex justify-center items-center gap-x-1 mt-6 text-sm">
            <span className="label-caption">Remember your password?</span>
            <button
              onClick={() =>
                navigate(role === "admin" ? "/login/admin" : "/login/adviser")
              }
              className="link hover:underline text-[var(--color-primary-600)] cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;