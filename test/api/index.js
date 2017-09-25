const globals = require('../new/globals')
const {
  Api,
  Users,
  Tokens
} = globals.api

module.exports = {
  instance: new Api(runtime),
  Users,
  Tokens
}
