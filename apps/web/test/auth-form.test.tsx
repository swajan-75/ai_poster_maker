import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthForm } from '@/components/AuthForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: push }), useSearchParams: () => new URLSearchParams('next=/history') }));
afterEach(() => { vi.restoreAllMocks(); push.mockReset(); });

const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe('AuthForm', () => {
  it('shows Bangla validation errors and does not submit', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    wrap(<AuthForm mode="register" />);
    await userEvent.click(screen.getByRole('button', { name: 'অ্যাকাউন্ট খুলুন' }));
    expect(await screen.findByText('সঠিক ইমেইল ঠিকানা দিন')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('logs in and redirects to ?next', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ user: { id: '1', name: 'ক', email: 'a@b.com', role: 'user' } }), { status: 200 }));
    wrap(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText('ইমেইল'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('পাসওয়ার্ড'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'লগইন' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/history'));
  });

  it('shows server error in Bangla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'x' } }), { status: 401 }));
    wrap(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText('ইমেইল'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('পাসওয়ার্ড'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'লগইন' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
  });
});
