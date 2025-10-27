import { useEffect, useState } from "react";

import { scrollToSection } from "@/utils/scrollToSection";
import { Button } from "@first2apply/ui";
import Link from "next/link";
import { useRouter } from "next/router";

const menuItems = [
  { name: "Product", id: "product" },
  { name: "Pricing", id: "pricing" },
  { name: "Help", id: "help" },
  { name: "Changelog", id: "changelog", url: "/changelog" },
];

function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [lock]);
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const router = useRouter();

  useScrollLock(isOpen);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setHasScrolled(offset > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMenuItemClick = (id: string, onNavigate?: () => void) => {
    if (router.pathname === "/") {
      scrollToSection(id);
      if (onNavigate) {
        onNavigate();
      }
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <>
      {/* Mobile menu */}
      <nav
        className={`fixed left-0 right-0 top-0 z-[100] flex h-14 w-full items-center justify-between px-4 md:hidden ${
          hasScrolled && "dark:border-background border-b"
        } from-background to-background/60 dark:to-background/90 bg-gradient-to-b backdrop-blur-md backdrop-filter transition-all duration-100`}
      >
        <button className="flex items-center gap-3" onClick={() => handleMenuItemClick("product")}>
          <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            viewBox="150 150 472 452"
            preserveAspectRatio="xMidYMid meet"
            fill="currentColor"
          >
            <g transform="translate(0.000000,752.000000) scale(0.100000,-0.100000)" stroke="none">
              <path
                d="M5799 5751 c-520 -299 -4122 -2430 -4144 -2452 -24 -24 -28 -32 -19
-47 6 -9 24 -20 40 -23 16 -4 306 -7 644 -8 l615 -1 355 -744 c370 -777 372
-782 420 -756 18 9 727 1008 732 1031 2 7 -146 46 -402 105 -223 51 -406 94
-407 94 -2 0 -4 -207 -5 -459 l-3 -459 -293 615 c-241 505 -291 618 -280 628
60 55 2788 2483 2802 2495 21 16 22 17 -1272 -1605 -491 -616 -889 -1121 -885
-1122 54 -17 1637 -375 1660 -376 39 -1 85 29 96 64 9 27 438 3061 434 3066
-2 1 -41 -19 -88 -46z"
              />
            </g>
          </svg>
          <span className="text-lg font-medium">First 2 Apply</span>
        </button>

        {/* Burger menu */}
        <div
          className={`relative z-[99999] flex h-10 w-10 flex-col items-center justify-center focus-visible:outline-none md:hidden ${
            isOpen ? "gap-0.5" : "gap-2"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Line 1 */}
          <div
            className={`bg-foreground h-0.5 w-7 transform transition-all duration-300 ease-in-out ${
              isOpen && "translate-y-1 rotate-45"
            }`}
          ></div>

          {/* Line 2 */}
          <div
            className={`bg-foreground h-0.5 w-7 transform transition-all duration-300 ease-in-out ${
              isOpen && "translate-x-full opacity-0"
            }`}
          ></div>

          {/* Line 3 */}
          <div
            className={`bg-foreground h-0.5 w-7 transform transition-all duration-300 ease-in-out ${
              isOpen && "-translate-y-1 -rotate-45"
            }`}
          ></div>
        </div>

        <dialog
          className={`bg-background fixed top-0 z-[9999] flex h-screen w-full flex-col items-start gap-6 pl-12 pt-24 md:hidden ${
            !isOpen && "hidden"
          }`}
          open={isOpen}
        >
          {menuItems.map((item) =>
            item.url ? (
              <Link href={item.url} key={item.id} className="text-xl font-medium">
                {item.name}
              </Link>
            ) : (
              <button
                key={item.id}
                className="text-xl font-medium"
                onClick={() => handleMenuItemClick(item.id, () => setIsOpen(false))}
              >
                {item.name}
              </button>
            ),
          )}
          <Link href="/download" passHref>
            <Button className="-ml-3 -mt-2 h-10 px-3 text-xl">Download</Button>
          </Link>
        </dialog>
      </nav>

      {/* Desktop menu */}
      <nav
        className={`fixed z-[100] hidden h-16 w-full md:block ${
          hasScrolled && "dark:border-background border-b"
        } bg-background/60 dark:bg-background/90 backdrop-blur-md backdrop-filter transition-all duration-100`}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-10">
          <button className="flex items-center gap-3" onClick={() => handleMenuItemClick("product")}>
            <svg
              version="1.0"
              xmlns="http://www.w3.org/2000/svg"
              width="28px"
              height="28px"
              viewBox="150 150 472 452"
              preserveAspectRatio="xMidYMid meet"
              fill="currentColor"
            >
              <g transform="translate(0.000000,752.000000) scale(0.100000,-0.100000)" stroke="none">
                <path
                  d="M5799 5751 c-520 -299 -4122 -2430 -4144 -2452 -24 -24 -28 -32 -19
-47 6 -9 24 -20 40 -23 16 -4 306 -7 644 -8 l615 -1 355 -744 c370 -777 372
-782 420 -756 18 9 727 1008 732 1031 2 7 -146 46 -402 105 -223 51 -406 94
-407 94 -2 0 -4 -207 -5 -459 l-3 -459 -293 615 c-241 505 -291 618 -280 628
60 55 2788 2483 2802 2495 21 16 22 17 -1272 -1605 -491 -616 -889 -1121 -885
-1122 54 -17 1637 -375 1660 -376 39 -1 85 29 96 64 9 27 438 3061 434 3066
-2 1 -41 -19 -88 -46z"
                />
              </g>
            </svg>
            <span className="text-lg font-medium">First 2 Apply</span>
          </button>

          <div className="flex items-center gap-10">
            {menuItems.map((item) =>
              item.url ? (
                <Link
                  href={item.url}
                  key={item.id}
                  className="hover:text-primary after:bg-primary after:transition-width relative p-1 text-[17px] font-medium tracking-wide duration-200 after:absolute after:bottom-0 after:right-0 after:block after:h-0.5 after:w-0 after:transition-all after:content-[''] hover:after:w-full"
                >
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.id}
                  className="hover:text-primary after:bg-primary after:transition-width relative p-1 text-[17px] font-medium tracking-wide duration-200 after:absolute after:bottom-0 after:right-0 after:block after:h-0.5 after:w-0 after:transition-all after:content-[''] hover:after:w-full"
                  onClick={() => handleMenuItemClick(item.id)}
                >
                  {item.name}
                </button>
              ),
            )}
            <Link href="/download" passHref>
              <Button className="h-10 px-3">Download</Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
