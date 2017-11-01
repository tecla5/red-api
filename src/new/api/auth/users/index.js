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

var when = require('when');
var util = require('util');

const {
    Api
} = require('./api');

class Users {
    constructor(config = {}) {
        var users = {}
        var passwords = {}
        this.users = users;
        this.passwords = passwords;

        var api = new Api()
        this.api = api

        if (config.type == 'credentials' || config.type == 'strategy') {
            if (config.users) {
                if (typeof config.users === 'function') {
                    api.get = config.users;
                } else {
                    var us = config.users;
                    /* istanbul ignore else */
                    if (!util.isArray(us)) {
                        us = [us];
                    }
                    for (var i = 0; i < us.length; i++) {
                        var u = us[i];
                        users[u.username] = {
                            'username': u.username,
                            'permissions': u.permissions
                        };
                        passwords[u.username] = u.password;
                    }
                }
            }
            if (config.authenticate && typeof config.authenticate === 'function') {
                api.authenticate = config.authenticate;
            } else {
                api.authenticate = this.authenticate
            }
        }
        if (config.default) {
            if (typeof config.default === 'function') {
                api.default = config.default;
            } else {
                api.default = function () {
                    return when.resolve({
                        'anonymous': true,
                        'permissions': config.default.permissions
                    });
                }
            }
        }
    }

    get(username) {
        return this.api.get(username)
    }
    authenticate() {
        // FIX: Not sure about this
        return this.api.authenticate.apply(this.api, arguments)
    }
    default () {
        return this.api.default();
    }
};

Users.init = function (config = {}) {
    return new Users(config)
}

module.exports = Users
