import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <header className="flex justify-between items-center px-6 py-4 bg-[var(--color-primary-700)]">
            { isLoggedIn && 
            <button className="size-8 cursor-pointer">
                <img src="/burger-menu-icon.svg" alt="Burger Menu Icon"/>
            </button>
            }
            <button onClick={() => navigate("/")} className="cursor-pointer">
                <img src="/pavia-one-banner-white.svg" className="h-7" />
            </button>
        </header>
    );
};

export default Header;