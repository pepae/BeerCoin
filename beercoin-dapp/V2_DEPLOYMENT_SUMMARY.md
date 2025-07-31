# BeerCoin V2 Deployment Summary

## Deployment Information
- **Date**: July 31, 2025
- **Network**: Gnosis Chain (Chain ID: 100)
- **Admin Address**: `0x167B0703Fc797f886Dc914501C9584B809b54758`

## Contract Addresses
- **BeerCoinV2**: `0x9D8bEB1A27Da75528c3F32CA01CBf9620629D7d6`
- **BeerCoinDistributorV2**: `0x5574Ee75c4AF90B7973d66c709cAd3eCC9485E51`

## Contract Configuration
- **Initial Supply**: 0 BEER tokens
- **Base Reward Rate**: 0.001 BEER per second
- **Referrer Multiplier**: 0.5x per referral (50/100)
- **Distribution Status**: Active
- **BeerCoin Owner**: BeerCoinDistributorV2 (for minting capability)
- **Distributor Owner**: Admin address

## Key Changes Made
1. **BeerCoinV2**: 
   - Modified to start with 0 initial supply instead of 1M BEER
   - Only the distributor contract can mint tokens

2. **BeerCoinDistributorV2**:
   - Changed referrer multiplier from 150 (1.5x) to 50 (0.5x per referral)
   - Each referral now gives 0.5x bonus instead of 1.5x total

## Admin Functions Available
The admin can:
- Add/remove trusted users
- Update reward rate
- Update referrer multiplier  
- Toggle distribution on/off
- Send xDAI to users
- Kick users from distribution

## Security Notes
- Private key was used only for deployment and removed from code
- Admin has full control over the distributor contract
- BeerCoin contract ownership transferred to distributor for minting

## Next Steps
1. Use admin panel at `/admin.html` to add trusted users
2. Trusted users can register regular users
3. Users can claim rewards based on time and referral bonuses

## Verification
- Block Explorer: https://gnosisscan.io/
- BeerCoin: https://gnosisscan.io/address/0x9D8bEB1A27Da75528c3F32CA01CBf9620629D7d6
- Distributor: https://gnosisscan.io/address/0x5574Ee75c4AF90B7973d66c709cAd3eCC9485E51
