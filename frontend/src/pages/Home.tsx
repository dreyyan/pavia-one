import FeaturesCarousel from "../components/FeaturesCarousel";
import ImageHeader from "../components/ImageHeader";

export default function Home() {

    return (
        <main className="">
            {/* Image Header */}
            <div>
                <ImageHeader />
            </div>
            
            {/* Features Carousel */}
            <div className="px-6 py-10 bg-[var(--color-bg-50)]">
                <FeaturesCarousel />
            </div>
        </main>
    );
}