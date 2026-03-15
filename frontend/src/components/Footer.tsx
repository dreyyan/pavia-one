const Footer = () => {
    return (
        <footer className="flex flex-col py-4 px-3 justify-center items-center gap-y-1 bg-[var(--color-primary-700)]">
            {/* <img src="/pavia-one-banner-white.svg" className="" /> */}
            <p className="font-roboto text-xs text-white">© 2026 PaviaOne. All rights reserved.</p>
            <span className="flex gap-x-1">
                <p className="font-roboto text-xs text-white">Need help? Contact</p>
                <a href="" className="font-roboto text-xs text-white underline">support@paviaone.ph</a>
            </span>

            {/* Social Links */}
            {/* <div className="flex [&>span]:flex [&>span]:items-center [&>span]:gap-x-2 [&>span>img]:size-6 [&>span>a]:text-xs [&>span>a]:underline">
                <span>
                    <img src="/facebook-icon.svg" />
                    <a href="" className="font-roboto text-xs text-white underline">facebook.com/pavianhs</a>
                </span>

                <span>
                    <img src="/email-icon.svg" />
                    <a href="" className="font-roboto text-xs text-white underline">facebook.com/pavianhs</a>
                </span>
            </div> */}
        </footer>
    );
};

export default Footer;