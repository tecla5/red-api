const Comms = require('./comms')

module.exports = class Api {
  constructor(runtime) {
    this.comms = new Comms(runtime)
  }

  get comms() {
    return this.comms
  }

  // ...
}
