import { SorobanContextType } from 'stellar-react';
import BigNumber from 'bignumber.js';

import { getTotalShares } from './getTotalShares';

export default async function getLpTokensAmount(
  amount0: BigNumber,
  reserve0: BigNumber,
  amount1: BigNumber,
  reserve1: BigNumber,
  pairAddress: string,
  sorobanContext: SorobanContextType,
): Promise<BigNumber> {
  const fallback = () => amount0.multipliedBy(amount1).squareRoot();

  try {
    const totalShares = await getTotalShares(pairAddress, sorobanContext);
    if (totalShares === undefined || totalShares === null) return fallback();

    const shares = BigNumber(totalShares as BigNumber.Value);
    if (shares.isNaN() || shares.isZero() || reserve0.isZero() || reserve1.isZero()) {
      return fallback();
    }

    const lp0 = amount0.multipliedBy(shares).dividedBy(reserve0).decimalPlaces(0);
    const lp1 = amount1.multipliedBy(shares).dividedBy(reserve1).decimalPlaces(0);

    return BigNumber.min(lp0, lp1);
  } catch (error) {
    return fallback();
  }
}
