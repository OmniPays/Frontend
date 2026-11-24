import { contractInvoke, useContractValue } from 'stellar-react';
import { SorobanContextType } from 'stellar-react';
import BigNumber from 'bignumber.js';
import { scValToJs } from 'helpers/convert';
import * as StellarSdk from '@stellar/stellar-sdk';
import { xdr } from '@stellar/stellar-sdk';
import { bigNumberToI128, scvalToBigNumber } from '../helpers/utils';

export function useReservesScVal(pairAddress: string, sorobanContext: SorobanContextType) {
  const reserves_scval = useContractValue({
    contractAddress: pairAddress,
    method: 'get_reserves',
    args: [],
    sorobanContext: sorobanContext,
  });
  const values = reserves_scval.result?.value() as StellarSdk.xdr.ScVal[] | undefined;
  const scValZero = bigNumberToI128(BigNumber(0));
  const reserve0ScVal: StellarSdk.xdr.ScVal = values?.[0] ?? scValZero;
  const reserve1ScVal: StellarSdk.xdr.ScVal = values?.[1] ?? scValZero;

  return {
    reserve0ScVal,
    reserve1ScVal,
  };
}

export function useReservesBigNumber(pairAddress: string, sorobanContext: SorobanContextType) {
  const reservesScVal = useReservesScVal(pairAddress, sorobanContext);

  return {
    reserve0: scvalToBigNumber(reservesScVal.reserve0ScVal),
    reserve1: scvalToBigNumber(reservesScVal.reserve1ScVal),
  };
}

export async function reservesBigNumber(pairAddress: string, sorobanContext: SorobanContextType) {
  if (!sorobanContext.activeNetwork || !pairAddress) return;

  const reserves_scval = await contractInvoke({
    contractAddress: pairAddress,
    method: 'get_reserves',
    args: [],
    sorobanContext,
  });

  const reserves = scValToJs<Array<string | number | BigNumber>>(reserves_scval as xdr.ScVal);

  return {
    reserve0: BigNumber(reserves?.[0] ?? 0),
    reserve1: BigNumber(reserves?.[1] ?? 0),
  };
}

export async function reservesBNWithTokens(
  pairAddress: string,
  sorobanContext: SorobanContextType,
) {
  const result = await reservesBigNumber(pairAddress, sorobanContext);
  const reserve0 = result?.reserve0;
  const reserve1 = result?.reserve1;

  const token0_scval = await contractInvoke({
    contractAddress: pairAddress,
    method: 'token_0',
    args: [],
    sorobanContext,
  });
  const token0 = scValToJs<string>(token0_scval as xdr.ScVal);

  const token1_scval = await contractInvoke({
    contractAddress: pairAddress,
    method: 'token_1',
    args: [],
    sorobanContext,
  });
  const token1 = scValToJs<string>(token1_scval as xdr.ScVal);

  return {
    token0,
    reserve0,
    token1,
    reserve1,
  };
}
