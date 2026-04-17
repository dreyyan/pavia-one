// [IMPORT] Hooks
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// [IMPORT] Components
import InputField from "../components/InputField";
import PrimaryButton from "../components/buttons/PrimaryButton";
import Modal from "../components/Modal";

const ResetPassword = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get("role") || "adviser";

  // [STATES]
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isCancelable, setIsCancelable] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

  // [HANDLE] Reset password
  const handleReset = async () => {
    // ![ERROR] Empty Password & Confirm Password
    if (!password.trim() || !confirmPassword.trim()) {
      setModalTitle("Password required");
      setModalMessage("Please enter a new password and confirm it to continue.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    // ![ERROR] Non-matching passwords
    if (password !== confirmPassword) {
      setModalTitle("Passwords do not match");
      setModalMessage("The passwords you entered do not match. Please re-enter your new password and confirm it.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/auth/password/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role }),
      });

      const data = await res.json();

      // ![ERROR] Error response from backend
      const cleanMessage = data.message?.replace(/^\[ERROR\]\s*/, "");
      if (!res.ok || !data.success) {
          setModalTitle("Unable to reset password");
          setModalMessage(
            cleanMessage ||
            "We couldn’t reset your password at this time. Please try a different password or contact your school administrator if the problem persists."
          );
          setRedirectOnConfirm(false);
          setShowModal(true);
          return;
      }

      setIsSubmitted(true);

    } catch (err) {
      console.error(err);
      setModalTitle("Unable to reset password");
      setModalMessage("Something went wrong while resetting your password. Please try again. If the issue persists, contact your school administrator.");
      setIsCancelable(false);
      setRedirectOnConfirm(false);
      setShowModal(true);
    }
  };

  return (
    <div className="pb-20 bg-[var(--color-bg-100)] min-h-screen">
      {/* [COMPONENT] Modal */}
      {showModal && (
        <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onConfirm={() => {
                setShowModal(false);
                if (redirectOnConfirm) navigate("/adviser/dashboard");
            }}
            title={modalTitle}
            message={modalMessage}
            closeOnBackdrop={false}
            isCancelable={isCancelable}
          />
      )}

      {/* [SECTION] Reset Form */}
      <div className="flex flex-col pt-15 px-6">
        {/* [UI] Reset Password */}
        <h1 className="text-[var(--color-primary-700)]">Reset Password</h1>
        {/* [SECTION] Input Fields */}
        {!isSubmitted ? (
          <>
            <div className="space-y-4 my-6">
                <InputField
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                />
                <InputField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                />
            </div>
            <PrimaryButton text="Reset Password" onClick={handleReset} />
          </>
        ) : (
          <>
            <p className="font-roboto text-center mt-4 mb-8">
              Password reset successful! You can now log in.
            </p>
            <PrimaryButton
              text="Go to Login"
              onClick={() =>
                navigate(role === "admin" ? "/login/admin" : "/login/adviser")
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;