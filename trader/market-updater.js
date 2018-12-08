const sleep = require('sleep-promise')
const debug = require('debug')('updater')
const tinyCmd = require('tiny-cmd')
const path = require('path')
const { expect } = require('chai')

class MarketUpdater {
  constructor(kraken) {
    expect(kraken).to.be.an('object')
    this.kraken = kraken
    this.dataDirPath = path.join(process.cwd(), 'data')
  }

  async updateBars(pair) {
    const {last, bars} = await this.kraken.getOhlc(pair, 1)
    const filename = path.join(this.dataDirPath, `${pair}.csv`)
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

  async barsUpdater() {
    const pairs = ['USDTZUSD', 'XBTUSD', 'ETHXBT']
    while (true) {
      console.log(new Date().toString())
      for (let pair of pairs) await this.updateBars(pair)
      await sleep(60*60*1000)
    }
  }

  async updateDepth(pair) {
    const depth = await this.kraken.getMarketDepth(pair)
    const filename = path.join(this.dataDirPath, `${pair}-depth.csv`)
    const cmd = `cd analyzer && pipenv run python update_history.py depth ${filename}`
    const proc = tinyCmd.create(cmd)
    proc.run('')
    proc.on('stdout', data => proc.result += data)
    proc.end(JSON.stringify(depth))
    const res = await proc.awaitExit()
    console.log(path.basename(filename), res.replace(/\n$/g, ''), 'bytes')
  }

  async updateBidAsk(pair) {
    const bidAsk = await this.kraken.getBidAsk(pair)
    console.log(bidAsk)
  }
}

module.exports = MarketUpdater