/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require('should');
var when = require('when');
var sinon = require('sinon');

var {
    Strategies,
    Users,
    Tokens,
    Clients
} = require('../');

var strategies, users, tokens

const {
    log
} = console

describe('Auth strategies', function () {
    before(function () {
        users = new Users()
        tokens = new Tokens() // adminAuthSettings = {}, _storage
        strategies = new Strategies({
            log: {
                audit: function () {}
            },
            settings: {
                users,
                tokens
            }
        })
    });

    describe('Anonymous Strategy', function () {
        it('Succeeds if anon user enabled', function (done) {
            var userDefault = sinon.stub(users, 'default', function () {
                return when.resolve('anon');
            });
            strategies.anonymousStrategy._success = strategies.anonymousStrategy.success;
            strategies.anonymousStrategy.success = function (user) {
                user.should.equal('anon');
                strategies.anonymousStrategy.success = strategies.anonymousStrategy._success;
                delete strategies.anonymousStrategy._success;
                userDefault.restore();
                done();
            };
            strategies.anonymousStrategy.authenticate({});
        });
        it('Fails if anon user not enabled', function (done) {
            var userDefault = sinon.stub(users, 'default', function () {
                return when.resolve(null);
            });
            strategies.anonymousStrategy._fail = strategies.anonymousStrategy.fail;
            strategies.anonymousStrategy.fail = function (err) {
                err.should.equal(401);
                strategies.anonymousStrategy.fail = strategies.anonymousStrategy._fail;
                delete strategies.anonymousStrategy._fail;
                userDefault.restore();
                done();
            };
            strategies.anonymousStrategy.authenticate({});
        });
    });

    describe('Client Password Strategy', function () {
        it('Accepts valid client', function (done) {
            var testClient = {
                id: 'node-red-editor',
                secret: 'not_available'
            };
            var getClient = sinon.stub(Clients, 'get', function (client) {
                return when.resolve(testClient);
            });

            strategies.clientPasswordStrategy(testClient.id, testClient.secret, function (err, client) {
                try {
                    should.not.exist(err);
                    client.should.eql(testClient);
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getClient.restore();
                }
            });
        });
        it('Rejects invalid client secret', function (done) {
            var testClient = {
                id: 'node-red-editor',
                secret: 'not_available'
            };
            var getClient = sinon.stub(Clients, 'get', function (client) {
                return when.resolve(testClient);
            });

            strategies.clientPasswordStrategy(testClient.id, 'invalid_secret', function (err, client) {
                try {
                    should.not.exist(err);
                    client.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getClient.restore();
                }
            });
        });
        it('Rejects invalid client id', function (done) {
            var getClient = sinon.stub(Clients, 'get', function (client) {
                return when.resolve(null);
            });
            strategies.clientPasswordStrategy('invalid_id', 'invalid_secret', function (err, client) {
                try {
                    should.not.exist(err);
                    client.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getClient.restore();
                }
            });
        });

        var userAuthentication;
        it('Blocks after 5 failures', function (done) {
            userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
                return when.resolve(null);
            });
            for (var z = 0; z < 5; z++) {
                strategies.passwordTokenExchange({}, 'user', 'badpassword', 'scope', function (err, token) {});
            }
            strategies.passwordTokenExchange({}, 'user', 'badpassword', 'scope', function (err, token) {
                try {
                    // log({
                    //     err,
                    //     token
                    // })
                    let errStr = err.message;
                    errStr.should.match(/Too many login attempts/);
                    token.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    userAuthentication.restore();
                }
            });
        });

    });
});
