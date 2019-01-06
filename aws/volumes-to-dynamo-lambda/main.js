const AWS = require('aws-sdk')
const Debug = require('debug')
const KrakenWrapper = require('./kraken-wrapper/kraken-api-wrapper')

const debug = Debug('volumes-to-dynamo-lambda')
const debugData = Debug('volumes-to-dynamo-lambda:data')

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
  const data = await kraken.getMarketDepth(pair)
  return data
}

const prepareData = (pair, data) => {
  const prepared = {
    pair,
    timestamp: data.time,
    volumes: data,
  }
  return prepared
}

const saveData = async (data) => {
  const params = {
    TableName: 'volumes',
    Item: convertObjectToDynamoItem(data),
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