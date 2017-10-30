const Base = require('./base')

const {
  log
} = console

// Flow middleware
class Flow extends Base {
  constructor(runtime = {}) {
    super(runtime)
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

  get(req, res) {
    const {
      log,
      redNodes
    } = this

    var id = req.params.id;
    var flow = redNodes.getFlow(id);
    if (flow) {
      log.audit({
        event: "flow.get",
        id: id
      }, req);
      res.json(flow);
    } else {
      log.audit({
        event: "flow.get",
        id: id,
        error: "not_found"
      }, req);
      res.status(404).end();
    }
  }

  post(req, res) {
    const {
      log,
      redNodes
    } = this

    var flow = req.body;
    redNodes.addFlow(flow).then(function (id) {
      log.audit({
        event: "flow.add",
        id: id
      }, req);
      res.json({
        id: id
      });
    }).otherwise(function (err) {
      log.audit({
        event: "flow.add",
        error: err.code || "unexpected_error",
        message: err.toString()
      }, req);
      res.status(400).json({
        error: err.code || "unexpected_error",
        message: err.toString()
      });
    })
  }

  put(req, res) {
    const {
      log,
      redNodes
    } = this

    var id = req.params.id;
    var flow = req.body;
    try {
      redNodes.updateFlow(id, flow).then(function () {
        log.audit({
          event: "flow.update",
          id: id
        }, req);
        res.json({
          id: id
        });
      }).otherwise(function (err) {
        log.audit({
          event: "flow.update",
          error: err.code || "unexpected_error",
          message: err.toString()
        }, req);
        res.status(400).json({
          error: err.code || "unexpected_error",
          message: err.toString()
        });
      })
    } catch (err) {
      if (err.code === 404) {
        log.audit({
          event: "flow.update",
          id: id,
          error: "not_found"
        }, req);
        res.status(404).end();
      } else {
        log.audit({
          event: "flow.update",
          error: err.code || "unexpected_error",
          message: err.toString()
        }, req);
        res.status(400).json({
          error: err.code || "unexpected_error",
          message: err.toString()
        });
      }
    }
  }

  delete(req, res) {
    const {
      log,
      redNodes
    } = this

    var id = req.params.id;
    try {
      redNodes.removeFlow(id).then(function () {
        log.audit({
          event: "flow.remove",
          id: id
        }, req);
        res.status(204).end();
      })
    } catch (err) {
      if (err.code === 404) {
        log.audit({
          event: "flow.remove",
          id: id,
          error: "not_found"
        }, req);
        res.status(404).end();
      } else {
        log.audit({
          event: "flow.remove",
          id: id,
          error: err.code || "unexpected_error",
          message: err.toString()
        }, req);
        res.status(400).json({
          error: err.code || "unexpected_error",
          message: err.toString()
        });
      }
    }
  }
}

Flow.init = function (runtime) {
  return new Flow(runtime)
}

module.exports = Flow
