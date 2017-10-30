const Base = require('./base')

// Credentials middleware

class Credentials extends Base {
  constructor(runtime = {}) {
    super(runtime)
    this.log = runtime.log || console.log
    this.api = runtime.nodes;
  }

  // extract credentials from request and send in response
  process(req, res) {
    this.notYetImplemented('process')
  }

  get(req, res) {
    const {
      log,
      api
    } = this
    // TODO: It should verify the given node id is of the type specified -
    //       but that would add a dependency from this module to the
    //       registry module that knows about node types.
    var nodeType = req.params.type;
    var nodeID = req.params.id;
    log.audit({
      event: "credentials.get",
      type: nodeType,
      id: nodeID
    }, req);
    var credentials = api.getCredentials(nodeID);
    if (!credentials) {
      res.json({});
      return;
    }
    var definition = api.getCredentialDefinition(nodeType);

    var sendCredentials = {};
    for (var cred in definition) {
      if (definition.hasOwnProperty(cred)) {
        if (definition[cred].type == "password") {
          var key = 'has_' + cred;
          sendCredentials[key] = credentials[cred] != null && credentials[cred] !== '';
          continue;
        }
        sendCredentials[cred] = credentials[cred] || '';
      }
    }
    res.json(sendCredentials);
  }
}

Credentials.init = function (runtime) {
  return new Credentials(runtime)
}

module.exports = Credentials
