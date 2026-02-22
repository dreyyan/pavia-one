import FeaturesCarousel from "../components/FeaturesCarousel";
import ImageHeader from "../components/ImageHeader";

export default function Home() {

    return (
        <main className="">
            <section className="space-y-6">
                <div className="">
                    {/* Image Header */}
                    <div>
                        <ImageHeader />
                    </div>
                    {/* Features Carousel */}
                    <div>
                        <FeaturesCarousel />
                    </div>
                </div>
            </section>
        </main>
    );
}