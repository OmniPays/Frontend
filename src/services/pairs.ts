import { Networks } from '@stellar/stellar-sdk';

export const BACKEND_NETWORKS = ['mainnet', 'testnet', 'standalone', 'futurenet'] as const;
export type BackendNetwork = (typeof BACKEND_NETWORKS)[number];

const backendNetworkByPassphrase: Record<string, BackendNetwork> = {
  [Networks.PUBLIC]: 'mainnet',
  [Networks.TESTNET]: 'testnet',
  [Networks.STANDALONE]: 'standalone',
  [Networks.FUTURENET]: 'futurenet',
  [Networks.SANDBOX]: 'standalone',
};

export const passphraseToBackendNetworkName: Record<string, string> = Object.fromEntries(
  Object.entries(backendNetworkByPassphrase).map(([passphrase, network]) => [
    passphrase,
    network.toUpperCase(),
  ]),
);

export function getBackendNetworkName(passphrase?: string): BackendNetwork {
  return (passphrase && backendNetworkByPassphrase[passphrase]) || 'testnet';
}
