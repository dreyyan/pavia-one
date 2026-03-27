// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
// BrandPanel removed as it's now integrated into ImageHeader
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
        <div className="flex flex-col lg:flex-row h-screen w-full bg-white overflow-hidden">
            
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
            <div className="flex flex-col w-full lg:w-[55%] h-full overflow-y-auto">
                
                <div className="lg:hidden shrink-0">
                    <ImageHeader />
                </div>

                {/* [FORM AREA] */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-16 lg:p-20 xl:p-32">
                    <div className="w-full max-w-[340px] xl:max-w-[480px] 2xl:max-w-[520px] transition-all duration-300">
                        
                        <div className="text-center lg:text-left mb-10 xl:mb-14">
                            <h2 className="text-[var(--color-primary-600)] font-bold text-xl xl:text-2xl 2xl:text-3xl tracking-tight">
                                Welcome back!
                            </h2>
                            <h1 className="text-[var(--color-primary-800)] font-black text-3xl xl:text-5xl 2xl:text-6xl mt-2">
                                Admin Login
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm xl:text-lg">
                                Secure access for PaviaOne Administrators
                            </p>
                        </div>

                        <div className="space-y-6 xl:space-y-8">
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

                        <div className="flex justify-between items-center my-6 xl:my-8 text-sm xl:text-base">
                            <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 xl:w-5 xl:h-5 rounded accent-[var(--color-primary-600)] cursor-pointer"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="font-medium">Remember Me</span>
                            </label>

                            <a
                                href={`/forgot-password?role=admin`}
                                className="font-bold text-[var(--color-primary-700)] hover:underline"
                            >
                                Forgot Password?
                            </a>
                        </div>

                        <PrimaryButton text="Login" onClick={handleLogin} />

                        <div className="mt-12 xl:mt-16 pt-8 border-t border-gray-100 text-center">
                            <p className="text-gray-500 text-sm xl:text-lg">
                                Not an Admin?{" "}
                                <a
                                    href="/login/adviser"
                                    className="font-bold text-[var(--color-primary-600)] hover:underline"
                                >
                                    Login as Adviser
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: DESKTOP BRAND PANEL --- */}
            {/* Swapped BrandPanel for ImageHeader to match AdviserLogin and Home fixes */}
            <div className="hidden lg:flex lg:w-[45%] h-full border-l border-gray-100 shadow-2xl overflow-hidden">
                <ImageHeader />
            </div>
        </div>
    );
};

export default AdminLogin;