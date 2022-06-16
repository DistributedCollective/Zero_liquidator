# Zero liquidator

NodeJs/Typescript Liquidation bot for the Zero protocol.
  It watches the stability pool and triggers batch liquidations. Notifications on successful liquidations or errors are sent via Telegram messenger. A frontend displays all open troves, the bot balance and p/l of liquidation.


## How it works

All relevant information about how the liquidation system on Zero works can be found here
https://github.com/DistributedCollective/zero

To set the protocol addresses go to packages/lib-ethers/deployments/default/mainnet.json


## Testing

Testing requires a full deployment of the Zero protocol with mock-pricefeed set.



## Installation
1. Install packages and build typescript: `yarn`
2. Create `.env` file containing the private key of the bot wallet:
```
PRIVATE_KEY=0x..
```
4. Start bot: yarn start:[mainnet|testnet]
5. To create the frontend run 
```
yarn build-client
```
Visit http://localhost:3005





### Disclaimer
USE THIS CODE AT YOUR OWN RISK! There's no warranty you'll make any profit. Also don't trust any degen devs.