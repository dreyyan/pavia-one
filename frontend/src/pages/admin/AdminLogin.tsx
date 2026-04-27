// [IMPORT] Hooks
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// [IMPORT] Components
import ImageHeader from "../../components/authentication/ImageHeader";
import InputField from "../../components/toolbar/InputField";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Modal from "../../components/modal/Modal";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

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
        // ![ERROR] Empty Username
        if (username.trim() === "") {
            setModalTitle("Username required");
            setModalMessage("Please enter your username to continue.");
            setIsCancelable(false);
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        // ![ERROR] Empty Password
        if (!password) {
            setModalTitle("Password required");
            setModalMessage("Please enter your password to continue.");
            setIsCancelable(false);
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        // [PAYLOAD] Prepare login request
        const payload = {
            username,
            password,
            rememberMe,
        };

        const token = localStorage.getItem("token");

        try {
            // [REQUEST] Send login request to backend
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/admin/login`, {
                method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            // ![ERROR] Login failed
            if (!res.ok || !data.success) {
                setModalTitle("Login unsuccessful");
                setModalMessage("We couldn't log you in. Please check your username and password and try again.");
                setIsCancelable(false);
                setRedirectOnConfirm(false);
                setShowModal(true);
                return;
            }

            // *[SUCCESS] Store token and role
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("role", "admin");

            // update auth context
            setUser({ id: 0, name: username, role: "admin" });

            setModalTitle("Login successful");
            setModalMessage("You have successfully signed in. Redirecting you to your dashboard...");
            setIsCancelable(false);
            setRedirectOnConfirm(true);
            setShowModal(true);

            setTimeout(() => navigate("/admin/dashboard"), 800);

        } catch (err) {
            console.error(err);
            // ![ERROR] Network or server issue
            setModalTitle("Login unsuccessful");
            setModalMessage("Something went wrong while trying to sign you in. Please check your internet connection and try again.");
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

            {/* [SECTION] Login Form */}
            <div className="flex flex-col pt-15 px-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                {/* [UI] Admin Login */}
                <h1 className="text-[var(--color-primary-700)] text-lg sm:text-xl md:text-2xl">
                    Admin Login
                </h1>

                {/* [SECTION] Input Fields */}
                <div className="flex flex-col gap-y-4 mt-6 mb-2">
                    <InputField
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={7}
                        placeholder="Enter your username"
                        iconSrc="username.svg"
                    />

                    <InputField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        iconSrc="password.svg"
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
                        href={`/forgot-password?role=admin`}
                        className="link text-[var(--color-primary-700)] hover:underline mt-2 sm:mt-0"
                    >
                        Forgot Password?
                    </a>
                </div>

                {/* [PRIMARY BUTTON] Login */}
                <PrimaryButton text="Login" onClick={handleLogin} />
            </div>

            {/* [LINK] Adviser Login */}
            <div className="flex justify-center gap-x-1 mt-4 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                <p className="label-caption text-center">
                    Not an Admin?{" "}
                    <a
                        href="/login/adviser"
                        className="link text-[var(--color-primary-600)] hover:underline"
                    >
                        Login as Adviser
                    </a>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;