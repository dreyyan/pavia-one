const BrandPanel = () => {
  return (
    <div className="hidden lg:flex flex-1 bg-[var(--color-primary-700)] relative items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <img 
        src="/school.png" 
        className="absolute inset-0 w-full h-full object-cover opacity-15" 
        alt="School Background"
      />
      
      {/* Brand Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-12">
        <div className="mb-8 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <img src="/pavia-one-icon.svg" className="size-32" alt="PaviaOne Icon" />
        </div>
        
        <img src="/pavia-one-text-white.svg" className="w-80 mb-4" alt="PaviaOne" />
        
        <div className="h-1 w-16 bg-white/30 rounded-full mb-6"></div>
        
        <p className="text-[var(--color-text-50)] text-lg opacity-90 max-w-sm font-medium leading-relaxed tracking-wide">
          Your School's All-in-One <br/> Management Platform
        </p>
      </div>
      
      {/* Decorative Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-900)]/40 to-transparent"></div>
    </div>
  );
};

export default BrandPanel;