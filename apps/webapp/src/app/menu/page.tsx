'use server';

import { listLinks, listSites } from '../actions';
import { WithClientProviders } from '../components/clientProviders';
import { MenuItems } from './Menu';

// This page reads session cookies through Supabase, so it cannot be
// statically rendered. Force dynamic rendering to avoid pre-render errors.
export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [sites, links] = await Promise.all([listSites(), listLinks()]);

  return (
    <div className="flex h-screen flex-col items-center justify-start py-8">
      <h1 className="mb-10 text-4xl font-bold">Menu</h1>

      <WithClientProviders sites={sites} links={links}>
        <MenuItems />
      </WithClientProviders>
    </div>
  );
}
