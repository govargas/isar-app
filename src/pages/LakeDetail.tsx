import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { getLakeBySlug, getLakeReports, getUserReports } from '@/lib/supabase';
import { isMockMode, getMockLakeBySlug, getMockLakeReports, getMockUserReports } from '@/lib/mockData';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReportForm } from '@/components/ui/ReportForm';
import { UserReportCard } from '@/components/ui/UserReportCard';
import { SURFACE_CONDITIONS, STATUS_CONFIG } from '@/lib/constants';
import type { LakeWithStatus, IceReport, UserReport } from '@/types';
import { isReportExpired } from '@/types';
import { supabase } from '@/lib/supabase';

export function LakeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [lake, setLake] = useState<LakeWithStatus | null>(null);
  const [reports, setReports] = useState<IceReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      setLoading(true);
      
      // Use mock data if Supabase is not configured
      if (isMockMode()) {
        const mockLake = getMockLakeBySlug(slug);
        if (mockLake) {
          setLake(mockLake);
          setReports(getMockLakeReports(mockLake.id) as IceReport[]);
          setUserReports(getMockUserReports(mockLake.id) as UserReport[]);
        }
        setLoading(false);
        return;
      }

      // First fetch the lake by slug
      const lakeData = await getLakeBySlug(slug);

      // If we have lake data, fetch reports using lake ID
      if (lakeData) {
        setLake(lakeData);
        const [officialReports, communityReports] = await Promise.all([
          getLakeReports(lakeData.id),
          getUserReports(lakeData.id),
        ]);
        setReports(officialReports);
        setUserReports(communityReports);
      }
      setLoading(false);
    }

    fetchData();

    // Check auth status (only if not in mock mode)
    if (!isMockMode()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--color-ice-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lake) {
    return (
      <div className="min-h-screen pt-14 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold text-[var(--color-frost-white)]">
          Lake not found
        </h1>
        <Link
          to="/"
          className="text-[var(--color-ice-primary)] hover:underline"
        >
          ← Back to map
        </Link>
      </div>
    );
  }

  const statusConfig = lake.status ? STATUS_CONFIG[lake.status] : null;

  return (
    <div className="min-h-screen pt-14 pb-20">
      {/* Hero section */}
      <div
        className="relative h-48 md:h-64 overflow-hidden"
        style={{
          background: statusConfig
            ? `linear-gradient(135deg, ${statusConfig.bgColor}, var(--color-bg-deep))`
            : 'var(--color-bg-deep)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-deep)] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)] mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to map
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-frost-white)]">
                {lake.name}
              </h1>
              {lake.region && (
                <p className="text-[var(--color-frost-muted)] mt-1">{lake.region}</p>
              )}
            </div>
            <StatusChip status={lake.status} size="lg" swedish />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Data cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard
            label="Ice Thickness"
            value={lake.ice_thickness_cm ? `${lake.ice_thickness_cm} cm` : '—'}
            icon="❄️"
          />
          <DataCard
            label="Surface"
            value={
              lake.surface_condition
                ? SURFACE_CONDITIONS[lake.surface_condition]?.label || lake.surface_condition
                : '—'
            }
            icon="🏂"
          />
          <DataCard
            label="Last Updated"
            value={
              lake.last_updated
                ? formatDistanceToNow(new Date(lake.last_updated), { addSuffix: true })
                : '—'
            }
            icon="🕐"
          />
          <DataCard
            label="Reports"
            value={`${lake.recent_report_count} active`}
            icon="📝"
          />
        </div>

        {/* Official reports history */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-frost-white)] mb-3">
            Official Updates
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-[var(--color-frost-muted)]">
              No official updates available
            </p>
          ) : (
            <div className="space-y-2">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-frost-dim)]/10"
                >
                  <div className="flex items-center justify-between">
                    <StatusChip status={report.status} size="sm" />
                    <span className="text-xs text-[var(--color-frost-muted)]">
                      {format(new Date(report.scraped_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  {report.raw_text && (
                    <p className="text-sm text-[var(--color-frost-muted)] mt-2 line-clamp-2">
                      {report.raw_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Community reports */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-frost-white)]">
                Community Reports
              </h2>
              <p className="text-xs text-[var(--color-frost-muted)] mt-0.5">
                Recent observations from skaters
              </p>
            </div>
            {isAuthenticated && !showReportForm && (
              <button
                onClick={() => setShowReportForm(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-[var(--color-ice-primary)] text-[var(--color-bg-deep)]
                  hover:bg-[var(--color-ice-glow)] transition-all"
              >
                + Add Report
              </button>
            )}
          </div>

          {showReportForm && (
            <div className="mb-4 p-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-frost-dim)]/10">
              <ReportForm
                lakeId={lake.id}
                lakeName={lake.name}
                onSuccess={() => {
                  setShowReportForm(false);
                  // Refetch user reports
                  getUserReports(lake.id).then(setUserReports);
                }}
                onCancel={() => setShowReportForm(false)}
              />
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-sm text-[var(--color-frost-muted)] mb-3">
              <Link to="/auth" className="text-[var(--color-ice-primary)] hover:underline">
                Sign in
              </Link>{' '}
              to submit a report
            </p>
          )}

          {userReports.length === 0 ? (
            <p className="text-sm text-[var(--color-frost-muted)]">
              No community reports yet. Be the first to share!
            </p>
          ) : (
            <>
              {/* Active (non-expired) reports */}
              {(() => {
                const activeReports = userReports.filter(r => !isReportExpired(r));
                const expiredReports = userReports.filter(r => isReportExpired(r));
                
                return (
                  <>
                    {activeReports.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {activeReports.map((report) => (
                          <UserReportCard key={report.id} report={report} />
                        ))}
                      </div>
                    )}
                    
                    {/* Expired reports section */}
                    {expiredReports.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-[var(--color-frost-dim)]/20" />
                          <span className="text-xs text-[var(--color-frost-dim)] px-2">
                            Older reports (for reference)
                          </span>
                          <div className="h-px flex-1 bg-[var(--color-frost-dim)]/20" />
                        </div>
                        <div className="space-y-2">
                          {expiredReports.map((report) => (
                            <UserReportCard key={report.id} report={report} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {activeReports.length === 0 && expiredReports.length > 0 && (
                      <p className="text-sm text-[var(--color-frost-muted)] mb-3">
                        No recent reports. Older reports shown below for reference.
                      </p>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function DataCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-frost-dim)]/10">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-[var(--color-frost-muted)]">{label}</span>
      </div>
      <p className="text-sm font-medium text-[var(--color-frost-white)] font-mono">
        {value}
      </p>
    </div>
  );
}

