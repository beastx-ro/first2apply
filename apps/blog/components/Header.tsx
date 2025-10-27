import headerNavLinks from '@/data/headerNavLinks';
import Logo from '@/data/logo.svg';
import siteMetadata from '@/data/siteMetadata';

import Link from './Link';
import MobileNav from './MobileNav';
import SearchButton from './SearchButton';
import ThemeSwitch from './ThemeSwitch';

const Header = () => {
  return (
    <header className="flex items-center justify-between py-10">
      <div>
        <Link href="/" aria-label={siteMetadata.headerTitle}>
          <div className="flex items-center justify-between">
            <div className="mr-3">
              <Logo className="h-6 w-6 dark:fill-white" />
            </div>
            {typeof siteMetadata.headerTitle === 'string' ? (
              <div className="hidden h-6 text-2xl font-semibold sm:block">{siteMetadata.headerTitle}</div>
            ) : (
              siteMetadata.headerTitle
            )}
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
        <a href="https://first2apply.com" className="hidden font-medium text-gray-900 sm:block dark:text-gray-100">
          Product
        </a>
        {headerNavLinks
          .filter((link) => link.href !== '/')
          .map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="hidden font-medium text-gray-900 sm:block dark:text-gray-100"
            >
              {link.title}
            </Link>
          ))}
        <SearchButton />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  );
};

export default Header;
