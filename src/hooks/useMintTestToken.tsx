import { useSorobanReact } from 'stellar-react';
import BigNumber from 'bignumber.js';
import { SnackbarIconType } from 'contexts';
import { TokenType } from 'interfaces';
import { useCallback } from 'react';
import { mintTestToken } from 'services/mint';
import { useApiTokens } from './tokens/useApiTokens';
import useNotification from './useNotification';

interface MintTestTokenProps {
  onTokenMintedStart?: (token: TokenType) => void;
  onTokenMintedSuccess?: (token: TokenType) => void;
  onTokenMintedError?: (token: TokenType) => void;
}

export function useMintTestToken() {
  const sorobanContext = useSorobanReact();
  const { tokens } = useApiTokens();
  const { notify } = useNotification();

  return useCallback(
    async ({
      onTokenMintedStart,
      onTokenMintedSuccess,
      onTokenMintedError,
    }: MintTestTokenProps) => {
      const account = sorobanContext.address;

      if (!account) return;

      const amount = BigNumber(2500000).shiftedBy(7);
      let totalMinted = 0;

      for (const token of tokens) {
        try {
          onTokenMintedStart?.(token);
          const response = await mintTestToken({
            network: sorobanContext.activeNetwork,
            contractId: token.contract,
            destination: account,
            amount,
          });

          if (response.status !== 'SUCCESS') throw new Error(response.status);

          totalMinted++;
          onTokenMintedSuccess?.(token);
        } catch (error) {
          onTokenMintedError?.(token);
        }
      }

      if (totalMinted > 0) {
        notify({
          message: `Minted test tokens successfully`,
          title: 'Mint',
          type: SnackbarIconType.MINT,
        });
      } else {
        notify({
          message: `Minted test tokens failed`,
          title: 'Error',
          type: SnackbarIconType.ERROR,
        });
      }
    },
    [sorobanContext, tokens, notify],
  );
}
