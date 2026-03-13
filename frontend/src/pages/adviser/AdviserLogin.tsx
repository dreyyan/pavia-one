import { useState } from "react";
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import { useNavigate } from "react-router-dom";

const AdviserLogin = () => {
    const navigate = useNavigate();

    // *STATES
    const [adviserId, setAdviserId] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // *HANDLES
    const handleLogin = async () => {
        // ![ERROR] Empty Adviser ID
        if (adviserId.trim() === "") {
            setModalMessage("Please enter your Adviser ID.");
            setShowModal(true);
            return;
        }

        // ![ERROR] Empty Password
        if (!password) {
            setModalMessage("Please enter your password.");
            setShowModal(true);
            return;
        }

        const payload = {
            identifier: adviserId,
            password,
        };

        try {
            const res = await fetch("/api/auth/advisers/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            // ![ERROR] Error response from backend
            if (!res.ok) {
                setModalMessage(data.message || "Login failed.");
                setShowModal(true);
                return;
            }

            // *[SUCCESS] Navigate to Dashboard
            localStorage.setItem("token", data.token);
            navigate("/adviser/dashboard");

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
                    title="Login Error"
                    message={modalMessage}
                />
            )}

            {/* [COMPONENT] Image Header */}
            <ImageHeader />

            <div className="flex flex-col pt-15 px-6">
                {/* Header */}
                <h1 className="text-[var(--color-primary-700)]">
                    Adviser Login
                </h1>

                {/* [SECTION] Input Fields */}
                <div className="flex flex-col gap-y-4 mt-6 mb-2">
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

                {/* [SECTION] Auxiliary Actions */}
                <div className="flex justify-between items-center mt-2 px-2 mb-10">
                    <label className="flex items-center gap-2 label-caption text-[var(--color-text-900)]">
                        <input
                            type="checkbox"
                            className="w-4 h-4 accent-[var(--color-primary-600)]"
                        />
                        Remember Me
                    </label>

                    <a
                        href={`/forgot-password?role=adviser`}
                        className="link text-[var(--color-primary-700)] hover:underline"
                    >
                        Forgot Password?
                    </a>
                </div>

                {/* [PRIMARY BUTTON] Login */}
                <PrimaryButton text="Login" onClick={handleLogin} />
            </div>

            {/* [SECTION] Switch Login Role Link */}
            <div className="flex justify-center items-center gap-x-1 mt-4 text-sm">
                <span className="label-caption">Not an Adviser?</span>
                <a
                    href="/login/admin"
                    className="link hover:underline text-[var(--color-primary-600)]"
                >
                    Login as Admin
                </a>
            </div>
        </div>
    );
};

export default AdviserLogin;