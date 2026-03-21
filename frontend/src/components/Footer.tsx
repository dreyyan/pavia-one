const Footer = () => {
    return (
        <footer className="flex flex-col py-4 px-3 justify-center items-center gap-y-1 bg-[var(--color-primary-700)]">
            <div className="pb-2">
                <img src="/pavia-one-footer-banner.svg" className="" />
            </div>
            <p className="font-roboto text-xs text-[var(--color-text-100)]">© 2026 PaviaOne. All rights reserved.</p>
            <span className="flex gap-x-1">
                <p className="font-roboto text-xs text-[var(--color-text-100)]">Need help? Contact</p>
                <a href="" className="font-roboto text-xs text-[var(--color-text-50)] underline">pnhspaviaone@gmail.com</a>
            </span>
        </footer>
    );
};

export default Footer;