// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";

const AdminLogin = () => {
    const navigate = useNavigate();

    // [STATES]
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [isCancelable, setIsCancelable] = useState(true);
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // [HANDLE] Login admin
    const handleLogin = async () => {
        // Validation
        if (username.trim() === "") {
            setModalTitle("Username required");
            setModalMessage("Please enter your username to continue.");
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

        const payload = { username, password, rememberMe };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setModalTitle("Login unsuccessful");
                setModalMessage("Invalid username or password. Please try again.");
                setIsCancelable(false);
                setRedirectOnConfirm(false);
                setShowModal(true);
                return;
            }

            // *[SUCCESS] Store session
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("role", "Admin");

            setModalTitle("Login successful");
            setModalMessage("Welcome, Admin! Redirecting you to your dashboard...");
            setRedirectOnConfirm(true);
            setShowModal(true);

        } catch (err) {
            console.error(err);
            setModalTitle("Login unsuccessful");
            setModalMessage("Could not connect to the server. Please check your connection.");
            setShowModal(true);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-[var(--color-bg-100)]">
            {/* [COMPONENT] Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={() => {
                        setShowModal(false);
                        if (redirectOnConfirm) navigate("/admin/dashboard");
                    }}
                    title={modalTitle}
                    message={modalMessage}
                    closeOnBackdrop={false}
                    isCancelable={isCancelable}
                />
            )}

            {/* [COMPONENT] Image Header */}
            <ImageHeader />

            {/* [MAIN WRAPPER] Responsive Container */}
            <main className="max-w-md mx-auto pt-10 px-6 sm:pt-20 lg:max-w-lg">
                <div className="flex flex-col">
                    {/* [UI] Admin Login Title */}
                    <h1 className="text-3xl font-bold text-[var(--color-primary-700)] text-center sm:text-left">
                        Admin Login
                    </h1>
                    <p className="text-[var(--color-text-700)] mt-2 text-center sm:text-left">
                        Secure access for PaviaOne Administrators
                    </p>

                    {/* [SECTION] Input Fields */}
                    <div className="flex flex-col gap-y-4 mt-8 mb-2">
                        <InputField
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={7}
                            placeholder="Enter your username"
                            iconSrc="username-icon.svg"
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
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-y-3 px-1 mb-10">
                        <label className="flex items-center gap-2 text-sm text-[var(--color-text-900)] cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-[var(--color-primary-600)]"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember Me</span>
                        </label>

                        <a
                            href={`/forgot-password?role=admin`}
                            className="text-sm font-medium text-[var(--color-primary-700)] hover:underline"
                        >
                            Forgot Password?
                        </a>
                    </div>

                    {/* [PRIMARY BUTTON] Login */}
                    <div className="w-full">
                        <PrimaryButton text="Login" onClick={handleLogin} />
                    </div>
                </div>

                {/* [LINK] Switch to Adviser Login */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                    <span className="text-sm text-gray-600">Not an Admin? </span>
                    <a
                        href="/login/adviser"
                        className="text-sm font-bold text-[var(--color-primary-600)] hover:underline"
                    >
                        Login as Adviser
                    </a>
                </div>
            </main>
        </div>
    );
};

export default AdminLogin;