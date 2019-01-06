const AWS = require('aws-sdk')
const Debug = require('debug')
const KrakenWrapper = require('./kraken-wrapper/kraken-api-wrapper')

const debug = Debug('lambda')
const debugData = Debug('lambda:data')

const region = 'us-east-2'
AWS.config.update({region});
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

const krakenKey = process.env.KRAKEN_API_KEY
const krakenSecret = process.env.KRAKEN_PRIVATE_KEY
const kraken = new KrakenWrapper({
  key: krakenKey,
  secret: krakenSecret,
  maxTries: 5,
  counterDecIntervalMs: 3000,
  counterLimit: +Infinity,
})


async function handler(event) {
  console.log('event:', event)
  const processPromises = event.pairs.map(pair => processPair(pair))
  await Promise.all(processPromises)
}

const processPair = async (pair) => {
  debug('getData')
  const data = await getData(pair)
  debugData('data:', JSON.stringify(data))

  debug('prepareData')
  const preparedData = prepareData(pair, data)
  debugData('preparedData:', JSON.stringify(preparedData))

  debug('saveData')
  await saveData(preparedData)
  debug('saveData ok')
}

const getData = async (pair) => {
  const { bars } = await kraken.getOhlc(pair, 1)
  return bars
}

const prepareData = (pair, data) => {
  const prepared = data.map(d => {
    const obj = {
      pair,
      ...KrakenWrapper.ohlcResponseToObject(d),
    }
    return obj
  })
  return prepared
}

const saveData = async (data) => {
  const savePromises = data.map(d => saveObjectToDynamo('ohlc', d))
  await Promise.all(savePromises)
}

const saveObjectToDynamo = async (table, obj) => {
  const params = {
    TableName: table,
    Item: convertObjectToDynamoItem(obj),
  }
  await ddb.putItem(params).promise()
  return params
}

const convertObjectToDynamoItem = (obj) => {
  const valToStruct = (val) => {
    const type = typeof val
    switch (type) {
      case 'string': return {S: val}
      case 'number': return {N: String(val)}
      default: return {S: JSON.stringify(val)}
    }
  }
  const item = {}
  Object.keys(obj).forEach(key => {
    item[key] = valToStruct(obj[key])
  })
  return item
}

exports.handler = handler
debug('module required')