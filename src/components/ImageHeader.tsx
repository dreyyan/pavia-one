const ImageHeader = () => {
    return (
        <div className="bg-[var(--color-primary-700)]">
            <div className="flex flex-col justify-center items-center pt-6 pb-9">
                <img src="/pavia-one-icon.svg" className="size-30" />
                <img src="/pavia-one-text-white.svg" className="" />
                <img src="/school.png" className="absolute aspect-square" />
                <div className="px-13">
                    <h3 className="mt-4 text-[var(--color-text-50)] text-center">Your School's All-in-One Management Platform</h3>
                </div>
            </div>
        </div>
    );
};

export default ImageHeader;