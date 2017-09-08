# NodeRed Authentication

## clients

The clients supported. Currently supports `editor` and `admin` client apps.

## index

Uses Node [passport](http://passportjs.org/)

- `init(runtime)`
- `needsPermission(permission)`
- `ensureClientSecret(req,res,next)`
- `authenticateClient(req,res,next)`
- `getToken(req,res,next)`
- `errorHandler(err,req,res,next)`
- `login(req,res)`
- `revoke(req,res)`
- `genericStrategy(adminApp,strategy)`

Private utility functions

- `completeVerify(profile,done)`

## permissions

- `hasPermission(userScope,permission)`

## strategies

- `bearerStrategy(accessToken, done)`
- `clientPasswordStrategy(clientId, clientSecret, done)`
- `passwordTokenExchange(client, username, password, scope, done)`
- `AnonymousStrategy` (class)
  - `.authenticate(req)`

## tokens

- `init(adminAuthSettings, _storage)`
- `get(token)`
- `create(user,client,scope)`
- `revoke(token)`

Private utility functions

- `generateToken(length)`
- `expireSessions()`
- `loadSessions()`
