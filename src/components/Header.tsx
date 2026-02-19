import { useState } from "react";

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <header className="flex justify-between px-6 py-4 border">
            { isLoggedIn && 
            <button className="size-8">
                <img src="/burger-menu-icon.svg" alt="Burger Menu Icon"/>
            </button>
            }
            <img src="/pavia-one-banner.svg" className="" />
        </header>
    );
};

export default Header;