import Image from 'next/image';

import alert from '../../public/assets/alert.png';

export function AlertsSection() {
  return (
    <section
      id="alerts"
      className="mx-auto mt-[10vh] flex max-w-7xl flex-col items-center gap-4 px-6 sm:px-10 md:mt-[20vh] md:flex-row"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-balance text-2xl font-semibold sm:text-4xl md:text-left">
          Get ahead with real-time job notifications
        </h2>
        <p className="mt-2 text-balance sm:mt-4 sm:text-lg md:text-left">
          Set alerts your way - from as often as every 30 minutes to as spaced out as weekly. With First 2 Apply you can
          ensure your application is top of the pile, where recruiters look first.
        </p>
      </div>

      <Image src={alert} alt="alert" className="xs:mt-4 xs:px-5 mt-2 h-auto w-full px-3 md:w-1/2" />
    </section>
  );
}
