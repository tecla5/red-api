/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var BearerStrategy = require('passport-http-bearer').Strategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

var passport = require("passport");
var crypto = require("crypto");
var util = require("util");

var Tokens = require("./tokens");
var Users = require("./users");
var Clients = require("./clients");
var permissions = require("./permissions");

var log;

var loginAttempts = [];
var loginSignInWindow = 600000; // 10 minutes

class AnonymousStrategy extends passport.Strategy {
    constructor() {
        passport.Strategy.call(this);
        this.name = 'anon';
    }

    authenticate(req) {
        var self = this;
        Users.default().then(function (anon) {
            if (anon) {
                self.success(anon, {
                    scope: anon.permissions
                });
            } else {
                self.fail(401);
            }
        })
    }
}

module.exports = class Strategies {
    constructor(runtime) {
        this.log = runtime.log;
        this.bearerStrategy.BearerStrategy = new BearerStrategy(bearerStrategy);
        this.clientPasswordStrategy.ClientPasswordStrategy = new ClientPasswordStrategy(clientPasswordStrategy);
        this.anonymousStrategy = new AnonymousStrategy()
    }

    bearerStrategy(accessToken, done) {
        var log = this.log;
        // is this a valid token?
        Tokens.get(accessToken).then((token) => {
            if (token) {
                Users.get(token.user).then((user) => {
                    if (user) {
                        done(null, user, {
                            scope: token.scope
                        });
                    } else {
                        log.audit({
                            event: "auth.invalid-token"
                        });
                        done(null, false);
                    }
                });
            } else {
                log.audit({
                    event: "auth.invalid-token"
                });
                done(null, false);
            }
        });
    }

    clientPasswordStrategy(clientId, clientSecret, done) {
        var log = this.log;
        Clients.get(clientId).then(function (client) {
            if (client && client.secret == clientSecret) {
                done(null, client);
            } else {
                log.audit({
                    event: "auth.invalid-client",
                    client: clientId
                });
                done(null, false);
            }
        });
    }

    passwordTokenExchange(client, username, password, scope, done) {
        var log = this.log;
        var now = Date.now();
        loginAttempts = loginAttempts.filter((logEntry) => {
            return logEntry.time + loginSignInWindow > now;
        });
        loginAttempts.push({
            time: now,
            user: username
        });
        var attemptCount = 0;
        loginAttempts.forEach((logEntry) => {
            /* istanbul ignore else */
            if (logEntry.user == username) {
                attemptCount++;
            }
        });
        if (attemptCount > 5) {
            log.audit({
                event: "auth.login.fail.too-many-attempts",
                username: username,
                client: client.id
            });
            done(new Error("Too many login attempts. Wait 10 minutes and try again"), false);
            return;
        }

        Users.authenticate(username, password).then((user) => {
            if (user) {
                if (scope === "") {
                    scope = user.permissions;
                }
                if (permissions.hasPermission(user.permissions, scope)) {
                    loginAttempts = loginAttempts.filter((logEntry) => {
                        return logEntry.user !== username;
                    });
                    Tokens.create(username, client.id, scope).then((tokens) => {
                        log.audit({
                            event: "auth.login",
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
                        event: "auth.login.fail.permissions",
                        username: username,
                        client: client.id,
                        scope: scope
                    });
                    done(null, false);
                }
            } else {
                log.audit({
                    event: "auth.login.fail.credentials",
                    username: username,
                    client: client.id,
                    scope: scope
                });
                done(null, false);
            }
        });
    }
}
