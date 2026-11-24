import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Address,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';

const RPC_OVERRIDE_KEYS: Record<string, string> = {
  [Networks.TESTNET]: 'TESTNET_RPC_URL',
  [Networks.STANDALONE]: 'STANDALONE_RPC_URL',
  [Networks.FUTURENET]: 'FUTURENET_RPC_URL',
  [Networks.SANDBOX]: 'STANDALONE_RPC_URL',
};

const DEFAULT_RPC_URLS: Record<string, string> = {
  [Networks.TESTNET]: 'https://soroban-testnet.stellar.org/',
  [Networks.STANDALONE]: 'http://localhost:8000/soroban/rpc',
  [Networks.FUTURENET]: 'http://localhost:8000/soroban/rpc',
  [Networks.SANDBOX]: 'http://localhost:8000/soroban/rpc',
};

const ACCOUNT_ID_PATTERN = /^G[A-Z2-7]{55}$/;
const CONTRACT_ID_PATTERN = /^C[A-Z2-7]{55}$/;
const AMOUNT_PATTERN = /^[1-9][0-9]{0,29}$/;

type MintBody = {
  network: string;
  contractId: string;
  destination: string;
  amount: string;
};

function getAdminKeypair(): Keypair | undefined {
  const secret = process.env.TEST_TOKENS_ADMIN_SECRET_KEY;
  return secret ? Keypair.fromSecret(secret) : undefined;
}

function parseBody(body: unknown): MintBody | undefined {
  if (!body || typeof body !== 'object') return undefined;

  const { network, contractId, destination, amount } = body as Record<string, unknown>;

  if (typeof network !== 'string' || !RPC_OVERRIDE_KEYS[network]) return undefined;
  if (typeof contractId !== 'string' || !CONTRACT_ID_PATTERN.test(contractId)) return undefined;
  if (typeof destination !== 'string' || !ACCOUNT_ID_PATTERN.test(destination)) return undefined;
  if (typeof amount !== 'string' || !AMOUNT_PATTERN.test(amount)) return undefined;

  return { network, contractId, destination, amount };
}

function createServer(network: string): rpc.Server {
  const overrideKey = RPC_OVERRIDE_KEYS[network];
  const rpcUrl = process.env[overrideKey] || DEFAULT_RPC_URLS[network];

  return new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}

async function waitForTransaction(server: rpc.Server, hash: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await server.getTransaction(hash);
    if (response.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) return response;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('Timed out waiting for the mint transaction');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const adminKeypair = getAdminKeypair();
    if (!adminKeypair) {
      return res.status(503).json({ message: 'Test-token minting is not configured' });
    }
    return res.status(200).json({ adminPublicKey: adminKeypair.publicKey() });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ message: 'Invalid mint request' });
  }

  const adminKeypair = getAdminKeypair();
  if (!adminKeypair) {
    return res.status(503).json({ message: 'Test-token minting is not configured' });
  }

  let server: rpc.Server;
  try {
    server = createServer(body.network);
    const sourceAccount = await server.getAccount(adminKeypair.publicKey());
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '10000',
      networkPassphrase: body.network,
    })
      .addOperation(
        new Contract(body.contractId).call(
          'mint',
          new Address(body.destination).toScVal(),
          nativeToScVal(BigInt(body.amount), { type: 'i128' }),
        ),
      )
      .setTimeout(60)
      .build();

    const preparedTransaction = await server.prepareTransaction(transaction);
    preparedTransaction.sign(adminKeypair);

    const sendResponse = await server.sendTransaction(preparedTransaction);
    if (sendResponse.status === 'ERROR') {
      return res.status(502).json({ message: 'The mint transaction was rejected' });
    }

    const transactionResponse = await waitForTransaction(server, sendResponse.hash);

    return res.status(200).json({
      status: transactionResponse.status,
      hash: sendResponse.hash,
    });
  } catch (error) {
    console.error(
      '[mint API]',
      error instanceof Error ? error.message : 'Unexpected error while minting',
    );
    return res.status(500).json({ message: 'Unable to mint test tokens' });
  }
}
