'use client';
import { useState } from 'react';
import type { PosterStatus } from '@poster/shared';
import { POSTER_STATUSES } from '@poster/shared';
import { useAdminDeletePoster, useAdminPosters } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { StatusBadge } from '@/components/StatusBadge';
import { useT } from '@/lib/i18n';

export default function AdminPostersPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PosterStatus | undefined>(undefined);
  const { data, isLoading, error } = useAdminPosters(page, status);
  const del = useAdminDeletePoster(page, status);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <select
        className="field w-fit"
        value={status ?? ''}
        onChange={(e) => { setPage(1); setStatus(e.target.value ? (e.target.value as PosterStatus) : undefined); }}
      >
        <option value="">{t.admin.allStatuses}</option>
        {POSTER_STATUSES.map((s) => <option key={s} value={s}>{t.statusBadge[s]}</option>)}
      </select>
      {isLoading && <div className="skeleton h-40 w-full" aria-hidden="true" />}
      {error && <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>}
      {del.error && <p role="alert" className="pop text-rally">{errorMessage(del.error)}</p>}
      {data && data.items.length === 0 && <div className="card p-8 text-center text-ink/60">{t.admin.empty}</div>}
      {data && data.items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-ink/60">
              <tr>
                <th className="p-3">{t.admin.ownerColumn}</th>
                <th className="p-3">{t.posterForm.headline}</th>
                <th className="p-3">{t.admin.statusColumn}</th>
                <th className="p-3">{t.admin.dateColumn}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">
                    <div className="font-semibold">{p.ownerName}</div>
                    <div className="text-xs text-ink/50">{p.ownerEmail}</div>
                  </td>
                  <td className="p-3">{p.formData.headline}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 text-ink/60">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={del.isPending && del.variables === p.id}
                      className="btn btn-danger px-3 py-1.5 text-xs"
                      onClick={() => { if (window.confirm(t.admin.confirmDelete)) del.mutate(p.id); }}
                    >
                      {t.admin.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
