// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// [IMPORT] Components
import ImageHeader from "../components/ImageHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import Modal from "../components/Modal";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get("role") || "adviser";

  // [STATES]
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

  // [HANDLE] Reset password
  const handleReset = async () => {
    // ![ERROR] Empty Email Address
    if (!email.trim()) {
      setModalTitle("Email address required");
      setModalMessage("Please enter your email address to continue.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    // ![ERROR] Invalid Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setModalTitle("Invalid email address");
      setModalMessage("Please enter a valid email address.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch("/api/auth/password/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      // ![ERROR] Error response from backend
      if (!res.ok || !data.success) {
          setModalTitle("Unable to send reset link");
          setModalMessage("We couldn’t send the password reset link at this time. Please check your internet connection and try again. If the problem continues, contact the school administrator.");
          setIsCancelable(false);
          setRedirectOnConfirm(false);
          setShowModal(true);
          return;
      }

      setIsSubmitted(true);

    } catch (err) {
      console.error(err);
      setModalTitle("Unable to send reset link");
      setModalMessage("Something went wrong while trying to send the password reset link. Please check your internet connection and try again. If the problem continues, contact the school administrator.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
    }
  };

  return (
    <div className="pb-20 bg-[var(--color-bg-50)] min-h-screen">
      {/* [COMPONENT] Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);

            if (redirectOnConfirm) {
              const role = localStorage.getItem("role")?.toLowerCase();
              if (role) {
                navigate(`/${role}/dashboard`);
              } else {
                navigate("/");
              }
            }
          }}
          title={modalTitle}
          message={modalMessage}
          closeOnBackdrop={false}
          isCancelable={isCancelable}
        />
      )}

      {/* [COMPONENT] Image Header */}
      <ImageHeader />

      {/* [SECTION] Reset Form */}
      <div className="flex flex-col pt-15 px-6">
        {/* [UI] Forgot Password */}
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

            {/* [PRIMARY BUTTON] Send Reset Link */}
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

            {/* [PRIMARY BUTTON] Return to Login */}
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