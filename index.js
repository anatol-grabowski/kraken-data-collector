const sleep = require('sleep-promise')
const KrakenWrapper = require('./kraken-wrapper/kraken-api-wrapper')
const MarketUpdater = require('./trader/market-updater')

const key = process.env.KRAKEN_API_KEY
const secret = process.env.KRAKEN_PRIVATE_KEY
const kraken = new KrakenWrapper({
  key,
  secret,
  maxTries: +Infinity,
  counterDecIntervalMs: 3000,
  counterLimit: 10,
})
const marketUpdater = new MarketUpdater(kraken)

async function main() {
  // autoTrade()
  marketUpdater.barsUpdater()
  const pair = 'USDTZUSD'
  while (true) {
    await marketUpdater.updateDepth(pair)
    await sleep(60*1000)
  }

  // await updateBidAsk(pair)
  // await updateDepth(pair)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })