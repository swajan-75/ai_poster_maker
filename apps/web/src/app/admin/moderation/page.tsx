'use client';
import { useState } from 'react';
import type { PosterFormData } from '@poster/shared';
import { useModerationDecision, useModerationQueue } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

const FIELDS = ['headline', 'tagline', 'name', 'designation', 'organization', 'union', 'thana', 'district'] as const satisfies readonly (keyof PosterFormData)[];
const BALLOT_FIELDS = ['topLine', 'electionDate', 'symbol', 'appeal', 'campaignBy'] as const satisfies readonly (keyof PosterFormData)[];

export default function AdminModerationPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useModerationQueue(page);
  const decide = useModerationDecision();
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const busy = (id: string) => decide.isPending && decide.variables?.id === id;
  const label = (f: (typeof FIELDS)[number] | (typeof BALLOT_FIELDS)[number]) =>
    (FIELDS as readonly string[]).includes(f) ? t.posterForm[f as (typeof FIELDS)[number]] : t.posterForm.ballot[f as (typeof BALLOT_FIELDS)[number]];

  const reject = (id: string) => {
    const note = window.prompt(t.admin.rejectNotePrompt);
    if (note === null) return; // cancelled
    decide.mutate({ id, decision: 'reject', note: note.trim() || undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading && <div className="skeleton h-40 w-full" aria-hidden="true" />}
      {error && <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>}
      {decide.error && <p role="alert" className="pop text-rally">{errorMessage(decide.error)}</p>}
      {data && data.items.length === 0 && <div className="card p-8 text-center text-ink/60">{t.admin.queueEmpty}</div>}
      {data?.items.map((p) => (
        <article key={p.id} className="card flex flex-col gap-4 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{p.ownerName}</div>
              <div className="text-xs text-ink/50">{p.ownerEmail}</div>
            </div>
            <div className="text-xs text-ink/50">{t.admin.flaggedAt}: {new Date(p.flaggedAt).toLocaleString()}</div>
          </header>

          <div className="rounded-xl border-l-4 border-rally bg-rally/5 p-3 text-sm">
            <div className="font-semibold text-rally">{t.admin.flagReason}</div>
            <div className="text-ink/80">{p.flagReason}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {[...FIELDS, ...BALLOT_FIELDS].filter((f) => p.formData[f]).map((f) => (
                <div key={f} className="contents">
                  <dt className="text-ink/50">{label(f)}</dt>
                  <dd className="whitespace-pre-wrap break-words">{p.formData[f]}</dd>
                </div>
              ))}
            </dl>
            {p.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.photoUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="h-28 w-24 rounded-lg object-cover ring-1 ring-line" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <footer className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-danger px-4 py-2 text-sm" disabled={busy(p.id)} onClick={() => reject(p.id)}>
              {t.admin.reject}
            </button>
            <button type="button" className="btn btn-primary px-4 py-2 text-sm" disabled={busy(p.id)}
              onClick={() => decide.mutate({ id: p.id, decision: 'approve' })}>
              {t.admin.approve}
            </button>
          </footer>
        </article>
      ))}
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost px-4 py-2">{t.admin.prev}</button>
          <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost px-4 py-2">{t.admin.next}</button>
        </nav>
      )}
    </div>
  );
}
