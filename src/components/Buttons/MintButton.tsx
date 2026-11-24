import { Button } from 'soroswap-ui';
import { SorobanContextType } from 'stellar-react';
import { useContext, useState } from 'react';

import { AppContext, SnackbarIconType } from 'contexts';
import { sendNotification } from 'functions/sendNotification';
import { TokenType } from 'interfaces';
import BigNumber from 'bignumber.js';
import { mintTestToken } from 'services/mint';

interface MintButtonProps {
  sorobanContext: SorobanContextType;
  token: TokenType;
  amountToMint: BigNumber;
}

export function MintButton({ sorobanContext, token, amountToMint }: MintButtonProps) {
  const { SnackbarContext } = useContext(AppContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const account = sorobanContext.address;

  const mintTokens = async () => {
    if (!account) return;

    setSubmitting(true);

    try {
      const amount = amountToMint.shiftedBy(7);
      const response = await mintTestToken({
        network: sorobanContext.activeNetwork,
        contractId: token.contract,
        destination: account,
        amount,
      });

      if (response.status !== 'SUCCESS') {
        throw new Error('Mint transaction did not succeed');
      }

      sendNotification(
        `Minted ${amountToMint} ${token.code}`,
        'Minted',
        SnackbarIconType.MINT,
        SnackbarContext,
      );

      sorobanContext.connect();
    } catch (error) {
      sendNotification(
        'Unable to mint test tokens',
        'Mint failed',
        SnackbarIconType.ERROR,
        SnackbarContext,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button variant="contained" onClick={mintTokens} disabled={isSubmitting}>
      Mint!
    </Button>
  );
}
