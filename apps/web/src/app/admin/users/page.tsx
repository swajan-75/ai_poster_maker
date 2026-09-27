'use client';
import { useState } from 'react';
import { useAdminUsers, useMe, useSetUserBlocked } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

export default function AdminUsersPage() {
  const t = useT();
  const [page, setPage] = useState(1);
  const [blocked, setBlocked] = useState<boolean | undefined>(undefined);
  const { data: me } = useMe({ optional: true });
  const { data, isLoading, error } = useAdminUsers(page, blocked);
  const setUserBlocked = useSetUserBlocked();
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <select
        className="field w-fit"
        value={blocked === undefined ? '' : String(blocked)}
        onChange={(e) => { setPage(1); setBlocked(e.target.value === '' ? undefined : e.target.value === 'true'); }}
      >
        <option value="">{t.admin.allUsers}</option>
        <option value="false">{t.admin.activeUsers}</option>
        <option value="true">{t.admin.blockedUsers}</option>
      </select>
      {isLoading && <div className="skeleton h-40 w-full" aria-hidden="true" />}
      {error && <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>}
      {setUserBlocked.error && <p role="alert" className="pop text-rally">{errorMessage(setUserBlocked.error)}</p>}
      {data && data.items.length === 0 && <div className="card p-8 text-center text-ink/60">{t.admin.empty}</div>}
      {data && data.items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-ink/60">
              <tr>
                <th className="p-3">{t.auth.name}</th>
                <th className="p-3">{t.auth.email}</th>
                <th className="p-3">{t.admin.statusColumn}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t border-line">
                    <td className="p-3 font-semibold">{u.name}</td>
                    <td className="p-3 text-ink/70">{u.email}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isBlocked ? 'bg-rally/10 text-rally' : 'bg-brand-soft text-brand-strong'}`}>
                        {u.isBlocked ? t.admin.blocked : t.admin.active}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        disabled={isSelf || setUserBlocked.isPending}
                        title={isSelf ? t.admin.cannotBlockSelf : undefined}
                        className={`btn px-3 py-1.5 text-xs ${u.isBlocked ? 'btn-ghost' : 'btn-danger'}`}
                        onClick={() => {
                          if (!u.isBlocked && !window.confirm(t.admin.confirmBlock)) return;
                          setUserBlocked.mutate({ id: u.id, blocked: !u.isBlocked });
                        }}
                      >
                        {u.isBlocked ? t.admin.unblock : t.admin.block}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
