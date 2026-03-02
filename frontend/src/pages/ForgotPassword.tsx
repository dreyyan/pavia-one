import { useState } from "react";
import { Link } from "react-router-dom";

/* --- Shared Header Component --- */
const AuthHeader = () => (
  <div className="bg-[#004a99] text-white text-center py-10 relative min-h-[40vh] flex flex-col justify-center items-center">
    <div className="absolute inset-0 opacity-10 bg-[url('/school-bg.png')] bg-cover bg-center" />
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-16 h-16 bg-white/20 rounded-full mb-4 border border-white/30 flex items-center justify-center">
         <span className="text-2xl">🔑</span> 
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Pavia<span className="font-light">|</span>ONE</h1>
      <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-80 text-center max-w-[180px]">
        Password Recovery System
      </p>
    </div>
  </div>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // 1. Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // 2. Fake Logic for sending email
    console.log("Sending reset link to:", email);
    setIsSubmitted(true);
    setMessage("If an account exists for this email, you will receive a password reset link shortly.");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <AuthHeader />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-[400px] w-full">
          <div className="flex flex-col w-full">
            
            <h2 className="text-[#004a99] text-2xl font-bold mb-2 uppercase tracking-tight text-center w-full">
              Reset Password
            </h2>
            <p className="text-gray-400 text-[11px] text-center mb-8 px-4">
              Enter your email address and we'll send you a link to get back into your account.
            </p>

            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-2 rounded mb-4 border border-red-100 text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 text-green-600 text-[11px] p-3 rounded mb-4 border border-green-100 text-center">
                {message}
              </div>
            )}

            {!isSubmitted ? (
              <form onSubmit={handleReset} className="flex flex-col gap-4 w-full">
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="w-full h-12 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  type="submit"
                  className="w-full bg-[#004a99] text-white py-3.5 rounded-lg font-bold text-sm shadow-md hover:bg-[#003d7a] active:scale-[0.98] transition-all mt-2"
                >
                  SEND RESET LINK
                </button>
              </form>
            ) : (
              <Link
                to="/login"
                className="w-full bg-[#004a99] text-white py-3.5 rounded-lg font-bold text-sm shadow-md hover:bg-[#003d7a] text-center active:scale-[0.98] transition-all mt-2"
              >
                RETURN TO LOGIN
              </Link>
            )}

            <div className="mt-8 text-center">
              <Link to="/login" className="text-[#004a99] text-[11px] font-bold hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;