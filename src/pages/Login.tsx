import { useState } from "react";
import ImageHeader from "../components/ImageHeader";
import RoleCard from "../components/RoleCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    // States
    const [role, setRole] = useState<"Student" | "Adviser" | null>(null);
    const [LRN, setLRN] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");


    // [HANDLE] Login
    const handleLogin = async () => {
    setError(""); 

    // Validate
    if (role === "Student" && LRN.trim().length !== 12) {
        setError("Please enter a valid 12-digit LRN.");
        return;
    }
    if (role === "Adviser" && email.trim() === "") {
        setError("Please enter your Adviser ID.");
        return;
    }
    if (!password) {
        setError("Please enter your password.");
        return;
    }

    const payload = {
        role,
        identifier: role === "Student" ? LRN : email,
        password,
    };

    try {
        const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            setModalMessage(data.message || "Login failed.");
            setShowModal(true);
            return;
        }

        // Save token & redirect
        localStorage.setItem("token", data.token);
        if (role === "Student") {
        navigate("/student/dashboard");
        } else {
        navigate("/adviser/dashboard");
        }
    } catch (err) {
        console.error(err);
        setModalMessage("Something went wrong. Please try again.");
        setShowModal(true);
    }
    };

    return (
        <div className="pb-20">
            {showModal && (
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Login Error"
                message={modalMessage}   // simple message
            />
            )}
            <ImageHeader />

            {/* STEP 1: Select Role */}
            {role === null && (
                <div className="flex flex-col justify-center items-center pt-15 px-6">
                    <h2 className="text-[var(--color-primary-700)]">Login as</h2>

                    {/* Role Cards */}
                    <div className="flex gap-x-4 mt-4">
                        <RoleCard role="Student" icon="student-icon.svg" onClick={() => setRole("Student")} />
                        <RoleCard role="Adviser" icon="adviser-icon.svg" onClick={() => setRole("Adviser")} />
                    </div>
                </div>
            )}

            {/* STEP 2: Login as Role */}
            {role !== null && (
            <div className="flex flex-col pt-15 px-6">
                {/* Back button */}
                <button
                onClick={() => {
                    setRole(null);
                    setEmail("");
                    setPassword("");
                }}
                className="
                    absolute left-4 top-80 
                    flex items-center gap-2
                    bg-[var(--color-primary-700)] text-white 
                    px-4 py-2 rounded-full shadow-md 
                    hover:bg-[var(--color-primary-600)] 
                    transition-colors duration-200
                    text-sm font-semibold
                    z-50 cursor-pointer
                ">
                &larr; Change Role
                </button>
                    
                <h2 className="text-[var(--color-primary-700)]">Login</h2>

                {/* Input Fields */}
                <div className="flex flex-col gap-y-4 mt-6 mb-2">
                    {role == "Student" ? (
                    <InputField
                        label="Learner's Reference Number (LRN)"
                        type="text"
                        value={LRN}
                        onChange={(e) => setLRN(e.target.value)}
                        maxLength={12}
                        placeholder="100000000000"
                        iconSrc="student-id-number-icon.svg"
                    />
                ) : (
                    <InputField
                        label="Adviser ID Number"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={12}
                        placeholder="2006-0001"
                        iconSrc="adviser-id-number-icon.svg"
                    />
                    )}
                    
                    <InputField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        iconSrc="password-icon.svg"
                    />
                </div>

                {/* Auxiliary Actions */}
                <div className="flex justify-between items-center mt-2 px-2 mb-10">
                    {/* Remember Me */}
                    <label className="flex items-center gap-2 label-caption text-[var(--color-text-900)]">
                        <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary-600)]"/>
                        Remember Me
                    </label>

                    {/* Forgot Password */}
                    <a href="/forgot-password" className="link text-[var(--color-primary-700)] hover:underline">
                        Forgot Password?
                    </a>
                </div>

                <PrimaryButton text="Login" onClick={() => {handleLogin()}} />
            </div>
            )}

            {/* [LINK] Navigate to Sign Up */}
            <span className="flex justify-center gap-x-1 mt-4">
                <p className="label-caption">Don't have an account?</p>
                <a href="/sign-up" className="link block text-center hover:underline text-[var(--color-primary-600)]">Sign Up</a>
            </span>
        </div>
    );
};

export default Login;