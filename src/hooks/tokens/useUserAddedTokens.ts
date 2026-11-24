import { useSorobanReact } from 'stellar-react';
import { TokenMapType, TokenType, tokensResponse } from 'interfaces';
import { useEffect, useState } from 'react';
import { tokensToMap } from './utils';
import { getBackendNetworkName } from 'services/pairs';

export const useUserAddedTokens = () => {
  const sorobanContext = useSorobanReact();

  const [userAddedTokens, setUserAddedTokens] = useState<tokensResponse[]>([]);
  const [tokensFromActiveChain, setTokensFromActiveChain] = useState<TokenType[]>([]);
  const [tokensAsMap, setTokensAsMap] = useState<TokenMapType>({});

  useEffect(() => {
    const userAddedTokensStr = localStorage.getItem(`userAddedTokens`) || '[]';
    let storedTokens: tokensResponse[] = [];
    try {
      storedTokens = (JSON.parse(userAddedTokensStr) ?? []) as tokensResponse[];
    } catch {
      storedTokens = [];
    }

    const activeNetwork = sorobanContext.activeNetwork;
    const activeChain = getBackendNetworkName(activeNetwork);
    const activeChainTokens =
      storedTokens?.find((item: tokensResponse) => item?.network === activeChain)?.tokens ?? [];

    setUserAddedTokens(storedTokens);
    setTokensFromActiveChain(activeChainTokens);
    setTokensAsMap(tokensToMap(activeChainTokens));
  }, [sorobanContext.activeNetwork]);

  return {
    allUserAddedTokens: userAddedTokens,
    tokens: tokensFromActiveChain,
    tokensAsMap,
  };
};
