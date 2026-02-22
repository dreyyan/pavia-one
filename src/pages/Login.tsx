    import { useState } from "react";
    import ImageHeader from "../components/ImageHeader";
    import RoleCard from "../components/RoleCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

    const Login = () => {
        // States
        const [role, setRole] = useState<"Student" | "Adviser" | null>(null);
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");

        return (
            <div className="pb-20">
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
                    <h2 className="text-[var(--color-primary-700)]">Login</h2>

                    {/* Input Fields */}
                    <div className="flex flex-col gap-y-4 mt-6 mb-2">
                        <InputField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            iconSrc="email-username-icon.svg"
                        />

                        <InputField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
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
                        <a href="/forgot-password" className="link text-[var(--color-primary-600)] hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    <PrimaryButton text="Login" onClick={() => {}} />
                </div>
                )}

                {/* [LINK] Navigate to Sign Up */}
                <span className="flex justify-center gap-x-1 mt-4">
                    <p className="label-caption">Don't have an account?</p>
                    <a href="" className="link block text-center underline text-[var(--color-primary-700)]">Sign Up</a>
                </span>
            </div>
        );
    };

    export default Login;