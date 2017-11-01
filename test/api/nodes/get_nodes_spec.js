const {
  log,
  api,
  initNodes,
  should,
  request,
  sinon,
  when,
  prepareApp
} = require('./util')

describe('nodes api', function () {
  let app, stubbed

  // FIX: TODO
  // any of these it tests run on its own (via it.only) , passes
  // the PROBLEM is some global side effect.
  // Bad test infradtructure!!!
  describe('get nodes', function () {
    it('returns node list', function (done) {
      let {
        nodes,
        locales
      } = initNodes({
        nodes: {
          getNodeList: function () {
            return [1, 2, 3];
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })
      request(app)
        .get('/nodes')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          let {
            body
          } = res
          body.should.be.an.Array();
          body.should.have.lengthOf(3);
          done();
        });
    });

    it('returns node configs', function (done) {
      let {
        nodes,
        locales
      } = initNodes({
        nodes: {
          getNodeConfigs: function () {
            return '<script></script>';
          }
        },
        i18n: {
          determineLangFromHeaders: function () {}
        }
      });
      app = prepareApp({
        nodes,
        locales
      })
      request(app)
        .get('/nodes')
        .set('Accept', 'text/html')
        .expect(200)
        .expect('<script></script>')
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it('returns node module info', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        nodes: {
          getModuleInfo: function (id) {
            return {
              'node-red': {
                name: 'node-red'
              }
            }[id];
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .get('/nodes/node-red')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          res.body.should.have.property('name', 'node-red');
          done();
        });
    });

    it('returns 404 for unknown module', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        nodes: {
          getModuleInfo: function (id) {
            return {
              'node-red': {
                name: 'node-red'
              }
            }[id];
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .get('/nodes/node-blue')
        .expect(404)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it('returns individual node info', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        nodes: {
          getNodeInfo: function (id) {
            return {
              'node-red/123': {
                id: 'node-red/123'
              }
            }[id];
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .get('/nodes/node-red/123')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          res.body.should.have.property('id', 'node-red/123');
          done();
        });
    });

    it('returns individual node configs', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        nodes: {
          getNodeConfig: function (id) {
            return {
              'node-red/123': '<script></script>'
            }[id];
          }
        },
        i18n: {
          determineLangFromHeaders: function () {}
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .get('/nodes/node-red/123')
        .set('Accept', 'text/html')
        .expect(200)
        .expect('<script></script>')
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it('returns 404 for unknown node', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        nodes: {
          getNodeInfo: function (id) {
            return {
              'node-red/123': {
                id: 'node-red/123'
              }
            }[id];
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .get('/nodes/node-red/456')
        .set('Accept', 'application/json')
        .expect(404)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });
  });
});
