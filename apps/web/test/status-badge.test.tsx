import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it.each([['queued', 'অপেক্ষমাণ'], ['generating', 'তৈরি হচ্ছে'], ['completed', 'সম্পন্ন'], ['failed', 'ব্যর্থ']] as const)('%s → %s', (s, label) => {
    render(<StatusBadge status={s} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
