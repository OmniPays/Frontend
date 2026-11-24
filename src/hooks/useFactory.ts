import { SorobanContextType } from 'stellar-react';
import { useEffect, useState } from 'react';
import { fetchFactory } from 'services/factory';
import useSWRImmutable from 'swr/immutable';
import { getBackendNetworkName } from 'services/pairs';

export const useFactory = (sorobanContext: SorobanContextType) => {
  const { activeNetwork } = sorobanContext;
  const activeChain = getBackendNetworkName(activeNetwork);

  const { data, error, isLoading, mutate } = useSWRImmutable(
    ['factory', activeChain],
    ([key, activeChain]) => fetchFactory(activeChain),
  );

  const [factory, setFactory] = useState<string>();

  useEffect(() => {
    if (!data || !sorobanContext) return;

    setFactory(data.address);
  }, [data, sorobanContext]);

  return { factory, isLoading, isError: error, mutate };
};
