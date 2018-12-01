const KrakenClient = require('kraken-api')
const sleep = require('sleep-promise')

const krakenWrapper = {
  init(key, secret) {
    this.client = new KrakenClient(key, secret)
    this.maxTries = 100
    // this.counter = new AutoDecCounter(3100)
    this.lastRequestTime = undefined
    this.logLevel = 'debugg'
  },
  log(...args) {
    if (this.logLevel === 'debug') {
      console.log(...args)
    }
  },
  getNextSafeCallTime() {
    if (this.lastRequestTime === undefined) {
      return Date.now()
    }
    const t = this.lastRequestTime + this.counterDecreaseIntervalSeconds * 1000
    this.log('next safe time', t)
    return t
  },
  async waitSafeCallTime() {
    const waitTime = this.getNextSafeCallTime() - Date.now()
    this.log('will wait', waitTime)
    if (waitTime > 0) {
      await sleep(waitTime)
    }
  },
  async overloadProtectedApiCall(...args) {
    this.log('overload protected api call', args)
    await this.waitSafeCallTime()
    this.log('done waiting')
    this.lastRequestTime = Date.now()
    const result = await this.client.api(...args)
    this.log('got res')
    return result
  },
  async api(...args) {
    let nTries = 0
    while (nTries < this.maxTries) {
      nTries += 1
      try {
        const result = await this.overloadProtectedApiCall(...args)
        if (!Array.isArray(result.error) || result.error.length > 0) {
          console.log(`kraken api call (${args}) result.error:\n${result.error}`)
        }
        return result
      }
      catch (err) {
        let msg = `kraken api call ${JSON.stringify(args)} failed`
        if (Object.prototype.hasOwnProperty.call(err, 'statusCode') && err.statusCode === 520) {
          msg += ` with status code: ${err.statusCode}`
          console.log(msg)
        }
        else {
          msg += ` with error:\n${err}`
          console.log(msg)
          // console.log(err)
        }
      }
    }
    const msg = `kraken api call ${JSON.stringify(args)} failed after ${nTries} tries`
    throw new Error(msg)
  },
  async getOpenOrders() {
    const res = await this.api('OpenOrders')
    return res.result.open
  },
  async getBalance() {
    const res = await this.api('Balance')
    return res.result
  },
  async createOrder(order) {
    const addOrderOptions = {
      ...order,
    }
    const res = await this.api('AddOrder', addOrderOptions)
    return res.result
  }
}

module.exports = krakenWrapper