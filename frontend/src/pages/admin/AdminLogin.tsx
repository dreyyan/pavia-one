import { useState } from "react";
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
    const navigate = useNavigate();

    // *STATES
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // *HANDLES
    const handleLogin = async () => {
        // ![ERROR] Empty Username
        if (username.trim() === "") {
            setModalMessage("Please enter your username.");
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
            identifier: username,
            password,
        };

        try {
            const res = await fetch("/api/auth/admin/login", {
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
            navigate("/admin/dashboard");

        } catch (err) {
            console.error(err);
            setModalMessage("Something went wrong. Please try again.");
            setShowModal(true);
        }
    };

    return (
        <div className="pb-20 bg-[var(--color-bg-100)]">
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
                <div className="flex justify-between items-center mt-2 px-2 mb-10">
                    <label className="flex items-center gap-2 label-caption text-[var(--color-text-900)]">
                        <input
                            type="checkbox"
                            className="w-4 h-4 accent-[var(--color-primary-600)]"
                        />
                        Remember Me
                    </label>

                    <a
                        href={`/forgot-password?role=admin`}
                        className="link text-[var(--color-primary-700)] hover:underline"
                    >
                        Forgot Password?
                    </a>
                </div>

                {/* [PRIMARY BUTTON] Login */}
                <PrimaryButton text="Login" onClick={handleLogin} />
            </div>

            {/* [SECTION] Switch Login Role Link */}
            <div className="flex justify-center mt-4">
                <p className="label-caption">
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