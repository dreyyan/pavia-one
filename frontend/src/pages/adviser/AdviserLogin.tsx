import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import BrandPanel from "../../components/BrandPanel";
import ImageHeader from "../../components/ImageHeader"; // Your existing header
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
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

    const handleLogin = async () => {
        if (!adviserId || !password) {
            setModalTitle("Required Fields");
            setModalMessage("Please fill in all fields.");
            setShowModal(true);
            return;
        }
        // ... (Your login fetch logic)
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white">
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
                />
            )}

            {/* --- LEFT SIDE: FORM & MOBILE HEADER --- */}
            <div className="flex flex-col w-full lg:w-[45%] min-h-screen">
                
                {/* [MOBILE ONLY HEADER] 
                    This uses your ImageHeader.tsx but only shows it on mobile (hidden on lg)
                */}
                <div className="lg:hidden">
                    <ImageHeader />
                </div>

                {/* [FORM AREA] 
                    Takes the rest of the space. On Desktop, it centers itself.
                */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
                    <div className="w-full max-w-[360px]">
                        <div className="text-center lg:text-left mb-8">
                            <h2 className="text-[var(--color-primary-600)] font-bold text-xl">Welcome Back!</h2>
                            <h1 className="text-[var(--color-primary-800)] font-black text-3xl md:text-4xl">Adviser Login</h1>
                        </div>

                        <div className="space-y-5">
                            <InputField
                                label="Adviser ID Number"
                                value={adviserId}
                                onChange={(e) => setAdviserId(e.target.value)}
                                placeholder="e.g. 2024-0001"
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

                        <div className="flex justify-between items-center my-6 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="accent-[var(--color-primary-600)] w-4 h-4" />
                                <span className="text-gray-500">Remember Me</span>
                            </label>
                            <a href="/forgot" className="text-[var(--color-primary-600)] font-semibold hover:underline">Forgot Password?</a>
                        </div>

                        <PrimaryButton text="Login" onClick={handleLogin} />

                        <div className="mt-12 text-center border-t pt-6 border-gray-100">
                            <p className="text-gray-500 text-sm">
                                Not an Adviser?{" "}
                                <a href="/login/admin" className="text-[var(--color-primary-600)] font-bold hover:underline">Login as Admin</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: DESKTOP BRAND PANEL --- */}
            {/* This is hidden on mobile, shown on desktop */}
            <BrandPanel />
        </div>
    );
};

export default AdviserLogin;