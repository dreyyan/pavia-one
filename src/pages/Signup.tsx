import { useState } from "react";
import ImageHeader from "../components/ImageHeader";
import RoleCard from "../components/RoleCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import PasswordRequirement from "../components/PasswordRequirement";

const SignUp = () => {
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
                <h2 className="text-[var(--color-primary-700)]">Sign up as</h2>

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
                <div className="flex flex-col gap-y-4 mt-6 mb-3">
                  {role === "Student" && (
                    <InputField
                        label="Student ID"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your student ID"
                        iconSrc="student-id-number-icon.svg"
                    />
                  )}
                  {role === "Adviser" && (
                    <InputField
                        label="Adviser ID"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your adviser ID"
                        iconSrc="adviser-id-number-icon.svg"
                    />
                  )}
                  <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email or username"
                      iconSrc="email-icon.svg"
                  />
                  <InputField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      iconSrc="password-icon.svg"
                  />
                  <InputField
                      label="Confirm Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      iconSrc="password-icon.svg"
                  />
                </div>

                {/* Password Requirements */}
                <div className="mb-6">
                  <PasswordRequirement requirement="At least 8 characters" isMet={password.length >= 8} />
                  <PasswordRequirement requirement="Contains uppercase letter" isMet={/[A-Z]/.test(password)} />
                  <PasswordRequirement requirement="Contains lowercase letter" isMet={/[a-z]/.test(password)} />
                  <PasswordRequirement requirement="Contains number" isMet={/\d/.test(password)} />
                  <PasswordRequirement requirement="Contains special character" isMet={/[!@#$%^&*(),.?":{}|<>]/.test(password)} />
                </div>

                <PrimaryButton text="Sign Up" onClick={() => {}} />
            </div>
            )}

            {/* [LINK] Navigate to Sign Up */}
            <span className="flex justify-center gap-x-1 mt-4">
                <p className="label-caption">Already have an account?</p>
                <a href="/login" className="link block text-center hover:underline text-[var(--color-primary-600)]">Login</a>
            </span>
        </div>
    );
};

export default SignUp;