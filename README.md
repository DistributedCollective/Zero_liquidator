# Zero liquidator

NodeJs/Typescript Liquidation bot for the Zero protocol.
  It watches Lines of credit and triggers batch liquidations. Notifications on successful liquidations or errors are sent via Telegram messenger. A frontend displays all open troves, the bot balance and p/l of liquidation.


## How it works

All relevant information about how the liquidation system on Zero works can be found here
https://github.com/DistributedCollective/zero


Whenever the price drops the bot retrieves a list of troves with a collateral ratio below 110%.
If collateral is below 110% the trove (or many of them) can be liquidated.
The bot calls the liquidate function on the troveManager contract and sends the list of collected addresses as parameter.

To be competitive against other liquidators and to assure the transaction is included in the mempool even if the network is under high load, dynamic gas prices are implemented. They are based on a profit estimation and the current state of the mempool. 

To set the protocol addresses go to packages/lib-ethers/deployments/default/mainnet.json




## Testing

Testing requires a full deployment of the Zero protocol with mock-pricefeed set.



## Installation
1. Install packages and build typescript: `yarn`
2. Create `.env` file containing the private key of the bot wallet:
```
PRIVATE_KEY=0x..
```
3. Create empty folder db
4. Start bot: yarn start:[mainnet|testnet]
5. To create the frontend run 
```
yarn build-client
```
Visit http://localhost:3005





### Disclaimer
USE THIS CODE AT YOUR OWN RISK! There's no warranty you'll make any profit. Also don't trust any degen devs.