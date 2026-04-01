const Footer = () => {
  return (
    <footer className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-between items-center gap-y-2 sm:gap-y-0 py-4 px-4 sm:px-8 bg-[var(--color-primary-700)] text-center sm:text-left">
      
      {/* Banner */}
      <div className="flex-shrink-0 mb-2 sm:mb-0">
        <img
          src="/pavia-one-footer-banner.svg"
          alt="PaviaOne Banner"
          className="h-8 sm:h-10 w-auto"
        />
      </div>

      {/* Copyright */}
      <p className="font-roboto text-[10px] sm:text-xs text-[var(--color-text-100)] mx-2">
        © 2026 PaviaOne. All rights reserved.
      </p>

      {/* Contact */}
      <span className="flex flex-row items-center gap-x-1">
        <p className="font-roboto text-[10px] sm:text-xs text-[var(--color-text-100)] m-0">
          Need help? Contact
        </p>
        <a
          href="mailto:pnhspaviaone@gmail.com"
          className="font-roboto text-[10px] sm:text-xs text-[var(--color-text-50)] underline"
        >
          pnhspaviaone@gmail.com
        </a>
      </span>
    </footer>
  );
};

export default Footer;