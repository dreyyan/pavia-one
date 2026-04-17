// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Modal from "../../components/Modal";

const AdviserLogin = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    // [STATES]
    const [adviserId, setAdviserId] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [isCancelable, setIsCancelable] = useState(true);
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

    const handleLogin = async () => {
        if (adviserId.trim() === "") {
            setModalTitle("Adviser ID required");
            setModalMessage("Please enter your Adviser ID to continue.");
            setIsCancelable(false);
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        if (!password) {
            setModalTitle("Password required");
            setModalMessage("Please enter your password to continue.");
            setIsCancelable(false);
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        const payload = {
            adviserId: adviserId.trim(),
            password,
            rememberMe,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/adviser/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setModalTitle("Login unsuccessful");
                setModalMessage(data.message || "Invalid credentials");
                setIsCancelable(false);
                setRedirectOnConfirm(false);
                setShowModal(true);
                return;
            }

            const { adviser, token } = data.data;

            // Save token BEFORE navigating
            localStorage.setItem("token", token);
            localStorage.setItem("role", "adviser");

            setUser({
                id: adviser.adviserId,
                name: adviser.name,
                role: "adviser",
            });

            setModalTitle("Login successful");
            setModalMessage("You have successfully signed in. Redirecting you to your dashboard...");
            setIsCancelable(false);
            setRedirectOnConfirm(true);
            setShowModal(true);

            setTimeout(() => { navigate("/adviser/dashboard", { replace: true }); }, 800);

        } catch (err) {
            console.error(err);
            setModalTitle("Login unsuccessful");
            setModalMessage("Network error. Please try again.");
            setIsCancelable(false);
            setRedirectOnConfirm(false);
            setShowModal(true);
        }
    };

    return (
        <div className="pb-20 bg-[var(--color-bg-100)] min-h-screen flex flex-col items-center">
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

            {/* [COMPONENT] Image Header */}
            <ImageHeader />

            {/* [SECTION] Login Form */}
            <div className="flex flex-col pt-15 px-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                {/* [UI] Adviser Login */}
                <h1 className="text-[var(--color-primary-700)] text-lg sm:text-xl md:text-2xl">
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
                <div className="flex sm:flex-row justify-between items-center mt-2 px-2 mb-10">
                    <label className="flex items-center gap-2 label-caption text-[var(--color-text-900)]">
                        <input
                            type="checkbox"
                            className="w-4 h-4 accent-[var(--color-primary-600)]"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
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

            {/* [LINK] Admin Login */}
            <div className="flex justify-center gap-x-1 mt-4 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                <span className="label-caption text-center">Not an Adviser?</span>
                <a
                    href="/login/admin"
                    className="link text-[var(--color-primary-600)] hover:underline"
                >
                    Login as Admin
                </a>
            </div>
        </div>
    );
};

export default AdviserLogin;