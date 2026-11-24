import { setTrustline } from 'stellar-react';
import { useContext, useEffect, useState } from 'react';

import { AppContext, SnackbarIconType } from 'contexts';

import { Box, CircularProgress, Stack, Typography } from 'soroswap-ui';
import { CardContent } from 'soroswap-ui';
import { ButtonPrimary } from './Buttons/Button';
import { TextInput } from './Inputs/TextInput';
import WrapStellarAssetModal from './Modals/WrapStellarAssetModal';
import { BodySmall } from './Text';

import { getClassicAssetSorobanAddress } from 'functions/getClassicAssetSorobanAddress';
import { sendNotification } from 'functions/sendNotification';

import BigNumber from 'bignumber.js';
import { getClassicStellarAsset, isAddress, shortenAddress } from 'helpers/address';
import { requiresTrustline } from 'helpers/stellar';
import { getTestTokenAdminPublicKey, mintTestToken } from 'services/mint';

import { useAllTokens } from 'hooks/tokens/useAllTokens';
import { findToken, useToken } from 'hooks/tokens/useToken';
import useGetMyBalances from 'hooks/useGetMyBalances';

export function MintCustomToken() {
  const { sorobanContext, refetch } = useGetMyBalances();
  const { address } = sorobanContext;

  const { SnackbarContext } = useContext(AppContext);
  const { tokensAsMap } = useAllTokens();

  const [buttonText, setButtonText] = useState<string>('Mint custom token');
  const [isMinting, setIsMinting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingTrustline, setIsSettingTrustline] = useState<boolean>(false);
  const [needToSetTrustline, setNeedToSetTrustline] = useState<boolean>(false);
  const [showWrapStellarAssetModal, setShowWrapStellarAssetModal] = useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string | number>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [adminPublicKey, setAdminPublicKey] = useState<string>();

  const { token, needsWrapping, handleTokenRefresh } = useToken(tokenAddress);

  useEffect(() => {
    let cancelled = false;

    getTestTokenAdminPublicKey()
      .then((publicKey) => {
        if (!cancelled) setAdminPublicKey(publicKey);
      })
      .catch(() => {
        if (!cancelled) setAdminPublicKey(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMint = async () => {
    setIsMinting(true);

    try {
      if (!tokenAddress || !tokenAmount || !address) {
        throw new Error('Token address, amount, and connected wallet are required');
      }

      const contractId = token?.contract ?? tokenAddress;
      const response = await mintTestToken({
        network: sorobanContext.activeNetwork,
        contractId,
        destination: address,
        amount: new BigNumber(tokenAmount).shiftedBy(7),
      });

      if (response.status !== 'SUCCESS') {
        throw new Error('Mint transaction did not succeed');
      }

      setIsMinting(false);
      sendNotification(
        `Minted ${tokenAmount} ${shortenAddress(contractId)}`,
        'Minted',
        SnackbarIconType.MINT,
        SnackbarContext,
      );
      refetch();
      setTokenAddress('');
      setTokenAmount('');
      handleTokenRefresh();
    } catch (error) {
      setIsMinting(false);
      sendNotification(
        'Unable to mint the requested token',
        'Mint failed',
        SnackbarIconType.ERROR,
        SnackbarContext,
      );
    }
  };

  const handleSetTrustline = () => {
    if (!adminPublicKey) return;

    setIsSettingTrustline(true);
    setTrustline({
      tokenSymbol: tokenSymbol,
      tokenAdmin: adminPublicKey,
      sorobanContext,
    })
      .then(() => {
        setNeedToSetTrustline(false);
        sendNotification(
          `for ${tokenSymbol}`,
          'Trustline set',
          SnackbarIconType.MINT,
          SnackbarContext,
        );
        setButtonText('Mint custom token');
      })
      .catch(() => {
        sendNotification(
          'Unable to set the trustline',
          'Trustline failed',
          SnackbarIconType.ERROR,
          SnackbarContext,
        );
      })
      .finally(() => {
        setIsSettingTrustline(false);
      });
  };

  const handleSCA = async () => {
    const wrapToken = needsWrapping;
    const setTrustline = wrapToken == false && needToSetTrustline;
    const mintToken = wrapToken == false && needToSetTrustline == false;
    switch (true) {
      case wrapToken:
        setIsLoading(true);
        setShowWrapStellarAssetModal(true);
        setNeedToSetTrustline(true);
        handleTokenRefresh();
        break;
      case setTrustline:
        await handleSetTrustline();
        setNeedToSetTrustline(false);
        handleTokenRefresh();
        break;
      case mintToken:
        handleMint();
        setTokenAmount('');
        setTokenAddress('');
        break;
      default:
        break;
    }
  };

  const handleSubmit = async () => {
    const isSCA = getClassicStellarAsset(tokenAddress);
    if (isSCA) {
      handleSCA();
      return;
    }
    if (needToSetTrustline) {
      handleSetTrustline();
    } else {
      if (isAddress(tokenAddress)) {
        handleMint();
      }
    }
  };

  useEffect(() => {
    const updateTokenInfo = async () => {
      const sorobanAddress = getClassicAssetSorobanAddress(tokenAddress, sorobanContext);
      const newTokenAddress = sorobanAddress ? sorobanAddress : tokenAddress;
      if (isAddress(newTokenAddress)) {
        const tokenInfo = await findToken(newTokenAddress, tokensAsMap, sorobanContext);
        setTokenSymbol(tokenInfo?.code as string);
        const requiresTrust = await requiresTrustline(
          sorobanContext,
          tokenInfo,
          String(tokenAmount),
        );
        if (requiresTrust) {
          setButtonText('Set Trustline');
          setNeedToSetTrustline(true);
        } else if (needsWrapping) {
          setButtonText('Wrap token');
          setNeedToSetTrustline(false);
        } else {
          setButtonText('Mint custom token');
          setNeedToSetTrustline(false);
        }
      } else {
        setButtonText('Mint custom token');
        setNeedToSetTrustline(false);
      }
    };

    updateTokenInfo();
  }, [isMinting, sorobanContext, tokenAddress, tokensAsMap, needsWrapping, tokenAmount]);

  useEffect(() => {
    switch (showWrapStellarAssetModal) {
      case true:
        setIsLoading(true);
        setButtonText('Wrapping token...');
        break;
      case false:
        setTimeout(() => setIsLoading(false), 500);

        break;
    }
  }, [showWrapStellarAssetModal]);

  useEffect(() => {
    switch (isSettingTrustline) {
      case true:
        setIsLoading(true);
        break;
      case false:
        setIsLoading(false);
        break;
    }
  }, [isSettingTrustline]);

  useEffect(() => {
    const sorobanAddress = getClassicAssetSorobanAddress(tokenAddress, sorobanContext);
    const newTokenAddress = sorobanAddress ? sorobanAddress : tokenAddress;
    if (isMinting) {
      setButtonText(`Minting ${shortenAddress(newTokenAddress)}`);
      setIsLoading(true);
      setNeedToSetTrustline(false);
    } else {
      setIsLoading(false);
    }
  }, [isMinting]);

  const getTokensApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api.soroswap.finance';

    return `${base}/api/random_tokens`;
  };
  return (
    <CardContent>
      <WrapStellarAssetModal
        isOpen={showWrapStellarAssetModal}
        asset={token}
        onDismiss={() => {
          setShowWrapStellarAssetModal(false);
          setIsLoading(false);
        }}
        onSuccess={() => {
          setShowWrapStellarAssetModal(false);
          handleTokenRefresh();
        }}
      />
      <Typography gutterBottom variant="h5" component="div">
        {'Mint custom token'}
        <BodySmall>
          This tokens can be found in the{' '}
          <a href={getTokensApiUrl()} style={{ color: '#8866DD' }} target="_blank" rel="noreferrer">
            api
          </a>
        </BodySmall>
      </Typography>
      <Stack spacing={1}>
        <TextInput
          placeholder="Token address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />

        <TextInput
          placeholder="Amount"
          value={tokenAmount}
          isNumeric
          onChange={(e) => {
            const value = e.target.value;
            if (typeof value === 'string' && value.match(/^[0-9]*$/)) {
              setTokenAmount(Number(e.target.value));
            } else {
              setTokenAmount(tokenAmount);
            }
          }}
        />
      </Stack>
      <ButtonPrimary onClick={handleSubmit} disabled={isLoading} style={{ marginTop: '24px' }}>
        <Box display="flex" alignItems="center" gap="6px">
          {buttonText}
          {isLoading && <CircularProgress size="18px" />}
        </Box>
      </ButtonPrimary>
    </CardContent>
  );
}
