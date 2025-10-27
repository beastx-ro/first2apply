import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl dark:text-gray-100">
      {children}
    </h1>
  );
}
