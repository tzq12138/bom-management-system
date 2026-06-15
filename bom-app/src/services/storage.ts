import type {
  BOMProject,
  BOMVersion,
  DashboardStats,
  Material,
  Module,
  ModulePart,
  SubModule,
  TeamActivity,
  User,
  UserRole,
  ValidationResult,
} from '../types';

export type { User, UserRole } from '../types';

const API_BASE = '/api';
const STORAGE_KEYS = {
  CURRENT_USER: 'bom_current_user',
  AUTH_TOKEN: 'bom_auth_token',
};

interface LoginResponse {
  user: User;
  token: string;
}

function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const authToken = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
      clearAuthState();
    }

    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore non-json bodies
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function dispatchUserUpdated() {
  window.dispatchEvent(new Event('userUpdated'));
}

function clearAuthState() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  dispatchUserUpdated();
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) as User : null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  dispatchUserUpdated();
}

export async function login(username: string, password: string): Promise<User | null> {
  try {
    const data = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  } catch {
    return null;
  }
}

export function logout(): void {
  const token = getAuthToken();
  void fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch(() => undefined);
  clearAuthState();
}

export async function restoreSession(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) {
    setCurrentUser(null);
    return null;
  }

  try {
    const data = await apiRequest<{ user: User }>('/auth/me');
    setCurrentUser(data.user);
    return data.user;
  } catch {
    clearAuthState();
    return null;
  }
}

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users');
}

export async function getUser(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

export async function createUser(data: {
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
}): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | undefined> {
  try {
    const user = await apiRequest<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    const currentUser = getCurrentUser();
    if (currentUser?.id === id) {
      setCurrentUser(user);
    }

    return user;
  } catch {
    return undefined;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const currentUser = getCurrentUser();
  if (currentUser?.id === id) {
    return false;
  }

  try {
    await apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function getProjects(): Promise<BOMProject[]> {
  return apiRequest<BOMProject[]>('/projects');
}

export async function getProject(id: string): Promise<BOMProject | undefined> {
  try {
    return await apiRequest<BOMProject>(`/projects/${id}`);
  } catch {
    return undefined;
  }
}

export async function createProject(
  project: Omit<BOMProject, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
): Promise<BOMProject> {
  return apiRequest<BOMProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function updateProject(
  id: string,
  updates: Partial<BOMProject>
): Promise<BOMProject | undefined> {
  try {
    return await apiRequest<BOMProject>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return undefined;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await apiRequest<void>(`/projects/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function createVersion(
  projectId: string,
  version: Omit<BOMVersion, 'id' | 'createdAt' | 'isActive'>
): Promise<BOMVersion | undefined> {
  try {
    return await apiRequest<BOMVersion>(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(version),
    });
  } catch {
    return undefined;
  }
}

export async function getMaterials(): Promise<Material[]> {
  return apiRequest<Material[]>('/materials');
}

export async function createMaterial(data: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
  return apiRequest<Material>('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMaterial(
  id: string,
  updates: Partial<Omit<Material, 'id' | 'createdAt'>>
): Promise<Material | undefined> {
  try {
    return await apiRequest<Material>(`/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return undefined;
  }
}

export async function deleteMaterial(id: string): Promise<boolean> {
  try {
    await apiRequest<void>(`/materials/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function getActivities(): Promise<TeamActivity[]> {
  return apiRequest<TeamActivity[]>('/activities');
}

export async function addActivity(activity: Omit<TeamActivity, 'id' | 'timestamp'>): Promise<TeamActivity> {
  return apiRequest<TeamActivity>('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>('/stats');
}

export async function validateBOM(projectId: string): Promise<ValidationResult> {
  return apiRequest<ValidationResult>(`/projects/${projectId}/validation`);
}

export async function getModules(): Promise<Module[]> {
  return apiRequest<Module[]>('/modules');
}

export async function getModule(id: string): Promise<Module | undefined> {
  try {
    return await apiRequest<Module>(`/modules/${id}`);
  } catch {
    return undefined;
  }
}

export async function createModule(data: { name: string; description?: string; icon?: string }): Promise<Module> {
  return apiRequest<Module>('/modules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModule(
  id: string,
  updates: Partial<Omit<Module, 'id' | 'createdAt' | 'subModules'>>
): Promise<Module | undefined> {
  try {
    return await apiRequest<Module>(`/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return undefined;
  }
}

export async function deleteModule(id: string): Promise<boolean> {
  try {
    await apiRequest<void>(`/modules/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function addSubModule(
  moduleId: string,
  data: { name: string; description?: string }
): Promise<SubModule | undefined> {
  try {
    return await apiRequest<SubModule>(`/modules/${moduleId}/submodules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return undefined;
  }
}

export async function updateSubModule(
  moduleId: string,
  subModuleId: string,
  updates: Partial<Omit<SubModule, 'id' | 'createdAt'>>
): Promise<SubModule | undefined> {
  try {
    return await apiRequest<SubModule>(`/modules/${moduleId}/submodules/${subModuleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return undefined;
  }
}

export async function deleteSubModule(moduleId: string, subModuleId: string): Promise<boolean> {
  try {
    await apiRequest<void>(`/modules/${moduleId}/submodules/${subModuleId}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function addPartToSubModule(
  moduleId: string,
  subModuleId: string,
  part: Omit<ModulePart, 'id'>
): Promise<ModulePart | undefined> {
  try {
    return await apiRequest<ModulePart>(`/modules/${moduleId}/submodules/${subModuleId}/parts`, {
      method: 'POST',
      body: JSON.stringify(part),
    });
  } catch {
    return undefined;
  }
}

export async function updatePartInSubModule(
  moduleId: string,
  subModuleId: string,
  partId: string,
  updates: Partial<Omit<ModulePart, 'id'>>
): Promise<ModulePart | undefined> {
  try {
    return await apiRequest<ModulePart>(`/modules/${moduleId}/submodules/${subModuleId}/parts/${partId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return undefined;
  }
}

export async function deletePartFromSubModule(
  moduleId: string,
  subModuleId: string,
  partId: string
): Promise<boolean> {
  try {
    await apiRequest<void>(`/modules/${moduleId}/submodules/${subModuleId}/parts/${partId}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}
