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
  var app, stubbed;
  describe('install', function () {

    it('returns 400 if settings are unavailable', function (done) {
      let {
        nodes,
        locales
      } = initNodes({
        settings: {
          available: function () {
            return false
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })
      request(app)
        .post('/nodes')
        .expect(400)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it('returns 400 if request is invalid', function (done) {
      let {
        nodes,
        locales
      } = initNodes({

        settings: {
          available: function () {
            return true
          }
        }
      });
      app = prepareApp({
        nodes,
        locales
      })

      request(app)
        .post('/nodes')
        .send({})
        .expect(400)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    describe('by module', function () {
      it('installs the module and returns module info', function (done) {
        let {
          nodes,
          locales
        } = initNodes({

          settings: {
            available: function () {
              return true
            }
          },
          nodes: {
            getModuleInfo: function (id) {
              return null;
            },
            installModule: function () {
              return when.resolve({
                name: 'foo',
                nodes: [{
                  id: '123'
                }]
              });
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .post('/nodes')
          .send({
            module: 'foo'
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            res.body.should.have.property('name', 'foo');
            res.body.should.have.property('nodes');
            res.body.nodes[0].should.have.property('id', '123');
            done();
          });
      });

      it('fails the install if already installed', function (done) {
        let {
          nodes,
          locales
        } = initNodes({

          settings: {
            available: function () {
              return true
            }
          },
          nodes: {
            getModuleInfo: function (id) {
              return {
                nodes: {
                  id: '123'
                }
              };
            },
            installModule: function () {
              return when.resolve({
                id: '123'
              });
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .post('/nodes')
          .send({
            module: 'foo'
          })
          .expect(400)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            done();
          });
      });

      it('fails the install if module error', function (done) {
        let {
          nodes,
          locales
        } = initNodes({

          settings: {
            available: function () {
              return true
            }
          },
          nodes: {
            getModuleInfo: function (id) {
              return null
            },
            installModule: function () {
              return when.reject(new Error('test error'));
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .post('/nodes')
          .send({
            module: 'foo'
          })
          .expect(400)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            res.body.should.have.property('message', 'Error: test error');
            done();
          });
      });
      it('fails the install if module not found', function (done) {
        let {
          nodes,
          locales
        } = initNodes({

          settings: {
            available: function () {
              return true
            }
          },
          nodes: {
            getModuleInfo: function (id) {
              return null
            },
            installModule: function () {
              var err = new Error('test error');
              err.code = 404;
              return when.reject(err);
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .post('/nodes')
          .send({
            module: 'foo'
          })
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
});
