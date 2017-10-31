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

var passport = require('passport');
var oauth2orize = require('oauth2orize');

var Strategies = require('./strategies');
var Clients = require('./clients');
var Tokens = require('./tokens');
var Users = require('./users');
var Permissions = require('./permissions');

var Theme = require('../theme');

class Auth {
  constructor(runtime) {
    this.theme = new Theme(runtime)

    var strategies = new Strategies(runtime)
    this.strategies = strategies

    passport.use(strategies.bearerStrategy.BearerStrategy);
    passport.use(strategies.clientPasswordStrategy.ClientPasswordStrategy);
    passport.use(strategies.anonymousStrategy);

    var server = oauth2orize.createServer();
    server.exchange(oauth2orize.exchange.password(strategies.passwordTokenExchange));
    this.server = server

    this.runtime = runtime
    this.settings = runtime.settings || {};
    this.log = runtime.log;
    if (this.settings.adminAuth) {
      this.users = new Users(this.settings.adminAuth);
      this.tokens = new Tokens(this.settings.adminAuth, runtime.storage);
      this.strategies = new Strategies(runtime);
    }
    this.permissions = Permissions
  }

  needsPermission(permission) {
    return (req, res, next) => {
      if (settings && settings.adminAuth) {
        return passport.authenticate(['bearer', 'anon'], {
          session: false
        })(req, res, function () {
          if (!req.user) {
            return next();
          }
          if (permissions.hasPermission(req.authInfo.scope, permission)) {
            return next();
          }
          this.log.audit({
            event: 'permission.fail',
            permissions: permission
          }, req);
          return res.status(401).end();
        });
      } else {
        next();
      }
    }
  }

  ensureClientSecret(req, res, next) {
    if (!req.body.client_secret) {
      req.body.client_secret = 'not_available';
    }
    next();
  }

  authenticateClient(req, res, next) {
    return passport.authenticate(['oauth2-client-password'], {
      session: false
    })(req, res, next);
  }

  getToken(req, res, next) {
    return server.token()(req, res, next);
  }

  login(req, res) {
    const {
      settings,
      theme
    } = this

    console.log('login', {
      ctx: this,
      theme
    })

    var response = {};
    if (settings.adminAuth) {
      if (settings.adminAuth.type === 'credentials') {
        response = {
          'type': 'credentials',
          'prompts': [{
            id: 'username',
            type: 'text',
            label: 'user.username'
          }, {
            id: 'password',
            type: 'password',
            label: 'user.password'
          }]
        }
      } else if (settings.adminAuth.type === 'strategy') {
        response = {
          'type': 'strategy',
          'prompts': [{
            type: 'button',
            label: settings.adminAuth.strategy.label,
            url: '/auth/strategy'
          }]
        }
        if (settings.adminAuth.strategy.icon) {
          response.prompts[0].icon = settings.adminAuth.strategy.icon;
        }
        if (settings.adminAuth.strategy.image) {
          response.prompts[0].image = theme.serveFile('/login/', settings.adminAuth.strategy.image);
        }
      }
      if (theme.context().login && theme.context().login.image) {
        response.image = theme.context().login.image;
      }
    }
    res.json(response);
  }

  revoke(req, res) {
    var token = req.body.token;
    // TODO: audit log
    Tokens.revoke(token).then(() => {
      this.log.audit({
        event: 'auth.login.revoke'
      }, req);
      if (settings.editorTheme && settings.editorTheme.logout && settings.editorTheme.logout.redirect) {
        res.json({
          redirect: settings.editorTheme.logout.redirect
        });
      } else {
        res.status(200).end();
      }
    });
  }

  completeVerify(profile, done) {
    Users.authenticate(profile).then((user) => {
      if (user) {
        Tokens.create(user.username, 'node-red-editor', user.permissions).then(function (tokens) {
          this.log.audit({
            event: 'auth.login',
            username: user.username,
            scope: user.permissions
          });
          user.tokens = tokens;
          done(null, user);
        });
      } else {
        this.log.audit({
          event: 'auth.login.fail.oauth',
          username: typeof profile === 'string' ? profile : profile.username
        });
        done(null, false);
      }
    });
  }


  errorHandler(err, req, res, next) {
    //TODO: audit log statment
    //console.log(err.stack);
    //log.log({level:'audit',type:'auth',msg:err.toString()});
    return server.errorHandler()(err, req, res, next);
  }

  genericStrategy(adminApp, strategy) {
    var session = require('express-session');
    var crypto = require('crypto');
    adminApp.use(session({
      // As the session is only used across the life-span of an auth
      // hand-shake, we can use a instance specific random string
      secret: crypto.randomBytes(20).toString('hex'),
      resave: false,
      saveUninitialized: false
    }));
    //TODO: all passport references ought to be in ./auth
    adminApp.use(passport.initialize());
    adminApp.use(passport.session());

    var options = strategy.options;

    passport.use(new strategy.strategy(options,
      function () {
        var originalDone = arguments[arguments.length - 1];
        if (options.verify) {
          var args = Array.prototype.slice.call(arguments);
          args[args.length - 1] = function (err, profile) {
            if (err) {
              return originalDone(err);
            } else {
              return completeVerify(profile, originalDone);
            }
          };
          options.verify.apply(null, args);
        } else {
          var profile = arguments[arguments.length - 2];
          return completeVerify(profile, originalDone);
        }

      }
    ));

    adminApp.get('/auth/strategy', passport.authenticate(strategy.name));
    adminApp.get('/auth/strategy/callback',
      passport.authenticate(strategy.name, {
        session: false,
        failureRedirect: '/'
      }),
      function (req, res) {
        var tokens = req.user.tokens;
        delete req.user.tokens;
        // Successful authentication, redirect home.
        res.redirect('/?access_token=' + tokens.accessToken);
      }
    );

  }
}

Auth.init = function (runtime) {
  return new Auth(runtime)
}

module.exports = {
  Auth,
  Clients,
  Strategies,
  Tokens,
  Users,
  Permissions
}
