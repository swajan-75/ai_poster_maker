'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminPosterListDTO, AdminTemplateCreateInput, AdminTemplateDTO, AdminTemplateUpdateInput, AdminUserListDTO,
  AuthResponse, CreatePosterInput, LoginInput, Occasion, PosterDTO, PosterListDTO, PosterStatus, PublicUser,
  RegenerateInput, RegisterInput, TemplateDTO, UploadedPhotoDTO,
} from '@poster/shared';
import { apiFetch, ApiError } from './api';
import { clearToken, setToken } from './auth-token';

export const qk = {
  me: ['me'] as const,
  templates: (occasion?: Occasion) => ['templates', occasion ?? 'all'] as const,
  template: (id: string) => ['template', id] as const,
  poster: (id: string) => ['poster', id] as const,
  myPosters: (page: number) => ['myPosters', page] as const,
  adminTemplates: ['adminTemplates'] as const,
  adminPosters: (page: number, status?: PosterStatus) => ['adminPosters', page, status ?? 'all'] as const,
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
    onSuccess: (p) => { qc.setQueryData(qk.poster(p.id), p); void qc.invalidateQueries({ queryKey: ['myPosters'] }); },
  });
}

const ACTIVE = new Set(['queued', 'generating']);
export function usePoster(id: string) {
  return useQuery({
    queryKey: qk.poster(id),
    queryFn: () => apiFetch<PosterDTO>(`/posters/${id}`),
    staleTime: 0,
    refetchInterval: (q) => (q.state.data && ACTIVE.has(q.state.data.status) ? 2000 : false),
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

// --- Admin ---

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
