import { useState } from "react";
import { useNavigate } from "react-router-dom";

// [IMPORT] Components
import BrandPanel from "../../components/BrandPanel";
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
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

    const handleLogin = async () => {
        if (!adviserId || !password) {
            setModalTitle("Required Fields");
            setModalMessage("Please fill in all fields.");
            setShowModal(true);
            return;
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
                        if (redirectOnConfirm) navigate("/adviser/dashboard");
                    }}
                    title={modalTitle} 
                    message={modalMessage} 
                />
            )}

            {/* --- LEFT SIDE: FORM & MOBILE HEADER --- */}
            {/* Added overflow-y-auto so the form is scrollable on small screens */}
            <div className="flex flex-col w-full lg:w-[55%] h-full overflow-y-auto">
                
                <div className="lg:hidden shrink-0">
                    <ImageHeader />
                </div>

                {/* [FORM AREA] 
                    Heavily scaled for 1440px (xl: and 2xl: modifiers)
                */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-16 lg:p-20 xl:p-32 2xl:p-40">
                    <div className="w-full max-w-[360px] xl:max-w-[480px] 2xl:max-w-[550px] transition-all duration-300">
                        
                        <div className="text-center lg:text-left mb-10 xl:mb-14">
                            <h2 className="text-[var(--color-primary-600)] font-bold text-xl xl:text-2xl 2xl:text-3xl">
                                Welcome Back!
                            </h2>
                            <h1 className="text-[var(--color-primary-800)] font-black text-3xl xl:text-5xl 2xl:text-6xl mt-2">
                                Adviser Login
                            </h1>
                        </div>

                        <div className="space-y-6 xl:space-y-8">
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

                        <div className="flex justify-between items-center my-8 xl:my-10 text-sm xl:text-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="accent-[var(--color-primary-600)] w-4 h-4 xl:w-5 xl:h-5" />
                                <span className="text-gray-500 font-medium">Remember Me</span>
                            </label>
                            <a href="/forgot" className="text-[var(--color-primary-600)] font-bold hover:underline">
                                Forgot Password?
                            </a>
                        </div>

                        <PrimaryButton text="Login" onClick={handleLogin} />

                        <div className="mt-12 xl:mt-16 text-center border-t pt-8 border-gray-100">
                            <p className="text-gray-500 text-sm xl:text-lg">
                                Not an Adviser?{" "}
                                <a href="/login/admin" className="text-[var(--color-primary-600)] font-bold hover:underline">
                                    Login as Admin
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: DESKTOP BRAND PANEL --- */}
            {/* Added h-full and fixed width to match the Home page split */}
            <div className="hidden lg:flex lg:w-[45%] h-full border-l border-gray-100 shadow-2xl">
                <BrandPanel />
            </div>
        </div>
    );
};

export default AdviserLogin;