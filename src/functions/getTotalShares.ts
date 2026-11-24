import { contractInvoke } from 'stellar-react';
import { SorobanContextType } from 'stellar-react';
import { scValToJs } from 'helpers/convert';
import { xdr } from '@stellar/stellar-sdk';

export async function getTotalShares(pairAddress: string, sorobanContext: SorobanContextType) {
  const totalSharesScVal = await contractInvoke({
    contractAddress: pairAddress,
    method: 'total_supply',
    sorobanContext,
  });

  if (!totalSharesScVal) return undefined;

  return scValToJs(totalSharesScVal as xdr.ScVal);
}
