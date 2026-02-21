import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/* --- Shared Header Component --- */
const AuthHeader = () => (
  <div className="bg-[#004a99] text-white text-center py-10 relative min-h-[40vh] flex flex-col justify-center items-center">
    {/* Background Overlay */}
    <div className="absolute inset-0 opacity-10 bg-[url('/school-bg.png')] bg-cover bg-center" />
    
    <div className="relative z-10 flex flex-col items-center">
      {/* Logo Placeholder */}
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

const Login = () => {
  const [role, setRole] = useState<"student" | "adviser" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // When the page loads, check if an email was saved
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []); // Empty array means this runs only once on mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Check for empty fields
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // 2. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 254 || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // 3. Password length check
    if (password.length < 4) {
      setError("Password is too short.");
      return;
    }

    // Fake login check
    if (email === "admin@example.com" && password === "1234") {
      // HANDLE REMEMBER ME LOGIC ON SUCCESS
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      alert(`Login successful as ${role}!`);
      setError("");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <AuthHeader />

      <div className="flex-1 flex flex-col p-8 max-w-[400px] mx-auto w-full">
        
        {/* --- STEP 1: ROLE SELECTION --- */}
        {!role ? (
          <div className="flex flex-col items-center">
            <h2 className="text-[#004a99] font-bold text-lg mb-8 text-center w-full">Login as:</h2>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Student Selection */}
              <button 
                onClick={() => setRole("student")}
                className="bg-[#004a99] aspect-square rounded-xl flex flex-col items-center justify-center text-white transition-all active:scale-95 hover:bg-[#003d7a] shadow-md"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full mb-3 flex items-center justify-center text-3xl">🎓</div>
                <span className="font-semibold text-sm">Student</span>
              </button>

              {/* Adviser Selection */}
              <button 
                onClick={() => setRole("adviser")}
                className="bg-[#004a99] aspect-square rounded-xl flex flex-col items-center justify-center text-white transition-all active:scale-95 hover:bg-[#003d7a] shadow-md"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full mb-3 flex items-center justify-center text-3xl">👤</div>
                <span className="font-semibold text-sm">Adviser</span>
              </button>
            </div>

            <p className="mt-12 text-[11px] text-gray-500">
              Don't have an account? <Link to="/signup" className="text-[#004a99] font-bold hover:underline">Sign Up</Link>
            </p>
          </div>
        ) : (
          
          /* --- STEP 2: LOGIN FORM --- */
          <div className="flex flex-col w-full">

            <h2 className="text-[#004a99] text-2xl font-bold mb-6 uppercase tracking-tight text-center w-full">Login</h2>

            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-2 rounded mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
              {/* Email Input */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Email or username"
                  className="w-full h-12 px-4 border-[1px] border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-[#004a99] transition-all box-border"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Group - Matches Email width exactly */}
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

              <div className="flex items-center justify-between text-[11px] text-gray-400 py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-3 h-3 rounded-sm border-gray-300 accent-[#004a99]" />
                  Remember Me
                </label>
                <Link to="/forgot" className="text-[#004a99] font-medium hover:underline">Forgot Password?</Link>
              </div>

              <button
                type="submit"
                className="w-full bg-[#004a99] text-white py-3.5 rounded-lg font-bold text-sm shadow-md hover:bg-[#003d7a] active:scale-[0.98] transition-all mt-2"
              >
                LOGIN
              </button>
            </form>

            <p className="text-center text-[11px] text-gray-400 mt-8">
              Don't have an account? <Link to="/signup" className="text-[#004a99] font-bold hover:underline">Sign Up</Link>
            </p>

            <button 
              onClick={() => setRole(null)}
              className="mt-20 mx-auto text-[#004a99] text-4xl font-light hover:scale-110 transition-transform flex items-center justify-center"
            >
              ←
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default Login;