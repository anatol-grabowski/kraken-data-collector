const KrakenClient = require('kraken-api')
const AutoDecCounter = require('auto-dec-counter')
const debug = require('debug')('kraken-safe-wrapper:debug')
const retry = require('./retry')

class KrakenSafeWrapper {
  constructor({key, secret, maxTries=1, counterDecIntervalMs=3000, counterLimit=10}) {
    this.client = new KrakenClient(key, secret)
    this.maxTries = maxTries
    this.counter = new AutoDecCounter(counterDecIntervalMs)
    this.counterLimit = counterLimit
  }

  async overloadProtectedApiCall(...args) {
    debug('api call', args)
    while (this.counter.value > 10) {
      await this.counter.waitUpdate()
    }
    debug('done waiting', args)
    this.counter.inc(2)
    const resp = await this.client.api(...args)
    debug('got resp')
    return resp
  }

  async api(...args) {
    const checkIfShouldRetry = (error) => {
      if (typeof error !== 'object') return false
      if (error.statusCode === 520) return true
      const timeoutErr = error.name === 'RequestError' && error.code === 'ETIMEDOUT'
      if (timeoutErr) return true
      return false
    }
    const fn = this.overloadProtectedApiCall.bind(this, ...args)
    return await retry(fn, checkIfShouldRetry, this.maxTries)
  }
}

module.exports = KrakenSafeWrapper