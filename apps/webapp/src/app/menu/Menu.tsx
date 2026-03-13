'use client';

import { LogOutIcon, MoonIcon, SunIcon } from 'lucide-react';

import { Separator, useError } from '@first2apply/ui';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { signOut } from '../actions';

export function MenuItems() {
  const { theme, setTheme } = useTheme();
  const { handleError } = useError();

  const onLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error;
      }
      handleError({ error, title: 'Failed to logout' });
    }
  };

  return (
    <ul className="flex w-screen flex-col items-start justify-start gap-6 text-2xl">
      <li className="px-6">
        <Link
          href="#"
          onClick={(evt) => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            evt.preventDefault();
          }}
          className="flex items-center justify-center"
        >
          {theme === 'dark' ? <SunIcon className="h-7 w-7" /> : <MoonIcon className="h-7 w-7" />}
          <span className="ml-4">Turn the lights {theme === 'dark' ? 'on' : 'off'}</span>
        </Link>
      </li>
      <Separator />

      <li className="px-6">
        <Link
          href="#"
          onClick={(evt) => {
            onLogout();
            evt.preventDefault();
          }}
          className="flex items-center justify-center"
        >
          <LogOutIcon className="h-7 w-7" />
          <span className="ml-4">Logout</span>
        </Link>
      </li>
    </ul>
  );
}
