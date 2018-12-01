const KrakenWrapper = require('./kraken-wrapper/kraken-api-wrapper')
const sleep = require('sleep-promise')
const debug = require('debug')('main')
const fs = require('fs').promises
const tinyCmd = require('tiny-cmd')
const path = require('path')

const key = process.env.KRAKEN_API_KEY
const secret = process.env.KRAKEN_PRIVATE_KEY
kraken = new KrakenWrapper({
  key,
  secret,
  maxTries: +Infinity,
  counterDecIntervalMs: 3000,
  counterLimit: 10,
})

async function checkIfShouldCreateOrder() {
  const orders = await kraken.getOpenOrders()
  const nOrders = Object.keys(orders).length
  if (nOrders > 0) return false
  return true
}

async function prepareOrder(balance, ticker) {
  const order = {
    pair: 'USDTUSD',
    type: undefined,
    ordertype: 'limit',
    price: undefined,
    volume: undefined,
  }
  if (balance.ZUSD > balance.USDT) {
    order.type = 'buy'
    order.price = 0.98
    order.volume = (balance.ZUSD / order.price) - 1
  }
  else {
    order.type = 'sell'
    order.price = 0.99
    order.volume = balance.USDT
  }
  return order
}

async function createOrderIfNeeded() {
  const shouldCreateOrder = await checkIfShouldCreateOrder()
  console.log('shouldCreateOrder', shouldCreateOrder)
  if (!shouldCreateOrder) return

  const balance = await kraken.getBalance()
  console.log('balance', balance)
  const order = await prepareOrder(balance)
  console.log('order', order)
  const orderDescr = await kraken.createOrder(order)
  console.log('created order', orderDescr)
}

async function autoTrade() {
  const intervalSeconds = 1
  let i = 0
  while (true) {
    i += 1
    console.log(i, new Date().toISOString())
    await createOrderIfNeeded()
    await sleep(intervalSeconds * 1000)
  }
}

async function updateBars(pair) {
  const {last, bars} = await kraken.getOhlc(pair, 1)
  const filename = path.join(__dirname, 'data', `${pair}.csv`)
  const cmd = `cd analyzer && pipenv run python update_history.py bars ${filename}`
  const proc = tinyCmd.create(cmd)
  proc.run('')
  proc.on('stdout', data => {
    proc.result += data
  })
  proc.write(JSON.stringify(bars))
  proc.spawned.stdin.end()
  const res = await proc.awaitExit()
  console.log(path.basename(filename), res.replace(/\n$/g, ''), 'lines')
}

async function loop(cb, intervalSeconds, repetitions=Infinity) {
  let i = 0
  while (i < repetitions) {
    await cb(i)
    await sleep(intervalSeconds * 1000)
  }
}

async function barsUpdater() {
  const pairs = ['USDTZUSD', 'XBTUSD', 'ETHXBT']
  await loop(async () => {
    console.log(new Date().toString())
    for (let pair of pairs) await updateBars(pair)
  }, 10*60)
}

async function updateDepth(pair) {
  const depth = await kraken.getMarketDepth(pair)
  const filename = path.join(__dirname, 'data', `${pair}-depth.csv`)
  const cmd = `cd analyzer && pipenv run python update_history.py depth ${filename}`
  const proc = tinyCmd.create(cmd)
  proc.run('')
  proc.on('stdout', data => proc.result += data)
  proc.end(JSON.stringify(depth))
  const res = await proc.awaitExit()
  console.log(path.basename(filename), res.replace(/\n$/g, ''), 'bytes')
}

async function updateBidAsk(pair) {
  const bidAsk = await kraken.getBidAsk(pair)
  console.log(bidAsk)
}

async function main() {
  // autoTrade()
  barsUpdater()
  const pair = 'USDTZUSD'
  loop(() => updateDepth(pair), 60)

  // await updateBidAsk(pair)
  // await updateDepth(pair)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })