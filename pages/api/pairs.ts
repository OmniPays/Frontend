import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import {
  applyCorsHeaders,
  getQueryValue,
  handlePreflight,
  isSupportedNetwork,
  isSupportedProtocol,
  rejectIfMethodNotAllowed,
  rejectIfOriginNotAllowed,
} from '../../src/server/apiGuards';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handlePreflight(req, res, ['GET'])) return;
  if (rejectIfOriginNotAllowed(req, res)) return;
  applyCorsHeaders(req, res, 'GET, OPTIONS');
  if (rejectIfMethodNotAllowed(req, res, 'GET')) return;

  const network = getQueryValue(req.query.network);
  const protocol = getQueryValue(req.query.protocol);

  if (!network || !protocol) {
    return res.status(400).json({ message: 'Missing "network" or "protocol" query parameter' });
  }

  if (!isSupportedNetwork(network) || !isSupportedProtocol(protocol)) {
    return res.status(400).json({ message: 'Invalid "network" or "protocol" query parameter' });
  }

  try {
    const pairsResponse = await axios.get(`${process.env.SOROSWAP_API_URL}/pairs`, {
      params: { network, protocol },
      headers: {
        Authorization: `Bearer ${process.env.SOROSWAP_API_KEY}`,
      },
    });

    if (network === 'mainnet') {
      const assetList = await axios.get(
        'https://raw.githubusercontent.com/soroswap/token-list/refs/heads/main/tokenList.json',
      );

      const toReturn = pairsResponse.data.filter((pair: any) => {
        const tokenAExists = assetList.data.assets.some(
          (asset: any) => asset.contract === pair.tokenA,
        );
        const tokenBExists = assetList.data.assets.some(
          (asset: any) => asset.contract === pair.tokenB,
        );
        const specialToken =
          pair.tokenA === 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA' ||
          pair.tokenB === 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
        return (tokenAExists && tokenBExists) || specialToken;
      });

      return res.status(200).json(toReturn);
    }

    return res.status(200).json(pairsResponse.data);
  } catch (error: any) {
    console.error('[API ERROR]', error?.message || error);
    return res
      .status(error?.response?.status || 500)
      .json({ message: error?.response?.data?.message || error?.message || 'Server Error' });
  }
}
