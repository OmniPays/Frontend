import { NetworkDetails, SorobanReactProvider, WalletNetwork } from 'stellar-react';
import useMounted from 'hooks/useMounted';

const DEFAULT_MAINNET_RPC_URL = 'https://soroban-rpc.mainnet.stellar.org/';

export default function MySorobanReactProvider({
  children,
  ...rest
}: {
  children: React.ReactNode;
  [x: string]: any;
}) {
  const mounted = useMounted();

  if (!mounted) return null;

  const mainnetNetworkDetails: NetworkDetails = {
    network: WalletNetwork.PUBLIC,
    sorobanRpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || DEFAULT_MAINNET_RPC_URL,
    horizonRpcUrl: 'https://horizon.stellar.org',
  };

  const testnetNetworkDetails: NetworkDetails = {
    network: WalletNetwork.TESTNET,
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org/',
    horizonRpcUrl: 'https://horizon-testnet.stellar.org',
  };

  const isMainnet = process.env.NEXT_PUBLIC_DEFAULT_NETWORK === 'mainnet';
  const activeNetwork = isMainnet ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;

  return (
    <SorobanReactProvider
      appName={'Soroswap'}
      allowedNetworkDetails={[mainnetNetworkDetails, testnetNetworkDetails]}
      activeNetwork={activeNetwork}
      {...rest}
    >
      {children}
    </SorobanReactProvider>
  );
}
