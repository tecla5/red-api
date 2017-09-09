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

var when = require("when");

function generateToken(length) {
    var c = "ABCDEFGHIJKLMNOPQRSTUZWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    var token = [];
    for (var i = 0; i < length; i++) {
        token.push(c[Math.floor(Math.random() * c.length)]);
    }
    return token.join("");
}

module.exports = class Tokens {
    constructor(adminAuthSettings, _storage) {
        this.storage = _storage;
        this.sessionExpiryTime = adminAuthSettings.sessionExpiryTime || 604800; // 1 week in seconds
        // At this point, storage will not have been initialised, so defer loading
        // the sessions until there's a request for them.
        this.loadedSessions = null;
        this.sessions = null;
    }

    expireSessions() {
        var now = Date.now();
        var modified = false;
        for (var t in sessions) {
            if (sessions.hasOwnProperty(t)) {
                var session = sessions[t];
                if (!session.hasOwnProperty("expires") || session.expires < now) {
                    delete sessions[t];
                    modified = true;
                }
            }
        }
        if (modified) {
            return this.storage.saveSessions(sessions);
        } else {
            return when.resolve();
        }
    }

    loadSessions() {
        if (this.loadedSessions === null) {
            this.loadedSessions = storage.getSessions().then((_sessions) => {
                this.sessions = _sessions || {};
                return expireSessions();
            });
        }
        return this.loadedSessions;
    }

    get(token) {
        return this.loadSessions().then(() => {
            var sessionToken = this.sessions[token]
            if (sessionToken) {
                if (sessionToken.expires < Date.now()) {
                    return this.expireSessions().then(() => null)
                }
            }
            return when.resolve(sessionToken);
        });
    }

    create(user, client, scope) {
        return this.loadSessions().then(() => {
            var accessToken = generateToken(128);

            var accessTokenExpiresAt = Date.now() + (this.sessionExpiryTime * 1000);

            var session = {
                user: user,
                client: client,
                scope: scope,
                accessToken: accessToken,
                expires: accessTokenExpiresAt
            };
            this.sessions[accessToken] = session;
            return this.storage.saveSessions(this.sessions).then(() => {
                return {
                    accessToken: accessToken,
                    expires_in: sessionExpiryTime
                }
            });
        });
    }

    revoke(token) {
        return this.loadSessions().then(() => {
            delete this.sessions[token];
            return this.storage.saveSessions(this.sessions);
        });
    }
}
