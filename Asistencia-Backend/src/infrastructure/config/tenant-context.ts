import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

export function getCurrentTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

export function runWithTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
  return tenantStorage.run({ tenantId }, callback);
}
