const KrakenSafeWrapper = require('kraken-safe-wrapper')
const info = require('debug')('kraken-wrapper:info')
const assert = require('assert')

class KrakenWrapper {
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
    const msg = 'kraken api call OHLC unexpected response format'
    assert.equal(keys.length, 1, msg)
    const result = {
      last: res.last,
      bars: res[keys[0]],
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