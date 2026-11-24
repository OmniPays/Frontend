import axios from 'axios';
import BigNumber from 'bignumber.js';

export interface MintTestTokenResponse {
  status: string;
  hash?: string;
}

interface MintTestTokenParams {
  network?: string;
  contractId: string;
  destination: string;
  amount: BigNumber;
}

export async function mintTestToken({
  network,
  contractId,
  destination,
  amount,
}: MintTestTokenParams): Promise<MintTestTokenResponse> {
  const { data } = await axios.post<MintTestTokenResponse>('/api/mint/test-token', {
    network,
    contractId,
    destination,
    amount: amount.integerValue(BigNumber.ROUND_DOWN).toFixed(0),
  });

  return data;
}

export async function getTestTokenAdminPublicKey(): Promise<string | undefined> {
  const { data } = await axios.get<{ adminPublicKey?: string }>('/api/mint/test-token');
  return data.adminPublicKey;
}
