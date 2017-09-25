const Comms = require('./comms')
const {
  Users,
  Tokens
} = require('./auth')

class Api {
  constructor(runtime) {
    this.comms = new Comms(runtime)
    this.users = new auth.Users(runtime)
  }

  get comms() {
    return this.comms
  }

  // ...
}

module.exports = {
  Api,
  Users,
  Tokens
}
