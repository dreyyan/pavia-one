import { useState } from "react";
import ImageHeader from "../components/ImageHeader";
import RoleCard from "../components/RoleCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import PasswordRequirement from "../components/PasswordRequirement";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const SignUp = () => {
    const navigate = useNavigate();

    // States
    const [role, setRole] = useState<"Student" | "Adviser" | null>(null);
    const [LRN, setLRN] = useState("");
    const [adviserIdNumber, setAdviserIdNumber] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // [HANDLE] Sign Up
    const handleSignUp = async () => {
        setError("");
        setSuccessMessage("");

        // [1] Validate required fields
        if (!name || !email || !password || !confirmPassword || (role === "Student" && !LRN)) {
            setModalMessage("Please fill in all required fields.");
            setShowModal(true);
            return;
        }

        // [2] Student-specific validation
        if (role === "Student" && !/^\d{12}$/.test(LRN)) {
            setModalMessage("LRN must be a 12-digit number.");
            setShowModal(true);
            return;
        }

        // [3] Password confirmation
        if (password !== confirmPassword) {
            setModalMessage("Passwords do not match.");
            setShowModal(true);
            return;
        }

        // [4] Password strength
        if (password.length < 8) {
            setModalMessage("Password must be at least 8 characters.");
            setShowModal(true);
            return;
        }

        // [5] Prepare payload
        const payload: any = { name, email, password, confirmPassword };
        if (role === "Student") payload.lrn = LRN;

        if (role === "Adviser") {
            setModalMessage("Adviser sign-up is not available yet.");
            setShowModal(true);
            return;
        }

        // [6] Endpoint
        const endpoint = "/api/auth/sign-up";

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setModalMessage(data.message || "Sign Up failed.");
                setShowModal(true);
                return;
            }

            // [7] Success
            setModalMessage("Account created successfully! Redirecting to login...");
            setShowModal(true);

            setTimeout(() => navigate("/login"), 2000);
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
                title="Login Error"
                message={modalMessage}   // simple message
            />
            )}
            <ImageHeader />

            {/* STEP 1: Select Role */}
            {role === null && (
            <div className="flex flex-col justify-center items-center pt-15 px-6">
                <h2 className="text-[var(--color-primary-700)]">Sign up as</h2>

                {/* Role Cards */}
                <div className="flex gap-x-4 mt-4">
                    <RoleCard role="Student" icon="student-icon.svg" onClick={() => setRole("Student")} />
                    <RoleCard role="Adviser" icon="adviser-icon.svg" onClick={() => setRole("Adviser")} />
                </div>
            </div>
            )}

            {/* STEP 2: Sign Up as Role */}
            {role !== null && (
            <div className="flex flex-col pt-15 px-6">
                    {/* Back button */}
                    <button
                    onClick={() => {
                        setRole(null);
                        setLRN("");
                        setAdviserIdNumber("");
                        setPassword("");
                    }}
                    className="
                        absolute left-4 top-80 
                        flex items-center gap-2
                        bg-[var(--color-primary-700)] text-white 
                        px-4 py-2 rounded-full shadow-md 
                        hover:bg-[var(--color-primary-600)] 
                        transition-colors duration-200
                        text-sm font-semibold
                        z-50 cursor-pointer
                    ">
                    &larr; Change Role
                    </button>
                <h2 className="text-[var(--color-primary-700)]">Sign Up</h2>

                {/* Input Fields */}
                <div className="flex flex-col gap-y-4 mt-6 mb-3">
                  {role === "Student" && (
                    <InputField
                        label="Learner's Reference Number (LRN)"
                        type="text"
                        value={LRN}
                        onChange={(e) => setLRN(e.target.value)}
                        maxLength={12}
                        placeholder="100000000000"
                        iconSrc="student-id-number-icon.svg"
                    />
                  )}
                  {role === "Adviser" && (
                    <InputField
                        label="Adviser ID Number"
                        type="text"
                        value={adviserIdNumber}
                        onChange={(e) => setAdviserIdNumber(e.target.value)}
                        placeholder="2026-0001"
                        iconSrc="adviser-id-number-icon.svg"
                    />
                  )}
                  <InputField
                      label="Name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Juan dela Cruz"
                      iconSrc="name-icon.svg"
                  />
                  <InputField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@domain.com"
                      iconSrc="email-icon.svg"
                  />
                  <InputField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      iconSrc="password-icon.svg"
                  />
                  <InputField
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      iconSrc="password-icon.svg"
                  />
                </div>

                {/* Password Requirements */}
                <div className="mb-6">
                  <PasswordRequirement requirement="At least 8 characters" isMet={password.length >= 8} />
                  <PasswordRequirement requirement="Contains uppercase letter" isMet={/[A-Z]/.test(password)} />
                  <PasswordRequirement requirement="Contains lowercase letter" isMet={/[a-z]/.test(password)} />
                  <PasswordRequirement requirement="Contains number" isMet={/\d/.test(password)} />
                  <PasswordRequirement requirement="Contains special character" isMet={/[!@#$%^&*(),.?":{}|<>]/.test(password)} />
                </div>

                <PrimaryButton text="Sign Up" onClick={() => {handleSignUp()}} />
            </div>
            )}

            {/* [LINK] Navigate to Sign Up */}
            <span className="flex justify-center gap-x-1 mt-4">
                <p className="label-caption">Already have an account?</p>
                <a href="/login" className="link block text-center hover:underline text-[var(--color-primary-600)]">Login</a>
            </span>
        </div>
    );
};

export default SignUp;