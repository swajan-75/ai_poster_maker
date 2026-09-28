'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminAnalyticsDTO, AdminPosterListDTO, AdminTemplateCreateInput, AdminTemplateDTO, AdminTemplateUpdateInput, AdminUserListDTO,
  AuthResponse, BkashExecuteInput, CreatePosterInput, ExecutePaymentResponse, LoginInput, ModerationListDTO, Occasion, PaidPlan, PaymentDTO,
  PosterDTO, PosterListDTO, PosterStatus, PublicUser, RegenerateInput, RegisterInput, SubscriptionDTO, TemplateDTO,
  UploadedPhotoDTO,
} from '@poster/shared';
import { apiFetch, ApiError } from './api';
import { clearToken, setToken } from './auth-token';

export const qk = {
  me: ['me'] as const,
  templates: (occasion?: Occasion) => ['templates', occasion ?? 'all'] as const,
  template: (id: string) => ['template', id] as const,
  poster: (id: string) => ['poster', id] as const,
  myPosters: (page: number) => ['myPosters', page] as const,
  subscription: ['subscription'] as const,
  payment: (id: string) => ['payment', id] as const,
  adminTemplates: ['adminTemplates'] as const,
  adminAnalytics: ['adminAnalytics'] as const,
  adminPosters: (page: number, status?: PosterStatus) => ['adminPosters', page, status ?? 'all'] as const,
  moderation: (page: number) => ['moderation', page] as const,
  adminUsers: (page: number, blocked?: boolean) => ['adminUsers', page, blocked ?? 'all'] as const,
};

export function useMe(opts: { optional?: boolean } = {}) {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      try { return (await apiFetch<{ user: PublicUser }>('/auth/me')).user; }
      catch (e) { if (opts.optional && e instanceof ApiError && e.status === 401) return null; throw e; }
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<PublicUser, ApiError, LoginInput>({
    mutationFn: async (input) => {
      const { user, token } = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', json: input });
      setToken(token);
      return user;
    },
    onSuccess: async (u) => { await qc.cancelQueries({ queryKey: qk.me }); qc.setQueryData(qk.me, u); },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<PublicUser, ApiError, RegisterInput>({
    mutationFn: async (input) => {
      const { user, token } = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', json: input });
      setToken(token);
      return user;
    },
    onSuccess: async (u) => { await qc.cancelQueries({ queryKey: qk.me }); qc.setQueryData(qk.me, u); },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => { clearToken(); qc.clear(); qc.setQueryData(qk.me, null); },
  });
}

export function useTemplates(occasion?: Occasion) {
  return useQuery({
    queryKey: qk.templates(occasion),
    queryFn: async () => (await apiFetch<{ items: TemplateDTO[] }>(`/templates${occasion ? `?occasion=${occasion}` : ''}`)).items,
  });
}

export function useTemplate(id: string) {
  return useQuery({ queryKey: qk.template(id), queryFn: () => apiFetch<TemplateDTO>(`/templates/${id}`) });
}

export function uploadPhoto(file: Blob): Promise<UploadedPhotoDTO> {
  const fd = new FormData();
  fd.append('photo', file, 'photo.jpg');
  return apiFetch<UploadedPhotoDTO>('/upload', { method: 'POST', body: fd });
}

export function useCreatePoster() {
  const qc = useQueryClient();
  return useMutation<PosterDTO, ApiError, CreatePosterInput>({
    mutationFn: (input) => apiFetch<PosterDTO>('/posters', { method: 'POST', json: input }),
    onSuccess: (p) => {
      qc.setQueryData(qk.poster(p.id), p);
      void qc.invalidateQueries({ queryKey: ['myPosters'] });
      void qc.invalidateQueries({ queryKey: qk.subscription });
    },
  });
}

const ACTIVE = new Set(['queued', 'generating']);
export function usePoster(id: string) {
  return useQuery({
    queryKey: qk.poster(id),
    queryFn: () => apiFetch<PosterDTO>(`/posters/${id}`),
    staleTime: 0,
    // A human decides pending_review posters, so check back slowly rather than every 2s.
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && ACTIVE.has(status) ? 2000 : status === 'pending_review' ? 15_000 : false;
    },
  });
}

export function useRegenerate(id: string) {
  const qc = useQueryClient();
  return useMutation<PosterDTO, ApiError, RegenerateInput>({
    mutationFn: (input) => apiFetch<PosterDTO>(`/posters/${id}/regenerate`, { method: 'POST', json: input }),
    onSuccess: (p) => qc.setQueryData(qk.poster(id), p),
  });
}

export function useMyPosters(page: number) {
  return useQuery({ queryKey: qk.myPosters(page), queryFn: () => apiFetch<PosterListDTO>(`/posters/me?page=${page}&limit=12`) });
}

export function useDeletePoster() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => apiFetch<void>(`/posters/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPosters'] }),
  });
}

export function useRemoveWatermark(id: string) {
  const qc = useQueryClient();
  return useMutation<PosterDTO, ApiError, void>({
    mutationFn: () => apiFetch<PosterDTO>(`/posters/${id}/remove-watermark`, { method: 'POST' }),
    onSuccess: (p) => qc.setQueryData(qk.poster(id), p),
  });
}

// --- Subscription & demo bKash payments ---

export function useSubscription(opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.subscription,
    queryFn: () => apiFetch<SubscriptionDTO>('/billing/subscription'),
    enabled: opts.enabled ?? true,
  });
}

export function useCheckout() {
  return useMutation<PaymentDTO, ApiError, PaidPlan>({
    mutationFn: (plan) => apiFetch<PaymentDTO>('/billing/checkout', { method: 'POST', json: { plan } }),
  });
}

export function usePayment(id: string) {
  return useQuery({ queryKey: qk.payment(id), queryFn: () => apiFetch<PaymentDTO>(`/billing/payments/${id}`), staleTime: 0 });
}

export function useExecutePayment(id: string) {
  const qc = useQueryClient();
  return useMutation<ExecutePaymentResponse, ApiError, BkashExecuteInput>({
    mutationFn: (input) => apiFetch<ExecutePaymentResponse>(`/billing/payments/${id}/execute`, { method: 'POST', json: input }),
    onSuccess: (r) => {
      qc.setQueryData(qk.payment(id), r.payment);
      qc.setQueryData(qk.subscription, r.subscription);
      void qc.invalidateQueries({ queryKey: qk.me });
    },
    // A failed attempt may have closed the session (3 strikes) — refresh it.
    onError: () => { void qc.invalidateQueries({ queryKey: qk.payment(id) }); },
  });
}

export function useCancelPayment(id: string) {
  const qc = useQueryClient();
  return useMutation<PaymentDTO, ApiError, void>({
    mutationFn: () => apiFetch<PaymentDTO>(`/billing/payments/${id}/cancel`, { method: 'POST' }),
    onSuccess: (p) => qc.setQueryData(qk.payment(id), p),
  });
}

// --- Admin ---

export function useAdminAnalytics() {
  return useQuery({
    queryKey: qk.adminAnalytics,
    queryFn: () => apiFetch<AdminAnalyticsDTO>('/admin/analytics'),
    refetchInterval: 60_000,
  });
}

export function useAdminTemplates() {
  return useQuery({
    queryKey: qk.adminTemplates,
    queryFn: async () => (await apiFetch<{ items: AdminTemplateDTO[] }>('/admin/templates')).items,
  });
}

export function useAdminTemplate(id: string) {
  const { data } = useAdminTemplates();
  return data?.find((t) => t.id === id);
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation<AdminTemplateDTO, ApiError, AdminTemplateCreateInput>({
    mutationFn: (input) => apiFetch<AdminTemplateDTO>('/admin/templates', { method: 'POST', json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminTemplates }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation<AdminTemplateDTO, ApiError, AdminTemplateUpdateInput>({
    mutationFn: (input) => apiFetch<AdminTemplateDTO>(`/admin/templates/${id}`, { method: 'PATCH', json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminTemplates }),
  });
}

export function useDeactivateTemplate() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => apiFetch<void>(`/admin/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminTemplates }),
  });
}

export function useAdminPosters(page: number, status?: PosterStatus) {
  return useQuery({
    queryKey: qk.adminPosters(page, status),
    queryFn: () => apiFetch<AdminPosterListDTO>(`/admin/posters?page=${page}&limit=20${status ? `&status=${status}` : ''}`),
  });
}

export function useAdminDeletePoster(page: number, status?: PosterStatus) {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => apiFetch<void>(`/posters/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminPosters(page, status) }),
  });
}

export function useModerationQueue(page: number) {
  return useQuery({
    queryKey: qk.moderation(page),
    queryFn: () => apiFetch<ModerationListDTO>(`/admin/moderation?page=${page}&limit=20`),
  });
}

export function useModerationDecision() {
  const qc = useQueryClient();
  return useMutation<PosterDTO, ApiError, { id: string; decision: 'approve' | 'reject'; note?: string }>({
    mutationFn: ({ id, decision, note }) =>
      apiFetch<PosterDTO>(`/admin/moderation/${id}/${decision}`, { method: 'POST', json: decision === 'reject' ? { note } : undefined }),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['moderation'] }),
      qc.invalidateQueries({ queryKey: ['adminPosters'] }),
    ]),
  });
}

export function useAdminUsers(page: number, blocked?: boolean) {
  return useQuery({
    queryKey: qk.adminUsers(page, blocked),
    queryFn: () => apiFetch<AdminUserListDTO>(`/admin/users?page=${page}&limit=20${blocked === undefined ? '' : `&blocked=${blocked}`}`),
  });
}

export function useSetUserBlocked() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, { id: string; blocked: boolean }>({
    mutationFn: ({ id, blocked }) => apiFetch<void>(`/admin/users/${id}/${blocked ? 'block' : 'unblock'}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}
