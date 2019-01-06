const main = require('./main')

async function handler(...args) {
  try {
    await main.handler(...args)
  }
  catch (err) {
    console.error(err)
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  }
  return response
}

exports.handler = handler