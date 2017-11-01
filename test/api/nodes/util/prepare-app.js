var express = require('express');
var bodyParser = require('body-parser');
var sinon = require('sinon');

const routeNames = [
  'getAll',
  'post',
  'getModule',
  'getSet',
  'putModule',
  'putSet',
  'delete'
]

const {
  log
} = console

function prepareApp(opts = {}) {
  let {
    nodes,
    locales
  } = opts
  log('prepareApp', {
    nodes,
    locales
  })

  routeNames.map(name => {
    nodes[name] = nodes[name].bind(nodes)
  })

  // configure server
  let app = express();
  app.use(bodyParser.json());

  // set up routes
  app.get('/nodes', nodes.getAll);
  app.post('/nodes', nodes.post);
  app.get(/\/nodes\/((@[^\/]+\/)?[^\/]+)$/, nodes.getModule);
  app.get(/\/nodes\/((@[^\/]+\/)?[^\/]+)\/([^\/]+)$/, nodes.getSet);
  app.put(/\/nodes\/((@[^\/]+\/)?[^\/]+)$/, nodes.putModule);
  app.put(/\/nodes\/((@[^\/]+\/)?[^\/]+)\/([^\/]+)$/, nodes.putSet);
  app.delete('/nodes/:id', nodes.delete);

  // TODO: we need cleanup, using restore or sth
  sinon.stub(locales, 'determineLangFromHeaders', function () {
    return 'en-US';
  });

  return app
}

module.exports = {
  prepareApp
}
