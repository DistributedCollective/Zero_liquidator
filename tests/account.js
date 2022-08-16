import { Wallet, utils } from 'ethers';

const wallet = Wallet.fromMnemonic(
  utils.entropyToMnemonic(utils.randomBytes(16))
)

console.log('wallet.address:', wallet.address)
console.log('wallet.mnemonic.phrase:', wallet.mnemonic.phrase)
console.log('wallet.privateKey:', wallet.privateKey)