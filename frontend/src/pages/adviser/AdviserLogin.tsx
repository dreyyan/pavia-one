import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";

const AdviserLogin = () => {
    const navigate = useNavigate();

    // [STATES]
    const [adviserId, setAdviserId] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [isCancelable, setIsCancelable] = useState(true);
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

    // [HANDLE] Login adviser
    const handleLogin = async () => {
        // Validation
        if (adviserId.trim() === "" || !password) {
            setModalTitle("Missing Information");
            setModalMessage("Please enter both your Adviser ID and password.");
            setIsCancelable(false);
            setShowModal(true);
            return;
        }

        const payload = { identifier: adviserId, password };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/adviser/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setModalTitle("Login Unsuccessful");
                setModalMessage(data.message || "Invalid credentials. Please try again.");
                setIsCancelable(false);
                setShowModal(true);
                return;
            }

            // Save session
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("role", "Adviser");

            setModalTitle("Welcome!");
            setModalMessage("Login successful. Redirecting to your dashboard...");
            setRedirectOnConfirm(true);
            setShowModal(true);

        } catch (err) {
            setModalTitle("Connection Error");
            setModalMessage("Could not connect to the server. Please check your internet.");
            setShowModal(true);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-[var(--color-bg-100)]">
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
                    isCancelable={isCancelable}
                />
            )}

            <ImageHeader />

            <main className="max-w-md mx-auto pt-10 px-6 sm:pt-20 lg:max-w-lg">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-[var(--color-primary-700)] text-center sm:text-left">
                        Adviser Login
                    </h1>
                    
                    <div className="flex flex-col gap-y-4 mt-8 mb-6">
                        <InputField
                            label="Adviser ID Number"
                            type="text"
                            value={adviserId}
                            onChange={(e) => setAdviserId(e.target.value)}
                            maxLength={8}
                            placeholder="12345678"
                            iconSrc="adviser-id-number-icon.svg"
                        />

                        <InputField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            iconSrc="password-icon.svg"
                        />
                    </div>

                    <div className="flex justify-between items-center mb-10 px-1">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary-600)]" />
                            Remember Me
                        </label>
                        <a href="/forgot-password?role=adviser" className="text-sm text-[var(--color-primary-700)] hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    <PrimaryButton text="Login" onClick={handleLogin} />
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                    <span className="text-sm text-gray-600">Not an Adviser? </span>
                    <a href="/login/admin" className="text-sm font-bold text-[var(--color-primary-600)] hover:underline">
                        Login as Admin
                    </a>
                </div>
            </main>
        </div>
    );
};

export default AdviserLogin;