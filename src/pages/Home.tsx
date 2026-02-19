import ImageHeader from "../components/ImageHeader";

export default function Home() {

    return (
        <main className="">
            <section className="space-y-6">
                <div className="">
                    {/* Image Header */}
                    <ImageHeader />
                    {/* Hero Image */}
                    <div>
                        <img src="/hero-image-placeholder.png" className="" />
                    </div>

                    {/* Features Carousel */}
                    <div>

                    </div>
                </div>
            </section>
        </main>
    );
}