const KrakenSafeWrapper = require('./kraken-safe-wrapper')
const info = require('debug')('kraken-wrapper:info')
const assert = require('assert')


const unexpectedFormatMsg = 'kraken api call OHLC unexpected response format'

class KrakenWrapper {
  static ohlcResponseToObject(arr) {
    const obj = {
      timestamp: arr[0],
      open: arr[1],
      high: arr[2],
      low: arr[3],
      close: arr[4],
      vwap: arr[5],
      volume: arr[6],
      count: arr[7],
    }
    return obj
  }

  constructor(options) {
    this.client = new KrakenSafeWrapper(options)
  }

  async api(...args) {
    const response = await this.client.api(...args)
    const err = response.error
    const hasError = !Array.isArray(err) || err.length > 0
    if (hasError) {
      info(`kraken api call (${JSON.stringify(args)}) result.error: ${err}`)
    }
    return response.result
  }

  async getOpenOrders() {
    const res = await this.api('OpenOrders')
    return res.open
  }

  async getBalance() {
    const res = await this.api('Balance')
    return res
  }

  async getOhlc(pair, interval, since) {
    const res = await this.api('OHLC', {pair, interval, since})
    const keys = Object.keys(res).filter(key => key !== 'last')
    assert.equal(keys.length, 1, unexpectedFormatMsg)
    const result = {
      last: res.last,
      bars: res[keys[0]],
    }
    return result
  }

  async getMarketDepth(pair, count) {
    const res = await this.api('Depth', {pair, count})
    const keys = Object.keys(res)
    assert.equal(keys.length, 1, unexpectedFormatMsg)
    const bids = res[keys[0]].bids
    const asks = res[keys[0]].asks
    const time = bids.concat(asks).map(bid => bid[2])
      .reduce((acc, t) => Math.max(acc, t), -Infinity)
    const result = {
      time,
      ...res[keys[0]],
    }
    return result
  }

  async getBidAsk(pair, since) {
    const res = await this.api('Spread', {pair, since})
    const keys = Object.keys(res).filter(key => key !== 'last')
    assert.equal(keys.length, 1, unexpectedFormatMsg)
    const result = {
      last: res.last,
      prices: res[keys[0]],
    }
    return result
  }

  async createOrder(order) {
    const addOrderOptions = {
      ...order,
    }
    const res = await this.api('AddOrder', addOrderOptions)
    return res
  }
}

module.exports = KrakenWrapper