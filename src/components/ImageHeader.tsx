const ImageHeader = () => {
    return (
        <div className="bg-blue-500">
            <div className="flex flex-col justify-center items-center pt-6 pb-9 px-8">
                <img src="/pavia-one-icon.svg" className="size-30" />
                <img src="/pavia-one-text-white.svg" className="" />
                <img src="/school.png" className="fixed aspect-square" />
                <p className="text-white text-center">Your School's All-in-One Management Platform</p>
            </div>
        </div>
    );
};

export default ImageHeader;