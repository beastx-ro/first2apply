import Image from "next/image";
import alert from "../../public/assets/alert.png";

export function AlertsSection() {
  return (
    <section
      id="alerts"
      className="flex flex-col items-center gap-4 mt-[10vh] md:mt-[20vh] md:flex-row-reverse max-w-7xl mx-auto px-6 sm:px-10"
    >
      <Image src={alert} alt="alert" className="w-full h-auto md:w-1/2" />
      <div className="w-full md:w-1/2">
        <h2 className="text-2xl sm:text-4xl font-semibold text-balance md:text-left">
          Get ahead with real-time job notifications
        </h2>
        <p className="mt-2 sm:mt-4 text-balance md:text-left sm:text-lg">
          Set alerts your way - from as often as every 30 minutes to as spaced
          out as weekly. With First 2 Apply you can ensure your application is
          top of the pile, where recruiters look first.
        </p>
      </div>
    </section>
  );
}
