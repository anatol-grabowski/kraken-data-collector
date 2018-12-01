const KrakenWrapper = require('./kraken-wrapper/kraken-api-wrapper')
const sleep = require('sleep-promise')
const debug = require('debug')('main')

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

async function main() {
  const intervalSeconds = 1
  let i = 0
  while (true) {
    i += 1
    console.log(i, new Date().toISOString())
    await createOrderIfNeeded()
    await sleep(intervalSeconds * 1000)
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })