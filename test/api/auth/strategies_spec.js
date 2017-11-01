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

describe('Auth strategies', function () {
    before(function () {
        strategies = new Strategies({
            log: {
                audit: function () {}
            }
        })
        users = new Users()
        tokens = new Tokens() // adminAuthSettings = {}, _storage
    });
    describe('Password Token Exchange', function () {
        var userAuthentication;
        afterEach(function () {
            if (userAuthentication) {
                userAuthentication.restore();
                userAuthentication = null;
            }
        });

        it('Handles authentication failure', function (done) {
            userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
                return when.resolve(null);
            });

            strategies.passwordTokenExchange({}, 'user', 'password', 'scope', function (err, token) {
                try {
                    should.not.exist(err);
                    token.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('Handles scope overreach', function (done) {
            userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
                return when.resolve({
                    username: 'user',
                    permissions: 'read'
                });
            });

            strategies.passwordTokenExchange({}, 'user', 'password', '*', function (err, token) {
                try {
                    should.not.exist(err);
                    token.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it.only('Creates new token on authentication success', function (done) {
            userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
                return when.resolve({
                    username: 'user',
                    permissions: '*'
                });
            });
            var tokenDetails = {};

            // stub tokens.create response to resolve to: 123456
            // to ensure expectation is met, always same (fake) token
            var tokenCreate = sinon.stub(tokens, 'create', function (username, client, scope) {
                log('fake Token:create', {
                    username,
                    client
                })
                let accessToken = '123456'
                tokenDetails.username = username;
                tokenDetails.client = client;
                tokenDetails.scope = scope;
                log('returning fake token', accessToken)
                return when.resolve({
                    accessToken
                });
            });

            // FAILS due to:
            //      users.authenticate(username, password)

            // NOT returning an authenticated user :()
            // could be due to Strategies constructor

            // perhaps not initializing users instance correctly?
            //      this.users = new Users()

            // should be
            //      new Users(config)
            // whatever config might/should be!?

            // conclusion: focus on users_spec first

            strategies.passwordTokenExchange({
                id: 'myclient'
            }, 'user', 'password', 'read', function (err, token) {
                try {
                    should.not.exist(err);
                    token.should.equal('123456');
                    tokenDetails.should.have.property('username', 'user');
                    tokenDetails.should.have.property('client', 'myclient');
                    tokenDetails.should.have.property('scope', 'read');
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    tokenCreate.restore();
                }
            });

        });
    });

    describe('Anonymous Strategy', function () {
        it('Succeeds if anon user enabled', function (done) {
            var userDefault = sinon.stub(Users, 'default', function () {
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
            var userDefault = sinon.stub(Users, 'default', function () {
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

    describe('Bearer Strategy', function () {
        it('Rejects invalid token', function (done) {
            var getToken = sinon.stub(Tokens, 'get', function (token) {
                return when.resolve(null);
            });

            strategies.bearerStrategy('1234', function (err, user) {
                try {
                    should.not.exist(err);
                    user.should.be.false();
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getToken.restore();
                }
            });
        });
        it('Accepts valid token', function (done) {
            var getToken = sinon.stub(Tokens, 'get', function (token) {
                return when.resolve({
                    user: 'user',
                    scope: 'scope'
                });
            });
            var getUser = sinon.stub(Users, 'get', function (username) {
                return when.resolve('aUser');
            });

            strategies.bearerStrategy('1234', function (err, user, opts) {
                try {
                    should.not.exist(err);
                    user.should.equal('aUser');
                    opts.should.have.a.property('scope', 'scope');
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getToken.restore();
                    getUser.restore();
                }
            });
        });
        it('Fail if no user for token', function (done) {
            var getToken = sinon.stub(Tokens, 'get', function (token) {
                return when.resolve({
                    user: 'user',
                    scope: 'scope'
                });
            });
            var getUser = sinon.stub(Users, 'get', function (username) {
                return when.resolve(null);
            });

            strategies.bearerStrategy('1234', function (err, user, opts) {
                try {
                    should.not.exist(err);
                    user.should.equal(false);
                    should.not.exist(opts);
                    done();
                } catch (e) {
                    done(e);
                } finally {
                    getToken.restore();
                    getUser.restore();
                }
            });
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
            userAuthentication = sinon.stub(Users, 'authenticate', function (username, password) {
                return when.resolve(null);
            });
            for (var z = 0; z < 5; z++) {
                strategies.passwordTokenExchange({}, 'user', 'badpassword', 'scope', function (err, token) {});
            }
            strategies.passwordTokenExchange({}, 'user', 'badpassword', 'scope', function (err, token) {
                try {
                    err.toString().should.equal('Error: Too many login attempts. Wait 10 minutes and try again');
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
