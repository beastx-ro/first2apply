'use client';

import { ArchiveIcon, BanIcon, CheckCircleIcon, MenuIcon, SparklesIcon } from 'lucide-react';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SmallNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'New', path: '/jobs/list/new', icon: <SparklesIcon className="h-5 w-5" /> },
    { name: 'Applied', path: '/jobs/list/applied', icon: <CheckCircleIcon className="h-5 w-5" /> },
    { name: 'Archived', path: '/jobs/list/archived', icon: <ArchiveIcon className="h-5 w-5" /> },
    { name: 'Excluded', path: '/jobs/list/excluded_by_advanced_matching', icon: <BanIcon className="h-5 w-5" /> },
    { name: 'Menu', path: '/menu', icon: <MenuIcon className="h-5 w-5" /> },
  ];

  return (
    <nav className="h-16 w-screen">
      <div className="border-muted-foreground/20 bg-background fixed bottom-0 z-50 flex h-16 w-screen items-center justify-between gap-6 border-t px-2 py-6 md:p-10">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={clsx(
              'border-b-2 px-1 py-1',
              pathname === item.path ? 'text-primary border-primary' : 'border-transparent',
            )}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </nav>
  );
}
