import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ImageHeader = () => {
    const navigate = useNavigate();

    // Preload images
    useEffect(() => {
        const images = ["/pavia-one-icon.svg", "/pavia-one-text-white.svg", "/school.png"];
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    return (
        <button onClick={() => navigate("/")} className="bg-[var(--color-primary-700)] cursor-pointer">
            <div className="relative flex flex-col justify-center items-center pt-6 pb-9">
                <img src="/pavia-one-icon.svg" className="size-30" />
                <img src="/pavia-one-text-white.svg" className="" />
                <img src="/school.png" className="absolute top-0 aspect-square" />
                <div className="px-13">
                    <h3 className="mt-4 text-[var(--color-text-50)] text-center">
                        Your School's All-in-One Management Platform
                    </h3>
                </div>
            </div>
        </button>
    );
};

export default ImageHeader;