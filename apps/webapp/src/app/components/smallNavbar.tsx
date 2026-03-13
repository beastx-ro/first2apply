'use client';

import { ArchiveIcon, BanIcon, CheckCircleIcon, MenuIcon, SparklesIcon } from 'lucide-react';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SmallNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'New', path: '/jobs/list/new', Icon: SparklesIcon },
    { name: 'Applied', path: '/jobs/list/applied', Icon: CheckCircleIcon },
    { name: 'Archived', path: '/jobs/list/archived', Icon: ArchiveIcon },
    { name: 'Excluded', path: '/jobs/list/excluded_by_advanced_matching', Icon: BanIcon },
    { name: 'Menu', path: '/menu', Icon: MenuIcon },
  ];

  return (
    <nav className="h-16 w-screen">
      <div className="border-muted-foreground/20 bg-background fixed bottom-0 z-50 flex h-16 w-screen border-t">
        {navItems.map(({ name, path, Icon }) => (
          <Link key={name} href={path} className="flex h-full flex-1 items-center justify-center">
            <div
              className={clsx(
                'border-b-2 p-1',
                pathname === path ? 'text-primary border-primary' : 'border-transparent',
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
