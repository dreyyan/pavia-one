import FeaturesCarousel from "../components/hero_section/FeaturesCarousel";
import ImageHeader from "../components/authentication/ImageHeader";

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col">
      {/* Image Header */}
      <div className="flex-shrink-0">
        <ImageHeader />
      </div>

      {/* Features Carousel */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16 bg-[var(--color-bg-50)]">
        <div className="w-full max-w-[1200px] mx-auto h-full">
          <FeaturesCarousel />
        </div>
      </section>
    </main>
  );
}