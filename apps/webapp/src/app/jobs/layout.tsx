import { SmallNavbar } from '../components/smallNavbar';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <section className="min-h-screen w-screen">
        <div className="mx-auto max-w-5xl">{children}</div>
        <SmallNavbar />
      </section>
    </>
  );
}
