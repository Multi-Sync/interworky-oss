// Static skeleton for hero section - renders immediately on server
export default function HeroSkeleton() {
  return (
    <div className="text-white bg-black">
      {/* Navbar skeleton */}
      <nav className="w-full px-5 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="h-8 w-32 hero-skeleton rounded" />
          <div className="hidden md:flex gap-4">
            <div className="h-8 w-20 hero-skeleton rounded" />
            <div className="h-8 w-20 hero-skeleton rounded" />
            <div className="h-8 w-20 hero-skeleton rounded" />
          </div>
          <div className="h-10 w-28 hero-skeleton rounded-full" />
        </div>
      </nav>

      {/* Hero content skeleton */}
      <section className="relative overflow-hidden">
        <div className="lg:max-w-7xl sm:px-10 md:px-12 lg:px-5 relative w-full px-5 mx-auto">
          <div className="lg:grid-cols-5 grid items-center grid-cols-1 gap-8">
            {/* Left column */}
            <div className="lg:text-left lg:col-span-3 text-center relative z-10 py-12">
              {/* Platform badges */}
              <div className="mb-4 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="h-8 w-24 hero-skeleton rounded-full" />
                <div className="h-8 w-20 hero-skeleton rounded-full" />
                <div className="h-8 w-24 hero-skeleton rounded-full" />
              </div>

              {/* Title */}
              <div className="h-16 w-64 hero-skeleton rounded mb-4 mx-auto lg:mx-0" />
              <div className="h-10 w-80 hero-skeleton rounded mb-4 mx-auto lg:mx-0" />

              {/* Description */}
              <div className="space-y-2 max-w-xl mx-auto lg:mx-0">
                <div className="h-4 w-full hero-skeleton rounded" />
                <div className="h-4 w-5/6 hero-skeleton rounded" />
                <div className="h-4 w-4/6 hero-skeleton rounded" />
              </div>

              {/* Feature badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="h-8 w-36 hero-skeleton rounded-full" />
                <div className="h-8 w-32 hero-skeleton rounded-full" />
                <div className="h-8 w-36 hero-skeleton rounded-full" />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-6">
                <div className="h-12 w-40 hero-skeleton rounded-full" />
                <div className="h-12 w-44 hero-skeleton rounded-full" />
              </div>
            </div>

            {/* Right column - carousel skeleton */}
            <div className="relative z-0 my-6 md:my-12 lg:my-16 flex items-center justify-center h-[260px] md:h-[420px] lg:h-[480px] lg:col-span-2">
              <div className="relative w-full max-w-md h-full">
                <div className="hero-skeleton rounded-[20px] w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
