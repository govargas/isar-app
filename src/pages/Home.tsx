import { IceMap } from '@/components/map/IceMap';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export function Home() {
  return (
    <div className="h-full pt-14">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Map */}
      <div className="h-full md:ml-80">
        <IceMap />
      </div>

      {/* Mobile bottom sheet */}
      <MobileNav />
    </div>
  );
}

