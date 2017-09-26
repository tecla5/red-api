const globals = require('../new/globals')
const {
  api,
  runtime
} = globals

console.log({
  globals,
  api
})

const {
  Api,
  Users,
  Tokens
} = api

module.exports = {
  // FIX: not sure this is correct
  instance: new Api(runtime),
  Api,
  Users,
  Tokens
}
