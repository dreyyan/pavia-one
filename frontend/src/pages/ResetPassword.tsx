import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import Modal from "../components/Modal";

const ResetPassword = () => {
  const { token } = useParams(); // token from URL
  const location = useLocation();
  const navigate = useNavigate();

  // Get role from query string
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get("role") || "adviser";

  // States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setModalMessage("Please fill in all fields.");
      setShowModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalMessage("Passwords do not match.");
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

      if (!res.ok) {
        setModalMessage(data.message || "Failed to reset password.");
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
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Reset Error"
          message={modalMessage}
        />
      )}

      <div className="flex flex-col pt-15 px-6">
        <h1 className="text-[var(--color-primary-700)]">Reset Password</h1>
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
            <p className="text-center mt-4 mb-8">
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