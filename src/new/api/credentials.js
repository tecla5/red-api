const Base = require('./base')

// Credentials middleware

class Credentials extends Base {
  constructor(server, runtime) {
    super(runtime)
  }

  // extract credentials from request and send in response
  process(req, res) {}

  get() {
    // TODO
  }
}

Credentials.init = function (server, runtime) {
  return new Credentials(server, runtime)
}

module.exports = Credentials
