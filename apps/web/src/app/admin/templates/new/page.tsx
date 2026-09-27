'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminTemplateForm } from '@/components/AdminTemplateForm';
import { useCreateTemplate } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

export default function NewTemplatePage() {
  const t = useT();
  const router = useRouter();
  const create = useCreateTemplate();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/templates" className="text-sm text-ink/60 hover:text-ink"><span aria-hidden="true">←</span> {t.admin.backToList}</Link>
      <h2 className="font-display text-2xl font-bold">{t.admin.newTemplate}</h2>
      <AdminTemplateForm
        submitting={create.isPending}
        serverError={create.error ? errorMessage(create.error) : undefined}
        onSubmit={(v) => create.mutate(v, { onSuccess: () => router.push('/admin/templates') })}
      />
    </div>
  );
}
