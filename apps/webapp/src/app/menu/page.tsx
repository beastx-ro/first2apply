import { listLinks, listSites } from '../actions';
import { WithClientProviders } from '../components/clientProviders';
import { MenuItems } from './Menu';

export default async function MenuPage() {
  const [sites, links] = await Promise.all([listSites(), listLinks()]);

  return (
    <WithClientProviders sites={sites} links={links}>
      <div className="flex h-screen flex-col items-center justify-start py-8">
        <h1 className="mb-10 text-4xl font-bold">Menu</h1>

        <MenuItems />
      </div>
    </WithClientProviders>
  );
}
