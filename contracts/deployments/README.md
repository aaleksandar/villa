# Villa Contracts Deployment Addresses

This directory tracks deployed contract addresses across networks.

## Network Information

| Network | Chain ID | RPC | Block Explorer |
|---------|----------|-----|----------------|
| **Base Sepolia** | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |
| **Base** | 8453 | https://mainnet.base.org | https://basescan.org |
| **Anvil (Local)** | 31337 | http://127.0.0.1:8545 | N/A |

## Deployment Status

### Base Sepolia (84532)
- [ ] MockGroth16Verifier: pending
- [ ] BiometricRecoverySigner: pending
- [ ] VillaNicknameResolver: pending

### Base (8453)
- [ ] Groth16Verifier: TBD (provided by Bionetta)
- [ ] BiometricRecoverySigner: pending
- [ ] VillaNicknameResolver: pending

## Deployment Checklist

### Prerequisites
1. Set `DEPLOYER_PRIVATE_KEY` in `.env` (never commit this!)
2. Ensure deployer wallet has native ETH for gas
3. For BiometricRecoverySigner: Set `GROTH16_VERIFIER_ADDRESS` in `.env`
4. For VillaNicknameResolver: Optionally set `GATEWAY_URL` (defaults to `https://api.villa.cash/ens/resolve`)

### Deployment Steps

#### 1. Deploy to Base Sepolia (Testnet)

**MockGroth16Verifier (for testing):**
```bash
source ~/.zshenv
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url base-sepolia --broadcast --verify
```

**BiometricRecoverySigner:**
```bash
# After deploying MockGroth16Verifier, set GROTH16_VERIFIER_ADDRESS
export GROTH16_VERIFIER_ADDRESS=0x...
source ~/.zshenv
forge script script/Deploy.s.sol:Deploy --rpc-url base-sepolia --broadcast --verify
```

**VillaNicknameResolver:**
```bash
source ~/.zshenv
forge script script/DeployNicknameResolver.s.sol:DeployNicknameResolver --rpc-url base-sepolia --broadcast --verify
```

#### 2. Deploy to Base (Production)

**BiometricRecoverySigner:**
```bash
# Use Bionetta's production Groth16Verifier address
export GROTH16_VERIFIER_ADDRESS=0x...
source ~/.zshenv
forge script script/Deploy.s.sol:Deploy --rpc-url base --broadcast --verify
```

**VillaNicknameResolver:**
```bash
source ~/.zshenv
forge script script/DeployNicknameResolver.s.sol:DeployNicknameResolver --rpc-url base --broadcast --verify
```

### Post-Deployment

1. **Save deployment addresses:**
   - Copy the JSON output from deployment script
   - Save to `deployments/{chainId}.json`
   - Update checkboxes in this README

2. **Verify contracts:**
   - Check contract on block explorer
   - Ensure source code is verified (should happen automatically with `--verify`)
   - Test basic functions (e.g., call `supportsInterface` on resolver)

3. **Update app configuration:**
   - Add addresses to `apps/web/.env.production`
   - Update SDK initialization in `packages/sdk/`

4. **Notify team:**
   - Share addresses in Telegram
   - Update deployment tracking doc
   - Tag release in GitHub

## Security Notes

- **Never commit private keys** - Use `.env` (gitignored)
- **Verify deployer address** - Check balance before deployment
- **Test on testnet first** - Always deploy to Base Sepolia before mainnet
- **Verify source code** - Ensures transparency and trust
- **Monitor gas prices** - Wait for reasonable gas on Base mainnet

## Emergency Procedures

### If deployment fails:
1. Check error message in terminal
2. Verify RPC endpoint is accessible
3. Ensure deployer has sufficient ETH
4. Check that env vars are set correctly
5. For verifier issues: Ensure verifier contract exists at given address

### If wrong address deployed:
1. Do NOT transfer ownership or interact with bad contract
2. Deploy new contract with correct parameters
3. Update all references to use new address
4. Document mistake in deployment log

## Resources

- [Foundry Book - Deployment](https://book.getfoundry.sh/forge/deploying)
- [Base Docs](https://docs.base.org/)
- [Basescan Contract Verification](https://docs.basescan.org/verifying-contracts/overview)
