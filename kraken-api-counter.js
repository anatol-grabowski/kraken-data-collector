const sleep = require('sleep-promise')
const EventEmitter = require('events')

class AutoDecCounter {
  constructor(decIntervalMs=3000) {
    this.counter = 0
    this.decIntervalMs = decIntervalMs
    this.timerRunning = false
    this.events = new EventEmitter()
  }

  inc(value) {
    this.counter += value
    // console.log('inc', this.counter)
    this.startDecTimer()
  }

  dec(value) {
    this.counter -= Math.max(value, 0)
    // console.log('dec', this.counter)
    this.events.emit('dec', this.counter)
  }

  async startDecTimer() {
    if (this.timerRunning) return
    this.timerRunning = true
    while (this.counter > 0) {
      await sleep(this.decIntervalMs)
      this.dec(1)
    }
    this.timerRunning = false
  }

  async waitDropTo(value=10) {
    if (this.counter <= value) return
    return new Promise((resolve) => {
      this.events.on('dec', counter => {
        if (counter <= value) resolve()
      })
    })
  }
}

module.exports = AutoDecCounter