import { useState } from "react";
import { Link } from "react-router-dom";

/* --- Shared Header Component --- */
const AuthHeader = () => (
  <div className="bg-[#004a99] text-white text-center py-10 relative min-h-[40vh] flex flex-col justify-center items-center">
    <div className="absolute inset-0 opacity-10 bg-[url('/school-bg.png')] bg-cover bg-center" />
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-16 h-16 bg-white/20 rounded-full mb-4 border border-white/30 flex items-center justify-center">
         <span className="text-2xl">🔥</span> 
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Pavia<span className="font-light">|</span>ONE</h1>
      <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-80 text-center max-w-[180px]">
        Your School’s All-in-One Management Platform
      </p>
    </div>
  </div>
);

const SignUp = () => {
  const [role, setRole] = useState<"student" | "adviser" | null>(null);
  const [lrn, setLrn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword || !role) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (password.length < 6 || !/\d/.test(password)) {
      setError("Password must be at least 6 characters and contain a number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Registering:", { email, password, role });
    alert(`Account created successfully as ${role}!`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <AuthHeader />

      <div className="flex-1 flex flex-col p-8 max-w-[400px] mx-auto w-full">
        
        {!role ? (
          /* --- STEP 1: ROLE SELECTION --- */
          <div className="flex flex-col items-center">
            <h2 className="text-[#004a99] font-bold text-lg mb-8 text-center w-full">Sign up as:</h2>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => setRole("student")}
                className="bg-[#004a99] aspect-square rounded-xl flex flex-col items-center justify-center text-white transition-all active:scale-95 shadow-md"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full mb-3 flex items-center justify-center text-3xl">🎓</div>
                <span className="font-semibold text-sm">Student</span>
              </button>

              <button 
                onClick={() => setRole("adviser")}
                className="bg-[#004a99] aspect-square rounded-xl flex flex-col items-center justify-center text-white transition-all active:scale-95 shadow-md"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full mb-3 flex items-center justify-center text-3xl">👤</div>
                <span className="font-semibold text-sm">Adviser</span>
              </button>
            </div>
            <p className="mt-12 text-[11px] text-gray-500">
              Already have an account? <Link to="/login" className="text-[#004a99] font-bold hover:underline">Log In</Link>
            </p>
          </div>
        ) : (
          /* --- STEP 2: SIGNUP FORM --- */
          <div className="flex flex-col w-full">
            <h2 className="text-[#004a99] text-2xl font-bold mb-6 uppercase tracking-tight text-center w-full">Create Account</h2>

            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-2 rounded mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="flex flex-col gap-4 w-full">
              {role === "student" && (
                <input
                type="text"
                placeholder="Learner Reference Number (LRN)"
                className="w-full h-12 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                value={lrn}
                onChange={(e) => setLrn(e.target.value)}
              />
              )}
              {/* Email Input */}
              <input
                type="text"
                placeholder="Email Address"
                className="w-full h-12 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password Group */}
              <div className="flex gap-2 h-12 w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="flex-grow min-w-0 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-[70px] shrink-0 border-[1px] border-gray-200 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-400 hover:text-[#004a99] hover:bg-white uppercase transition-all select-none flex items-center justify-center box-border"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Confirm Password Group */}
              <div className="flex gap-2 h-12 w-full">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="flex-grow min-w-0 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="w-[70px] shrink-0 border-[1px] border-gray-200 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-400 hover:text-[#004a99] hover:bg-white uppercase transition-all select-none flex items-center justify-center box-border"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#004a99] text-white py-3.5 rounded-lg font-bold text-sm shadow-md hover:bg-[#003d7a] active:scale-[0.98] transition-all mt-2"
              >
                SIGN UP
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-400 mt-8">
              Already have an account? <Link to="/login" className="text-[#004a99] font-bold hover:underline">Log In</Link>
            </p>

            <button 
              onClick={() => setRole(null)}
              className="mt-12 mx-auto text-[#004a99] text-4xl font-light hover:scale-110 transition-transform flex items-center justify-center"
            >
              ←
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;