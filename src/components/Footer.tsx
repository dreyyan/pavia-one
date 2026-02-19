const Footer = () => {
    return (
        <footer className="flex flex-col py-4 px-3 justify-center items-center gap-y-2 border">
            <img src="/pavia-one-banner.svg" className="" />
            <p className="text-xs">© 2026 PaviaOne. All rights reserved.</p>
            <p className="text-xs">Need help? Contact support@paviaone.ph</p>

            {/* Social Links */}
            <div className="flex [&>span]:flex [&>span]:items-center gap-x-3 [&>span]:gap-x-2 [&>span>img]:size-6 [&>span>a]:text-xs [&>span>a]:underline">
                <span>
                    <img src="/facebook-icon.svg" />
                    <a>facebook.com/pavianhs</a>
                </span>

                <span>
                    <img src="/email-icon.svg" />
                    <a>facebook.com/pavianhs</a>
                </span>
            </div>
        </footer>
    );
};

export default Footer;