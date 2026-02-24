import { useState } from "react";

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    return (
        <header className="flex justify-between items-center px-6 py-4">
            { isLoggedIn && 
            <button className="size-8">
                <img src="/burger-menu-icon.svg" alt="Burger Menu Icon"/>
            </button>
            }
            <img src="/pavia-one-banner.svg" className="h-7" />
        </header>
    );
};

export default Header;