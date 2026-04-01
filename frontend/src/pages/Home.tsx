import FeaturesCarousel from "../components/FeaturesCarousel";
import ImageHeader from "../components/ImageHeader";

export default function Home() {
  return (
    <main className="w-full">
      {/* [COMPONENT] Image Header */}
      <div>
        <ImageHeader />
      </div>

      {/* [SECTION] Features Carousel */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16 bg-[var(--color-bg-50)]">
        <div className="w-full max-w-[1200px] mx-auto">
          <FeaturesCarousel />
        </div>
      </section>
    </main>
  );
}