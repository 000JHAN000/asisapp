/**
 * Normaliza direcciones IP para presentar IPv4 limpias.
 * Convierte direcciones IPv4-mapeadas dentro de IPv6 (ej. ::ffff:192.168.1.1)
 * a su forma IPv4 pura, y ::1 a 127.0.0.1.
 */
export function normalizeIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;

  const trimmed = ip.trim();
  if (!trimmed) return undefined;

  // IPv4-mapped IPv6 address: ::ffff:192.168.1.1 -> 192.168.1.1
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  // Loopback IPv6 -> IPv4
  if (trimmed === '::1') {
    return '127.0.0.1';
  }

  return trimmed;
}
