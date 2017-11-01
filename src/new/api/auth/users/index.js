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

const {
    log
} = console

class Users {
    constructor(config = {}) {
        this.users = config.users || {}
        this.passwords = config.passwords || {}

        var api = new Api(config)
        this.api = api

        if (config.type == 'credentials' || config.type == 'strategy') {
            if (config.users) {
                if (typeof config.users === 'function') {
                    api.get = config.users;
                } else {
                    var users = config.users;
                    /* normalize Array */
                    if (!util.isArray(users)) {
                        users = [users];
                    }
                    // TODO: iterate via .map or sth
                    for (var i = 0; i < users.length; i++) {
                        var user = users[i];

                        log('set users and passwords', {
                            user,
                            users
                        })

                        this.users[user.username] = {
                            'username': user.username,
                            'permissions': user.permissions
                        };
                        this.passwords[user.username] = user.password;
                    }
                    log('set users and passwords: DONE', {
                        users: this.users,
                        passwords: this.passwords
                    })
                }
            }

            if (config.authenticate && typeof config.authenticate === 'function') {
                console.log('api: override with custom authenticate function')
                api.authenticate = config.authenticate.bind(api);
            } else {
                console.log('api: use default authenticate function')
                // api.authenticate = this.authenticate.bind(api)
            }
        }

        api.setCredentials({
            users: this.users,
            passwords: this.passwords
        })

        if (config.default) {
            if (typeof config.default === 'function') {
                console.log('api: override with custom default function')
                api.default = config.default.bind(api);
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
    authenticate(...args) {
        // FIX: Not sure about this
        return this.api.authenticate(...args)
    }
    default () {
        return this.api.default();
    }
};

Users.init = function (config = {}) {
    return new Users(config)
}

module.exports = Users
