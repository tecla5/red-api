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

  describe('delete', function () {
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
        .del('/nodes/123')
        .expect(400)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    describe('by module', function () {
      it('uninstalls the module', function (done) {
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
                nodes: [{
                  id: '123'
                }]
              }
            },
            getNodeInfo: function () {
              return null
            },
            uninstallModule: function () {
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
          .del('/nodes/foo')
          .expect(204)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            done();
          });
      });

      it('fails the uninstall if the module is not installed', function (done) {
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
            getNodeInfo: function () {
              return null
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .del('/nodes/foo')
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            done();
          });
      });

      it('fails the uninstall if the module is not installed', function (done) {
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
                nodes: [{
                  id: '123'
                }]
              }
            },
            getNodeInfo: function () {
              return null
            },
            uninstallModule: function () {
              return when.reject(new Error('test error'));
            }
          }
        });
        app = prepareApp({
          nodes,
          locales
        })

        request(app)
          .del('/nodes/foo')
          .expect(400)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            res.body.should.have.property('message', 'Error: test error');
            done();
          });
      });
    });

  });
});
