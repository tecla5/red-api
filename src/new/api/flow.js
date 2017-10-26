const Base = require('./base')

// Flow middleware

class Flow extends Base {
  constructor(server, runtime) {
    super(runtime = {})

    this.settings = runtime.settings;
    this.redNodes = runtime.nodes;
    this.log = runtime.log;
  }

  // extract Flow from request and send in response
  process(req, res) {
    this.id = req.params.id;
    this.flow = req.body;
    return this
  }

  // TODO: use built in Promises via await/async or then/catch

  get() {
    return this.redNodes.getFlow(this.id)
  }

  post(req, res) {
    return this.redNodes.addFlow(this.flow)
  }

  put(req, res) {
    return this.redNodes.updateFlow(this.id, this.flow)
  }

  delete(req, res) {
    return this.redNodes.removeFlow(this.id)
  }
}

Flow.init = function (server, runtime) {
  return new Flow(server, runtime)
}

module.exports = Flow
