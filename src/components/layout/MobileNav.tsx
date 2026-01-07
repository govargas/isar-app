import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFilteredLakes } from '@/stores/iceStore';
import { LakeCardCompact } from '@/components/ui/LakeCard';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const filteredLakes = useFilteredLakes();

  // Don't show on lake detail pages
  if (location.pathname.startsWith('/lake/')) {
    return null;
  }

  return (
    <>
      {/* Bottom sheet trigger */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full glass border-t border-[var(--color-frost-dim)]/10 p-4"
        >
          <div className="w-12 h-1 bg-[var(--color-frost-dim)]/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-frost-white)]">
              {filteredLakes.length} Lakes
            </span>
            <span className="text-xs text-[var(--color-frost-muted)]">
              Tap to view list
            </span>
          </div>
        </button>
      </div>

      {/* Bottom sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up">
            <div className="bg-[var(--color-bg-surface)] rounded-t-2xl max-h-[70vh] flex flex-col">
              {/* Handle */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 flex justify-center"
              >
                <div className="w-12 h-1 bg-[var(--color-frost-dim)]/30 rounded-full" />
              </button>

              {/* Header */}
              <div className="px-4 pb-3 border-b border-[var(--color-frost-dim)]/10">
                <h2 className="text-lg font-semibold text-[var(--color-frost-white)]">
                  Ice Conditions
                </h2>
                <p className="text-xs text-[var(--color-frost-muted)]">
                  {filteredLakes.length} lakes in Stockholm area
                </p>
              </div>

              {/* Lake list */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredLakes.map((lake) => (
                  <LakeCardCompact
                    key={lake.id}
                    lake={lake}
                    onHover={() => setIsOpen(false)}
                  />
                ))}
              </div>

              {/* Quick nav */}
              <div className="p-4 border-t border-[var(--color-frost-dim)]/10 flex gap-2">
                <Link
                  to="/"
                  className="flex-1 py-2 rounded-lg text-center text-sm font-medium
                    bg-[var(--color-ice-primary)]/10 text-[var(--color-ice-primary)]"
                  onClick={() => setIsOpen(false)}
                >
                  Map View
                </Link>
                <Link
                  to="/auth"
                  className="flex-1 py-2 rounded-lg text-center text-sm font-medium
                    border border-[var(--color-frost-dim)]/30 text-[var(--color-frost-muted)]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

