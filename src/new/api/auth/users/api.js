var when = require('when');

var bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}

const {
  log
} = console

class Api {
  constructor() {
    this.users = {};
    this.passwords = {};
    this.defaultUser = null;
  }

  get(username) {
    var user = this.users[username];
    if (!user) {
      log('Api:get no user found for', username)
    }

    return when.resolve(user);
  }

  authenticate() {
    var users = this.users
    var username = arguments[0];
    if (typeof username !== 'string') {
      username = username.username;
    }
    var user = users[username];
    if (user) {
      if (arguments.length === 2) {
        // Username/password authentication
        var password = arguments[1];
        return when.promise(function (resolve, reject) {
          bcrypt.compare(password, passwords[username], function (err, res) {
            resolve(res ? user : null);
          });
        });
      } else {
        // Try to extract common profile information
        if (arguments[0].hasOwnProperty('photos') && arguments[0].photos.length > 0) {
          user.image = arguments[0].photos[0].value;
        }
        return when.resolve(user);
      }
    }
    return when.resolve(null);
  }

  default () {
    return when.resolve(null);
  }
}

module.exports = {
  Api
}
