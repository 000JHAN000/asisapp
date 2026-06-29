import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const BASE = 'http://localhost:3001/api';

export interface SuperAdminTenant {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
}

export interface CreateTenantInput {
  slug: string;
  nombre: string;
  dbName: string;
  adminDocumento?: string;
  adminCorreo?: string;
  adminNombre?: string;
  adminApellido?: string;
  adminPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminTenantService {
  constructor(private readonly http: HttpClient) {}

  getTenants() {
    return this.http.get<SuperAdminTenant[]>(`${BASE}/super-admin/tenants`);
  }

  createTenant(input: CreateTenantInput) {
    return this.http.post<{ id: string; slug: string }>(`${BASE}/super-admin/tenants`, input);
  }

  toggleStatus(slug: string, activo: boolean) {
    return this.http.patch(`${BASE}/super-admin/tenants/${slug}/status`, { slug, activo });
  }
}
