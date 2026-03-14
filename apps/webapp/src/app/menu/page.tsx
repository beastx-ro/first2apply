import { MenuItems } from './Menu';

export default async function MenuPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-start py-8">
      <h1 className="mb-10 text-4xl font-bold">Menu</h1>

      <MenuItems />
    </div>
  );
}

export const dynamic = 'force-dynamic';
