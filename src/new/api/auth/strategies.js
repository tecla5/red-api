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

var BearerStrategy = require('passport-http-bearer').Strategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

var passport = require('passport');
var crypto = require('crypto');
var util = require('util');

var Tokens = require('./tokens');
var Users = require('./users');
var Clients = require('./clients');
var permissions = require('./permissions');

function AnonymousStrategy() {
    passport.Strategy.call(this);
    this.name = 'anon';
}

function anonymousStrategy(users) {
    util.inherits(AnonymousStrategy, passport.Strategy);
    AnonymousStrategy.prototype.authenticate = function (req) {
        var self = this;
        users.default().then(function (anon) {
            if (anon) {
                self.success(anon, {
                    scope: anon.permissions
                });
            } else {
                self.fail(401);
            }
        });
    }
    return AnonymousStrategy
}

class Strategies {
    constructor(runtime = {}) {
        this.log = runtime.log;
        this.bearerStrategy.BearerStrategy = new BearerStrategy(this.bearerStrategy);
        this.clientPasswordStrategy.ClientPasswordStrategy = new ClientPasswordStrategy(this.clientPasswordStrategy);

        console.log('Strategies', {
            runtime,
            settings: runtime.settings
        })

        // Very hacky. There must/should be a better way...
        let settings = runtime.settings
        if (typeof settings === 'object') {
            this.tokens = settings.tokens
            this.users = settings.users
        }

        this.tokens = this.tokens || new Tokens() // adminAuthSettings = {}, _storage
        this.users = this.users || new Users() // config {users, passwords}

        const strategyClazz = anonymousStrategy(this.users)

        this.anonymousStrategy = new strategyClazz()

        this.clients = Clients
        this.loginAttempts = [];
        this.loginSignInWindow = 600000; // 10 minutes
    }

    bearerStrategy(accessToken, done) {
        const {
            log
        } = this

        // is this a valid token?
        let gotToken = this.tokens.get(accessToken)
        console.log('bearerStrategy', {
            gotToken
        })

        gotToken.then(token => {
            console.log('found token', {
                token
            })
            if (token) {
                this.users.get(token.user).then(user => {
                    if (user) {
                        done(null, user, {
                            scope: token.scope
                        });
                    } else {
                        log.audit({
                            event: 'auth.invalid-token'
                        });
                        done(null, false);
                    }
                });
            } else {
                log.audit({
                    event: 'auth.invalid-token'
                });
                done(null, false);
            }
        });
    }

    clientPasswordStrategy(clientId, clientSecret, done) {
        const {
            log
        } = this

        this.clients.get(clientId).then(client => {
            if (client && client.secret == clientSecret) {
                done(null, client);
            } else {
                log.audit({
                    event: 'auth.invalid-client',
                    client: clientId
                });
                done(null, false);
            }
        });
    }

    passwordTokenExchange(client, username, password, scope, done) {
        const {
            users,
            log,
            loginAttempts,
            loginSignInWindow
        } = this
        var now = Date.now();

        this.loginAttempts = this.loginAttempts.filter(logEntry => {
            return logEntry.time + loginSignInWindow > now;
        });
        this.loginAttempts.push({
            time: now,
            user: username
        });

        let attemptCount = 0;
        this.loginAttempts.forEach(logEntry => {
            /* istanbul ignore else */
            if (logEntry.user == username) {
                attemptCount++;
            }
        });
        if (attemptCount > 5) {
            log.audit({
                event: 'auth.login.fail.too-many-attempts',
                username: username,
                client: client.id
            });
            console.log('Too many login attempts!!', {
                attemptCount
            })

            done(new Error('Too many login attempts. Wait 10 minutes and try again'), false);
            return;
        }

        users.authenticate(username, password).then(user => {
            console.log('authenticate', {
                username,
                password,
                user
            })
            if (user) {
                console.log('with user', {
                    user
                })

                if (scope === '') {
                    scope = user.permissions;
                }
                if (permissions.hasPermission(user.permissions, scope)) {
                    this.loginAttempts = loginAttempts.filter(logEntry => {
                        return logEntry.user !== username;
                    });
                    console.log('Tokens.create', {
                        username,
                        id: client.id
                    })
                    Tokens.create(username, client.id, scope).then(tokens => {
                        console.log('tokens created', {
                            tokens
                        })
                        log.audit({
                            event: 'auth.login',
                            username: username,
                            client: client.id,
                            scope: scope
                        });
                        done(null, tokens.accessToken, null, {
                            expires_in: tokens.expires_in
                        });
                    });
                } else {
                    log.audit({
                        event: 'auth.login.fail.permissions',
                        username: username,
                        client: client.id,
                        scope: scope
                    });
                    done(null, false);
                }
            } else {
                console.log('auth: login.fail.credentials', {
                    user
                })

                log.audit({
                    event: 'auth.login.fail.credentials',
                    username: username,
                    client: client.id,
                    scope: scope
                });
                done(null, false);
            }
        });
    }
}

Strategies.init = function (runtime) {
    return new Strategies(runtime)
}

module.exports = Strategies
