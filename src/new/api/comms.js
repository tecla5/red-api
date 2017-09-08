const Base = require('./base')

module.exports = class Communications extends Base {
  constructor(server, runtime) {
    super(runtime)
    this.server = server
  }

  start() {}

  stop() {}

  publish(topic, data, retain) {}
}
