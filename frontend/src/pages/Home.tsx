// [IMPORT] Components
import FeaturesCarousel from "../components/FeaturesCarousel";
import ImageHeader from "../components/ImageHeader";
import BrandPanel from "../components/BrandPanel";
import Footer from "../components/Footer";

export default function Home() {
    return (
        /**
         * flex-col ensures the Split-Section and Footer stack vertically.
         * min-h-screen ensures the page at least fills the window.
         */
        <main className="flex flex-col min-h-screen w-full bg-white">
            
            {/* --- TOP SECTION: THE SPLIT SCREEN --- */}
            {/* 'flex-1' makes this section grow to fill all available space 
                above the footer. 
            */}
            <div className="flex flex-col lg:flex-row flex-1 w-full overflow-hidden">
                
                {/* LEFT SIDE: CONTENT */}
                <div className="flex flex-col w-full lg:w-[55%] min-h-[600px] lg:min-h-0">
                    {/* [MOBILE ONLY] */}
                    <div className="lg:hidden shrink-0">
                        <ImageHeader />
                    </div>

                    {/* CENTERED CONTENT */}
                    <div className="flex-1 flex flex-col justify-center items-center p-6 py-12 lg:p-24 xl:p-32 bg-[#F8F9FA] lg:bg-white">
                        <div className="w-full max-w-[480px] xl:max-w-[680px] 2xl:max-w-[850px]">
                            <FeaturesCarousel />
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: BRAND PANEL */}
                <div className="hidden lg:flex lg:w-[45%] bg-[var(--color-primary-700)] border-l border-gray-100 shadow-2xl">
                    <BrandPanel />
                </div>
            </div>

            {/* --- BOTTOM SECTION: FULL-WIDTH FOOTER --- */}
            {/* This now sits under BOTH the white and blue panels */}
            <div className="w-full shrink-0">
                <Footer />
            </div>
        </main>
    );
}