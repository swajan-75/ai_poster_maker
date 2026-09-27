'use client';
import Link from 'next/link';
import { useAdminTemplates, useDeactivateTemplate } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

export default function AdminTemplatesPage() {
  const t = useT();
  const { data, isLoading, error } = useAdminTemplates();
  const deactivate = useDeactivateTemplate();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/admin/templates/new" className="btn btn-primary px-4 py-2"><span aria-hidden="true">+</span>{t.admin.newTemplate}</Link>
      </div>
      {isLoading && <div className="skeleton h-40 w-full" aria-hidden="true" />}
      {error && <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>}
      {deactivate.error && <p role="alert" className="pop text-rally">{errorMessage(deactivate.error)}</p>}
      {data && data.length === 0 && <div className="card p-8 text-center text-ink/60">{t.admin.empty}</div>}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-ink/60">
              <tr>
                <th className="p-3">{t.admin.title}</th>
                <th className="p-3">{t.admin.slug}</th>
                <th className="p-3">{t.admin.occasion}</th>
                <th className="p-3">{t.admin.photoSlots}</th>
                <th className="p-3" />
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((tpl) => (
                <tr key={tpl.id} className="border-t border-line">
                  <td className="p-3 font-semibold">{tpl.title}</td>
                  <td className="p-3 font-mono text-xs text-ink/60">{tpl.slug}</td>
                  <td className="p-3">{t.occasion[tpl.occasion]}</td>
                  <td className="p-3">{tpl.photoSlots}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tpl.isActive ? 'bg-brand-soft text-brand-strong' : 'bg-ink/10 text-ink/50'}`}>
                      {tpl.isActive ? t.admin.active : t.admin.inactive}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/templates/${tpl.id}`} className="btn btn-ghost px-3 py-1.5 text-xs">{t.admin.editTemplate}</Link>
                      {tpl.isActive && (
                        <button
                          type="button"
                          disabled={deactivate.isPending}
                          className="btn btn-danger px-3 py-1.5 text-xs"
                          onClick={() => { if (window.confirm(t.admin.confirmDeactivate)) deactivate.mutate(tpl.id); }}
                        >
                          {t.admin.deactivate}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
