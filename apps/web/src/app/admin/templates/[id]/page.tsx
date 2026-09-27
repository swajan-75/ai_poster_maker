'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminTemplateForm } from '@/components/AdminTemplateForm';
import { useAdminTemplate, useUpdateTemplate } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

export default function EditTemplatePage() {
  const t = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const template = useAdminTemplate(id);
  const update = useUpdateTemplate(id);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/templates" className="text-sm text-ink/60 hover:text-ink"><span aria-hidden="true">←</span> {t.admin.backToList}</Link>
      <h2 className="font-display text-2xl font-bold">{t.admin.editTemplate}</h2>
      {!template && <div className="skeleton h-40 w-full" aria-hidden="true" />}
      {template && (
        <AdminTemplateForm
          initial={template}
          submitting={update.isPending}
          serverError={update.error ? errorMessage(update.error) : undefined}
          onSubmit={(v) => update.mutate(v, { onSuccess: () => router.push('/admin/templates') })}
        />
      )}
    </div>
  );
}
