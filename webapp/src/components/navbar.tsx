"use client";

import { Icons } from "@/components/icons";
import { useAppState } from "@/hooks/appState";
import {
  HouseIcon,
  SearchIcon,
  CrosshairIcon,
  MessagesSquareIcon,
  SettingsIcon,
  CircleHelpIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { usePathname } from "next/navigation";

export function Navbar() {
  // Hook to get the current location
  const { theme, setTheme } = useTheme();
  const { isScanning, newUpdate } = useAppState();
  const pathname = usePathname();

  const hasUpdate = !!newUpdate;

  const navItems = [
    { name: "Jobs", path: "/", icon: <HouseIcon className="h-7 w-7" /> },
    {
      name: "Searches",
      path: "/links",
      icon: <SearchIcon className="h-7 w-7" />,
    },
    {
      name: "Filters",
      path: "/filters",
      icon: <CrosshairIcon className="h-7 w-7" />,
    },
    {
      name: "Feedback",
      path: "/feedback",
      icon: <MessagesSquareIcon className="h-7 w-7" />,
    },
    {
      name: "Settings",
      path: "/settings",

      icon: (
        <div className="relative">
          <SettingsIcon className="h-7 w-7" />
          {hasUpdate && (
            <div className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-destructive"></div>
          )}
        </div>
      ),
    },
    {
      name: "Help",
      path: "/help",
      icon: <CircleHelpIcon className="h-7 w-7" />,
    },
  ];

  const Logo = () =>
    isScanning ? (
      <RefreshCw className="h-7 w-7 animate-spin" />
    ) : (
      <Icons.logo className="h-7 w-7"></Icons.logo>
    );

  return (
    <nav className="fixed top-0 bg-background z-50 flex w-screen h-16 items-center justify-between border-b border-muted-foreground/20">
      <div className="flex items-center w-full px-6">
        <Link href={isScanning ? "/links" : "/"} className="">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger className="flex gap-3">
                <Logo />
                <span className="text-lg font-semibold">
                  {isScanning ? "Scanning ..." : "First 2 Apply"}
                </span>
              </TooltipTrigger>

              <TooltipContent side="right" className="text-base xl:hidden">
                {isScanning ? "Scanning for new jobs ..." : "First 2 Apply"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Link>

        <div className="ml-auto flex gap-2">
          {navItems.map((item) => (
            <TooltipProvider delayDuration={500} key={item.name}>
              <Tooltip>
                <TooltipTrigger>
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`after:transition-width relative flex items-center gap-3 p-1 duration-200 after:absolute after:bottom-0 after:right-0 after:block after:h-0.5 after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full ${
                      pathname === item.path && "text-primary"
                    }`}
                  >
                    {item.icon}
                    <span className="hidden text-lg 2xl:inline-block">
                      {item.name}
                    </span>
                  </Link>
                </TooltipTrigger>

                <TooltipContent side="bottom" className="text-base 2xl:hidden">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          {/* theme toggle */}
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-3 p-1 hover:text-primary"
                >
                  {theme === "dark" ? (
                    <SunIcon className="h-7 w-7" />
                  ) : (
                    <MoonIcon className="h-7 w-7" />
                  )}
                  <span className="hidden text-lg 2xl:inline-block">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              </TooltipTrigger>

              <TooltipContent side="right" className="text-base 2xl:hidden">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </nav>
  );
}
