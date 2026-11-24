import type { NextApiRequest, NextApiResponse } from 'next';

export const SUPPORTED_NETWORKS = ['mainnet', 'testnet', 'standalone', 'futurenet'] as const;
export const SUPPORTED_PROTOCOLS = ['soroswap', 'phoenix', 'aqua', 'sdex'] as const;

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];
export type SupportedProtocol = (typeof SUPPORTED_PROTOCOLS)[number];

const LOCAL_ORIGINS = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);

export function getQueryValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value.toLowerCase() : undefined;
}

export function isSupportedNetwork(value: string | undefined): value is SupportedNetwork {
  return !!value && (SUPPORTED_NETWORKS as readonly string[]).includes(value);
}

export function isSupportedProtocol(value: string | undefined): value is SupportedProtocol {
  return !!value && (SUPPORTED_PROTOCOLS as readonly string[]).includes(value);
}

function getConfiguredOrigins(): Set<string> {
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
}

function getRequestOrigin(req: NextApiRequest): string | undefined {
  const candidate = req.headers.origin || req.headers.referer;
  if (typeof candidate !== 'string' || !candidate) return undefined;

  try {
    return new URL(candidate).origin;
  } catch {
    return undefined;
  }
}

function isSameOrigin(req: NextApiRequest, origin: string): boolean {
  const host = req.headers.host;
  if (!host) return false;

  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocolValue = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol;
  const protocol = protocolValue?.split(',')[0]?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');

  return origin === `${protocol}://${host}`;
}

export function isAllowedOrigin(req: NextApiRequest): boolean {
  const origin = getRequestOrigin(req);
  if (!origin) return false;

  return isSameOrigin(req, origin) || LOCAL_ORIGINS.has(origin) || getConfiguredOrigins().has(origin);
}

export function rejectIfOriginNotAllowed(req: NextApiRequest, res: NextApiResponse): boolean {
  if (isAllowedOrigin(req)) return false;

  res.status(403).json({ message: 'Forbidden' });
  return true;
}

export function rejectIfMethodNotAllowed(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethod: string,
): boolean {
  if (req.method === allowedMethod) return false;

  res.setHeader('Allow', allowedMethod);
  res.status(405).json({ message: 'Method Not Allowed' });
  return true;
}
