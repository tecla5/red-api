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
  constructor(config) {
    this.setCredentials(config)
    this.defaultUser = config.defaultUser;
  }

  setCredentials(config) {
    this.users = config.users || {}
    this.passwords = config.passwords || {}
  }

  get(username) {
    var user = this.users[username] // || {}
    // if (!user) {
    //   log('Api:get no user found for', {
    //     username,
    //     users: this.users
    //   })
    // }

    return when.resolve(user);
  }

  authenticate(...args) {
    const {
      users,
      passwords
    } = this

    var username = args[0];
    if (typeof username !== 'string') {
      username = username.username;
    }
    log('authenticate', {
      args,
      username
    })
    var user = users[username];
    if (user) {
      log('authenticate', {
        user
      })
      if (args.length === 2) {
        // Username/password authentication
        var password = args[1];

        log('authenticate: Username/password authentication', {
          password
        })

        return when.promise(function (resolve, reject) {
          let storedUserPassword = passwords[username]
          log('authenticate: bcrypt.compare', {
            password,
            passwords,
            storedUserPassword
          })
          bcrypt.compare(password, storedUserPassword, (err, res) => {
            log('resolve password match', res)
            resolve(res ? user : null);
          });
        });
      } else {
        log('authenticate: extract profile', {
          password
        })
        let profile = args[0]

        // Try to extract common profile information
        if (profile.hasOwnProperty('photos') && profile.photos.length > 0) {
          user.image = profile.photos[0].value;
        }
        return when.resolve(user);
      }
    } else {
      log('no user found for', {
        username,
        users
      })
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
