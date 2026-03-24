// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import BrandPanel from "../../components/BrandPanel";
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
        /* The main wrapper uses flex-col for mobile and flex-row for desktop split-screen */
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white overflow-x-hidden">
            
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

            {/* --- LEFT SIDE: FORM & MOBILE HEADER --- */}
            <div className="flex flex-col w-full lg:w-[45%] min-h-screen">
                
                {/* [MOBILE ONLY HEADER] 
                    Only visible on screens smaller than 1024px (lg)
                */}
                <div className="lg:hidden">
                    <ImageHeader />
                </div>

                {/* [FORM AREA] 
                    Takes the rest of the space and centers the content
                */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
                    <div className="w-full max-w-[360px]">
                        
                        {/* [UI] Admin Login Title */}
                        <div className="text-center lg:text-left mb-8">
                            <h2 className="text-[var(--color-primary-600)] font-bold text-xl tracking-tight">Welcome back!</h2>
                            <h1 className="text-[var(--color-primary-800)] font-black text-3xl md:text-4xl">
                                Admin Login
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm">
                                Secure access for PaviaOne Administrators
                            </p>
                        </div>

                        {/* [SECTION] Input Fields */}
                        <div className="space-y-5">
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
                        <div className="flex justify-between items-center my-6 text-sm">
                            <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded accent-[var(--color-primary-600)] cursor-pointer"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember Me</span>
                            </label>

                            <a
                                href={`/forgot-password?role=admin`}
                                className="font-semibold text-[var(--color-primary-700)] hover:underline"
                            >
                                Forgot Password?
                            </a>
                        </div>

                        {/* [PRIMARY BUTTON] Login */}
                        <PrimaryButton text="Login" onClick={handleLogin} />

                        {/* [LINK] Switch to Adviser Login */}
                        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                            <span className="text-sm text-gray-400">Not an Admin? </span>
                            <a
                                href="/login/adviser"
                                className="text-sm font-bold text-[var(--color-primary-600)] hover:underline"
                            >
                                Login as Adviser
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: DESKTOP BRAND PANEL --- 
                Visible only on desktop screens (lg:flex)
            */}
            <BrandPanel />
        </div>
    );
};

export default AdminLogin;