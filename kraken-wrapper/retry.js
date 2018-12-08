const debug = require('debug')('retry:info')

const retry = async (fn, checkIfShouldRetry, maxTries=Infinity) => {
  let nTries = 0
  while (nTries < maxTries) {
    nTries += 1
    retry._calls += 1
    try {
      return await fn()
    }
    catch (err) {
      retry._fails += 1
      const shouldRetry = checkIfShouldRetry(err)
      if (shouldRetry) {
        const rate = retry._fails/retry._calls
        debug('retrying', fn.name, 'fails rate:', rate.toFixed(3))
        continue
      }
      const e = new Error(`Rethrowing the "${err.message}" error`)
      e.original = err
      e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' + err.stack
      throw e
    }
  }
}

retry._calls = 0
retry._fails = 0

module.exports = retry