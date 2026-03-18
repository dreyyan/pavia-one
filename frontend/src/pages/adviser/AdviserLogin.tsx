import { useState } from "react";
import ImageHeader from "../../components/ImageHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Modal from "../../components/Modal";
import { useNavigate } from "react-router-dom";

const AdviserLogin = () => {
    const navigate = useNavigate();

    const [adviserId, setAdviserId] = useState("");
    const [password, setPassword] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalType, setModalType] = useState<"default" | "error" | "success" | "info" | "warning">("default");
    const [redirectOnConfirm, setRedirectOnConfirm] = useState(false);

    const handleLogin = async () => {
        if (adviserId.trim() === "") {
            setModalTitle("Login Error");
            setModalMessage("Please enter your Adviser ID.");
            setModalType("error");
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        if (!password) {
            setModalTitle("Login Error");
            setModalMessage("Please enter your password.");
            setModalType("error");
            setRedirectOnConfirm(false);
            setShowModal(true);
            return;
        }

        const payload = {
            identifier: adviserId,
            password,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/adviser/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setModalTitle("Login Error");
                setModalMessage(data.message || "Login failed.");
                setModalType("error");
                setRedirectOnConfirm(false);
                setShowModal(true);
                return;
            }

            localStorage.setItem("token", data.data.token);
            localStorage.setItem("role", "Adviser");

            setModalTitle("Login Successful");
            setModalMessage("Login successful. Redirecting you to your dashboard...");
            setModalType("success");
            setRedirectOnConfirm(true);
            setShowModal(true);

        } catch (err) {
            console.error(err);
            setModalTitle("Login Error");
            setModalMessage("Something went wrong. Please try again.");
            setModalType("error");
            setRedirectOnConfirm(false);
            setShowModal(true);
        }
    };

    return (
        <div className="pb-20 bg-[var(--color-bg-100)]">
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
                    type={modalType}
                />
            )}

            <ImageHeader />

            <div className="flex flex-col pt-15 px-6">
                <h1 className="text-[var(--color-primary-700)]">
                    Adviser Login
                </h1>

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

                <PrimaryButton text="Login" onClick={handleLogin} />
            </div>

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