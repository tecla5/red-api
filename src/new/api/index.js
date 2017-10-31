var express = require('express');
var bodyParser = require('body-parser');
var util = require('util');
var path = require('path');
var passport = require('passport');
var when = require('when');
var cors = require('cors');

const Comms = require('./comms')
const Credentials = require('./credentials')
const Flow = require('./flow')
const Flows = require('./flows')
const Info = require('./info')
const Library = require('./library')
const Locales = require('./locales')
const Nodes = require('./nodes')
const Theme = require('./theme')
const Ui = require('./ui')

const {
  Auth,
  Clients,
  Permissions,
  Strategies,
  Tokens,
  Users
} = require('./auth')

const {
  log,
  error
} = console

function rebindSingle(obj) {
  let methods = Object.keys(obj)
  methods.map(name => {
    let prop = obj[name]
    if (typeof prop === 'function') {
      // perhaps lookup to check if this is indeed an express routing function!
      obj[name] = obj[name].bind(obj) // bind to self as context (this)
    }
  })
  return obj
}

function rebind(...objects) {
  return objects.map(obj => {
    return rebindSingle(obj)
  })
}

class Api {
  constructor(_server, _runtime = {}) {
    log('Api', {
      _server,
      _runtime
    })

    var runtime = _runtime
    var server = _server
    // FIX: from init legacy init in api/index.js
    this.server = _server;
    this.runtime = _runtime;

    var settings = runtime.settings || {};
    this.settings = settings
    this.i18n = runtime.i18n;
    this.log = runtime.log;

    if (!runtime.log) {
      // throw 'Api: missing runtime log'
      error('Api: missing runtime log', {
        runtime
      })
    }

    if (settings.httpAdminRoot !== false) {

      // FIX: using class constructors
      this.comms = Comms.init(server, runtime);

      var adminApp = express();
      this.adminApp = adminApp

      var auth = Auth.init(runtime);
      this.auth = auth

      var credentials = Credentials.init(runtime);
      this.credentials = credentials

      var flows = Flows.init(runtime);
      this.flows = flows

      var flow = Flow.init(runtime);
      this.flow = flow

      var info = Info.init(runtime);
      this.info = info

      var library = Library.init(adminApp, runtime);
      this.library = library

      var locales = Locales.init(runtime);
      this.locales = locales

      var nodes = Nodes.init(runtime);
      this.nodes = nodes

      // Editor
      if (!settings.disableEditor) {
        log('Api - configure editor')

        // FIX: using class constructor
        var ui = Ui.init(runtime);
        this.ui = ui

        log({
          ui
        })

        var editorApp = express();
        this.editorApp = editorApp

        if (settings.requireHttps === true) {
          editorApp.enable('trust proxy');
          editorApp.use(function (req, res, next) {
            if (req.secure) {
              next();
            } else {
              res.redirect('https://' + req.headers.host + req.originalUrl);
            }
          });
        }
        var ensureRuntimeStarted = this.ensureRuntimeStarted.bind(this)

        editorApp.get('/', ensureRuntimeStarted, ui.ensureSlash, ui.editor);
        editorApp.get('/icons/:module/:icon', ui.icon);
        editorApp.get('/icons/:scope/:module/:icon', ui.icon);

        // FIX: using class constructor
        var theme = new Theme(runtime);
        this.theme = theme

        editorApp.use('/theme', theme.app());
        editorApp.use('/', ui.editorResources);
        adminApp.use(editorApp);
      }
      var maxApiRequestSize = settings.apiMaxLength || '5mb';
      adminApp.use(bodyParser.json({
        limit: maxApiRequestSize
      }));
      adminApp.use(bodyParser.urlencoded({
        limit: maxApiRequestSize,
        extended: true
      }));

      var errorHandler = this.errorHandler.bind(this)

      // FIX: instead use rebind on auth (see below)
      var needsPermission = auth.needsPermission.bind(auth)

      let login = auth.login.bind(auth)

      adminApp.get('/auth/login', login, errorHandler);

      if (settings.adminAuth) {
        if (settings.adminAuth.type === 'strategy') {
          auth.genericStrategy(adminApp, settings.adminAuth.strategy);
        } else if (settings.adminAuth.type === 'credentials') {
          adminApp.use(passport.initialize());
          adminApp.post('/auth/token',
            auth.ensureClientSecret,
            auth.authenticateClient,
            auth.getToken,
            auth.errorHandler
          );
        }
        // FIX: instead use rebind on auth (see below)
        let revoke = auth.revoke.bind(auth)
        adminApp.post('/auth/revoke', needsPermission(''), revoke, errorHandler);
      }
      if (settings.httpAdminCors) {
        var corsHandler = cors(settings.httpAdminCors);
        adminApp.use(corsHandler);
      }

      var flRead = needsPermission('flows.read')

      console.log('/flows route', {
        flRead,
        flGet: flow.get,
        // errorHandler
      })

      // SUPER IMPORTANT!!!
      // FIX: instead use rebind on auth (see below)
      rebind(flows, nodes, credentials, locales, library, info)

      // Flows
      adminApp.get('/flows', needsPermission('flows.read'), flows.get, errorHandler);
      adminApp.post('/flows', needsPermission('flows.write'), flows.post, errorHandler);

      adminApp.get('/flow/:id', needsPermission('flows.read'), flow.get, errorHandler);
      adminApp.post('/flow', needsPermission('flows.write'), flow.post, errorHandler);
      adminApp.delete('/flow/:id', needsPermission('flows.write'), flow.delete, errorHandler);
      adminApp.put('/flow/:id', needsPermission('flows.write'), flow.put, errorHandler);

      // Nodes
      adminApp.get('/nodes', needsPermission('nodes.read'), nodes.getAll, errorHandler);
      adminApp.post('/nodes', needsPermission('nodes.write'), nodes.post, errorHandler);

      adminApp.get(/\/nodes\/((@[^\/]+\/)?[^\/]+)$/, needsPermission('nodes.read'), nodes.getModule, errorHandler);
      adminApp.put(/\/nodes\/((@[^\/]+\/)?[^\/]+)$/, needsPermission('nodes.write'), nodes.putModule, errorHandler);
      adminApp.delete(/\/nodes\/((@[^\/]+\/)?[^\/]+)$/, needsPermission('nodes.write'), nodes.delete, errorHandler);

      adminApp.get(/\/nodes\/((@[^\/]+\/)?[^\/]+)\/([^\/]+)$/, needsPermission('nodes.read'), nodes.getSet, errorHandler);
      adminApp.put(/\/nodes\/((@[^\/]+\/)?[^\/]+)\/([^\/]+)$/, needsPermission('nodes.write'), nodes.putSet, errorHandler);

      adminApp.get('/credentials/:type/:id', needsPermission('credentials.read'), credentials.get, errorHandler);

      adminApp.get('/locales/nodes', locales.getAllNodes, errorHandler);
      adminApp.get(/locales\/(.+)\/?$/, locales.get, errorHandler);

      // Library
      adminApp.post(new RegExp('/library/flows\/(.*)'), needsPermission('library.write'), library.post, errorHandler);
      adminApp.get('/library/flows', needsPermission('library.read'), library.getAll, errorHandler);
      adminApp.get(new RegExp('/library/flows\/(.*)'), needsPermission('library.read'), library.get, errorHandler);


      let readSettings = needsPermission('settings.read')

      // Settings
      console.log('Settings', {
        settings: info.settings,
        readSettings
      })
      adminApp.get('/settings', readSettings, info.settings, errorHandler);

      // Error Handler
      //adminApp.use(errorHandler);
    }
  }

  start() {
    var catalogPath = path.resolve(path.join(__dirname, 'locales'));
    return i18n.registerMessageCatalogs([{
        namespace: 'editor',
        dir: catalogPath,
        file: 'editor.json'
      },
      {
        namespace: 'jsonata',
        dir: catalogPath,
        file: 'jsonata.json'
      },
      {
        namespace: 'infotips',
        dir: catalogPath,
        file: 'infotips.json'
      }
    ]).then(function () {
      comms.start();
    });
  }
  stop() {
    comms.stop();
    return when.resolve();
  }

  errorHandler(err, req, res, next) {
    console.log('errorHandler', {
      // ctx: this
    })
    const {
      log
    } = this

    if (err.message === 'request entity too large') {
      log.error(err);
    } else {
      console.log(err.stack);
    }
    log.audit({
      event: 'api.error',
      error: err.code || 'unexpected_error',
      message: err.toString()
    }, req);
    res.status(400).json({
      error: 'unexpected_error',
      message: err.toString()
    });
  };

  ensureRuntimeStarted(req, res, next) {
    if (!runtime.isStarted()) {
      log.error('Node-RED runtime not started');
      res.status(503).send('Not started');
    } else {
      next();
    }
  }
}

Api.init = function (server, runtime) {
  return new Api(server, runtime)
}

module.exports = {
  Api,
  Comms,
  Credentials,
  Flow,
  Flows,
  Info,
  Library,
  Locales,
  Nodes,
  Theme,
  Ui,

  // auth
  Auth,
  Clients,
  Permissions,
  Strategies,
  Tokens,
  Users
}
