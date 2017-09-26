const Base = require('./base')

// Credentials middleware

module.exports = class Credentials extends Base {
  constructor(server, runtime) {
    super(runtime)
  }

  // extract credentials from request and send in response
  process(req, res) {}

  get() {
    // TODO
  }
}
