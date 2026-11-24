import { SorobanContextType, useSorobanReact } from 'stellar-react';
import { useEffect, useState } from 'react';
import { fetchRouter } from 'services/router';
import useSWRImmutable from 'swr/immutable';
import { getBackendNetworkName } from 'services/pairs';

export const useRouterAddress = () => {
  const sorobanContext: SorobanContextType = useSorobanReact();

  const { activeNetwork } = sorobanContext;
  const activeChain = getBackendNetworkName(activeNetwork);
  const { data, error, isLoading, mutate } = useSWRImmutable(
    ['router', activeChain],
    ([key, activeChain]) =>
      fetchRouter(activeChain),
  );

  const [router, setRouter] = useState<string>();

  useEffect(() => {
    if (!data || !sorobanContext) return;

    setRouter(data.address)
  }, [data, sorobanContext]);

  return { router, isLoading, isError: error, data, mutate };
};
