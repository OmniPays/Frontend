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

function getExpectedOrigin(req: NextApiRequest): string | undefined {
  const host = req.headers.host;
  if (!host) return undefined;

  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocolValue = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol;
  const protocol = protocolValue?.split(',')[0]?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');

  return `${protocol}://${host}`;
}

export function isAllowedOrigin(req: NextApiRequest): boolean {
  const origin = getRequestOrigin(req);
  if (!origin) return false;

  const allowedOrigins = new Set([...LOCAL_ORIGINS, ...getConfiguredOrigins()]);
  if (allowedOrigins.has(origin)) return true;

  const expectedOrigin = getExpectedOrigin(req);
  return !!expectedOrigin && allowedOrigins.has(expectedOrigin) && expectedOrigin === origin;
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

export function applyCorsHeaders(
  req: NextApiRequest,
  res: NextApiResponse,
  methods = 'GET, POST, OPTIONS',
): void {
  const origin = getRequestOrigin(req);
  if (!origin || !isAllowedOrigin(req)) return;

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin, Referer');
}

export function handlePreflight(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[] = ['GET', 'POST'],
): boolean {
  if (req.method !== 'OPTIONS') return false;
  if (rejectIfOriginNotAllowed(req, res)) return true;

  const requestedMethod = req.headers['access-control-request-method'];
  if (
    typeof requestedMethod === 'string' &&
    !allowedMethods.includes(requestedMethod.toUpperCase())
  ) {
    res.setHeader('Allow', allowedMethods.join(', '));
    res.status(405).json({ message: 'Method Not Allowed' });
    return true;
  }

  applyCorsHeaders(req, res, `${allowedMethods.join(', ')}, OPTIONS`);
  res.status(204).end();
  return true;
}
