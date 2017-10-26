const Base = require('./base')

class Communications extends Base {
  constructor(server, runtime) {
    super(runtime)
    this.server = server
  }

  start() {}

  stop() {}

  publish(topic, data, retain) {}
}

Communications.init = function (server, runtime) {
  return new Communications(server, runtime)
}

module.exports = Communications
