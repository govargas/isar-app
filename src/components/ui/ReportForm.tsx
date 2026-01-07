import { useState } from 'react';
import { createUserReport, supabase } from '@/lib/supabase';
import { StatusFilterChip } from './StatusChip';
import type { IceStatus, SurfaceCondition } from '@/types';
import { toast } from 'sonner';

const ALL_STATUSES: IceStatus[] = ['safe', 'uncertain', 'warning', 'no_ice'];

const SURFACE_OPTIONS: { value: SurfaceCondition; label: string }[] = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'rough', label: 'Rough' },
  { value: 'snow_covered', label: 'Snow Covered' },
  { value: 'plogad', label: 'Plowed' },
];

interface ReportFormProps {
  lakeId: string;
  lakeName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReportForm({ lakeId, lakeName, onSuccess, onCancel }: ReportFormProps) {
  const [status, setStatus] = useState<IceStatus | null>(null);
  const [surfaceCondition, setSurfaceCondition] = useState<SurfaceCondition | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      toast.error('Please select an ice status');
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to submit a report');
        return;
      }

      const report = await createUserReport({
        lake_id: lakeId,
        user_id: user.id,
        status,
        surface_condition: surfaceCondition,
        comment: comment.trim() || null,
        location: null,
        photo_url: null,
        reported_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      if (report) {
        toast.success('Report submitted!', {
          description: `Your report for ${lakeName} has been added.`,
        });
        onSuccess?.();
      } else {
        toast.error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-frost-white)] mb-2">
          Ice Status *
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <StatusFilterChip
              key={s}
              status={s}
              active={status === s}
              onClick={() => setStatus(s)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-frost-white)] mb-2">
          Surface Condition
        </label>
        <div className="flex flex-wrap gap-2">
          {SURFACE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setSurfaceCondition(
                  surfaceCondition === option.value ? null : option.value
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                surfaceCondition === option.value
                  ? 'bg-[var(--color-ice-primary)]/20 text-[var(--color-ice-primary)] border-[var(--color-ice-primary)]/30'
                  : 'border-[var(--color-frost-dim)]/30 text-[var(--color-frost-muted)] hover:border-[var(--color-frost-dim)]/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-[var(--color-frost-white)] mb-2"
        >
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="E.g., 'Skated here 1 hour ago - great conditions near the eastern shore'"
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-deep)] 
            border border-[var(--color-frost-dim)]/20 text-[var(--color-frost-white)]
            placeholder:text-[var(--color-frost-dim)] focus:outline-none 
            focus:border-[var(--color-ice-primary)]/50 focus:ring-1 focus:ring-[var(--color-ice-primary)]/20
            transition-all resize-none"
        />
        <p className="mt-1 text-xs text-[var(--color-frost-dim)]">
          {comment.length}/500 characters
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
              text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)]
              border border-[var(--color-frost-dim)]/30 hover:border-[var(--color-frost-dim)]/50
              transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!status || submitting}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
            bg-[var(--color-ice-primary)] text-[var(--color-bg-deep)]
            hover:bg-[var(--color-ice-glow)] disabled:opacity-50 disabled:cursor-not-allowed
            transition-all"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>

      <p className="text-xs text-[var(--color-frost-dim)] text-center">
        Reports expire after 24 hours
      </p>
    </form>
  );
}

