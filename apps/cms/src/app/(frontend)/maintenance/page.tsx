import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="relative flex flex-col items-center justify-center text-center">
      <Image
        src="/cdwr-cloud.png"
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-[0.06] dark:invert"
        aria-hidden
      />
      <h1 className="relative text-2xl font-bold">Under Maintenance</h1>
      <p className="relative mt-4 opacity-70">
        The system is temporarily down for maintenance and will be back shortly.
      </p>
    </div>
  );
}
