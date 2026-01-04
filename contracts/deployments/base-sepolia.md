# Base Sepolia Deployment

## Deployer Wallet

**Address:** `0x94E182DA81eCCa26D6ce6B29d99a460C11990725`

⚠️ **Private key stored in GitHub Secrets as `DEPLOYER_PRIVATE_KEY`**

## Funding

Get testnet ETH from these faucets (in order of preference):
- **https://console.optimism.io/faucet** (Best - Superchain ecosystem, works for Base Sepolia)
- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Contracts (Deployed 2026-01-05)

| Contract | Proxy Address | Implementation | Verified |
|----------|---------------|----------------|----------|
| VillaNicknameResolverV2 | [`0xf4648423aC6b3f6328018c49B2102f4E9bA6D800`](https://sepolia.basescan.org/address/0xf4648423ac6b3f6328018c49b2102f4e9ba6d800) | [`0xd959290E5E5f99D1e56765aFcd1c786E9118AAe7`](https://sepolia.basescan.org/address/0xd959290e5e5f99d1e56765afcd1c786e9118aae7) | ✅ |
| BiometricRecoverySignerV2 | [`0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836`](https://sepolia.basescan.org/address/0xdfb55a363bdf549ee5c2e77d0aaac39276ed5836) | [`0xbff139E1db248B60B0BEAA7864Ba180597714D7F`](https://sepolia.basescan.org/address/0xbff139e1db248b60b0beaa7864ba180597714d7f) | ✅ |
| MockGroth16Verifier | [`0x3a4C091500159901deB27D8F5559ACD8a643A12b`](https://sepolia.basescan.org/address/0x3a4c091500159901deb27d8f5559acd8a643a12b) | N/A | ✅ |

### Contract Configuration

| Contract | Setting | Value |
|----------|---------|-------|
| NicknameResolver | Gateway URL | `https://api.villa.cash/ens/resolve` |
| NicknameResolver | Owner | `0x94E182DA81eCCa26D6ce6B29d99a460C11990725` |
| RecoverySigner | Liveness Verifier | `0x3a4C091500159901deB27D8F5559ACD8a643A12b` |
| RecoverySigner | Owner | `0x94E182DA81eCCa26D6ce6B29d99a460C11990725` |

## Deployment Commands

```bash
# From contracts/ directory

# 1. Deploy Nickname Resolver (proxy)
forge script script/DeployProxyNicknameResolver.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify

# 2. Deploy Recovery Signer (proxy)
forge script script/DeployProxyRecoverySigner.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify
```

## Verification

Contracts auto-verify via Basescan API key in GitHub Secrets.

Manual verification:
```bash
forge verify-contract <ADDRESS> VillaNicknameResolverV2 \
  --chain base-sepolia \
  --etherscan-api-key $BASESCAN_API_KEY
```
