import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import {
  getQueryValue,
  isSupportedNetwork,
  rejectIfMethodNotAllowed,
  rejectIfOriginNotAllowed,
} from '../../../src/server/apiGuards';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (rejectIfOriginNotAllowed(req, res)) return;
  if (rejectIfMethodNotAllowed(req, res, 'POST')) return;

  const network = getQueryValue(req.query.network);

  if (!network) {
    return res.status(400).json({ message: 'Missing "network" query parameter' });
  }

  if (!isSupportedNetwork(network)) {
    return res.status(400).json({ message: 'Invalid "network" query parameter' });
  }

  try {
    const swapResponse = await axios.post(`${process.env.SOROSWAP_API_URL}/quote`, req.body, {
      params: { network },
      headers: {
        Authorization: `Bearer ${process.env.SOROSWAP_API_KEY}`,
      },
    });

    return res.status(200).json(swapResponse.data);
  } catch (error: any) {
    console.error('[API ERROR]', error?.message || error);
    return res
      .status(error?.response?.status || 500)
      .json({ message: error?.response?.data?.message || error?.message || 'Server Error' });
  }
}
