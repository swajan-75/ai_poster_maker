'use client';
import type { Plan } from '@poster/shared';
import { useT } from '@/lib/i18n';
import { CrownIcon } from './UpgradePrompt';

const STYLE: Record<Plan, string> = {
  free: 'bg-ink/5 text-ink/60',
  pro: 'bg-brand-soft text-brand',
  ultra: 'bg-marigold/20 text-[#9a5f00]',
};

export function PlanBadge({ plan }: { plan: Plan }) {
  const t = useT();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[plan]}`}>
      {plan !== 'free' && <CrownIcon className="h-3 w-3" />}
      {t.plans[plan]}
    </span>
  );
}
