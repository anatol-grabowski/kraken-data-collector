const sleep = require('sleep-promise')
const debug = require('debug')('trader')

class Trader {
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
}

module.exports = Trader