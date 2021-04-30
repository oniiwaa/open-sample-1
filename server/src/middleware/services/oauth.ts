const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise
const dbname = 'open-sample'
mongoose.connect(`mongodb://localhost:27017/${dbname}`, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

// Schema definitions.

mongoose.model('User', new Schema({
  user_id: { type: Number },
  email: { type: String },
  password: { type: String },
}));

mongoose.model('OAuthClients', new Schema({
  client_name: { type: String },
  client_id: { type: String },
  client_secret: { type: String },
  redirect_uri: { type: String },
  user_id: { type: Number }

}));

mongoose.model('OAuthAuthorizationCode', new Schema({
  code: { type: String },
  scope: { type: String },
  expires_at: { type: Date },
  redirect_uri: { type: String },
  user_id: { type: Number }

}));

mongoose.model('OAuthToken', new Schema({
  accessToken: { type: String },
  expires_at: { type: String },
  scope: { type: String },  // `client` and `user` are required in multiple places, for example `getAccessToken()`
  client_id: { type: String },
  user_id: { type: Number },
}));

mongoose.model('OAuthRefreshToken', new Schema({
  refresh_token: { type: String },
  expires_at: { type: String },
  scope: { type: String },
  client_id: { type: String },
  user_id: { type: Number },
}));

const UserModel = mongoose.model('User', 'User', 'User');
const OAuthClientModel = mongoose.model('OAuthClients', 'OAuthClients', 'OAuthClients');
const OAuthAuthorizationCodeModel = mongoose.model('OAuthAuthorizationCode');
const OAuthTokenModel = mongoose.model('OAuthToken');
const OAuthRefreshTokenModel = mongoose.model('OAuthRefreshToken');

// アクセストークンの取得get('/oauth/secret)にreturn
module.exports.getAccessToken = (accessToken) => {
  // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
  return OAuthTokenModel.findOne({ accessToken: accessToken })
    .then(result => {
      const token = function (input) {
        return new Promise(resolve => {
          resolve(input)
        })
      }
      const client = function (input) {
        return new Promise(resolve => {
          OAuthClientModel.findOne({ client_id: result.client_id })
            .then(result => {
              resolve(result)
            })
        })
      }

      const user = function (input) {
        return new Promise(resolve => {
          UserModel.findOne({ id: result.user_id })
            .then(result => {
              resolve(result)
            })
        })
      }

      return Promise.all([
        token(result),
        client(result),
        user(result)
      ])
    }).spread((token, client, user) => {
      return {
        accessToken: token.access_token,
        accessTokenExpiresAt: token.expires_at,
        scope: token.scope,
        client: { id: client.client_id },
        user: { id: user.id }
      }
    })
}


// 認可コードの取得
module.exports.getAuthorizationCode = function (authorizationCode) {
  return OAuthAuthorizationCodeModel.findOne({
    code: authorizationCode
  }).then(result => {
    const authorization_code = function (input) {
      return new Promise(resolve => {
        resolve(input)
      })
    }
    const client = function (input) {
      return new Promise(resolve => {
        OAuthClientModel.findOne({
          client_id: result.client_id
        }).then(result => {
          resolve(result)
        })
      })
    }

    const user = function (input) {
      return new Promise(resolve => {
        UserModel.findOne({
          id: result.user_id
        }).then(result => {
          resolve(result)
        })
      })
    }

    return Promise.all([
      authorization_code(result),
      client(result),
      user(result)
    ])
  }).spread((authorization_code, client, user) => {
    return {
      code: authorization_code.code,
      expiresAt: authorization_code.expires_at,
      redirectUri: authorization_code.redirect_uri,
      scope: authorization_code.scope,
      client: { id: client.client_id },
      user: { id: user.id }
    }
  })
}

// クライアントの取得

module.exports.getClient = function (request) {
  console.log(request);//requestが出力されてほしいが、clientIdの値が出力される
 // let params = { client_id: clientId, redirect_uri: redirectUri };
  return OAuthClientModel.findOne({
    client_id: request
  }).lean().then(result => {
    if (!result) {
      return null
    }
    const redirect_uri = result.redirect_uri;
    const client = {
      id: result.client_id,
      redirectUris: [redirect_uri],
      grants: ['authorization_code', 'refresh_token']
    }
    return client
  })
}
/* module.exports.getClient =(request)=>{
  //requestにredirect_uriが入っていない
  console.log(request);
} */

module.exports.getUser = (request) => {
  console.log(request);
}

// リフレッシュトークンの取得

module.exports.getRefreshToken = (refreshToken) => {
  return OAuthRefreshTokenModel.findOne({
    refresh_token: refreshToken
  }).then(result => {
    const token = function (input) {
      return new Promise(resolve => {
        resolve(input)
      })
    }
    const client = function (input) {
      return new Promise(resolve => {
        OAuthClientModel.findOne({
          client_id: result.client_id
        }).then(result => {
          resolve(result)
        })
      })
    }

    const user = function (input) {
      return new Promise(resolve => {
        UserModel.findOne({
          id: result.user_id
        }).then(result => {
          resolve(result)
        })
      })
    }
    return Promise.all([
      token(result),
      client(result),
      user(result)
    ])
  }).spread((token, client, user) => {
    return {
      refreshToken: token.refresh_token,
      refreshTokenExpiresAt: token.expires_at,
      client: { id: client.client_id },
      user: { id: user.id }
    }
  })
}

// 認可コードの取り消し
module.exports.revokeAuthorizationCode = function (authorizationCode) {
  return OAuthAuthorizationCodeModel.destroy({
    code: authorizationCode.code
  }).then(result => {
    return !!result
  })
}

// トークンの取り消し
module.exports.revokeToken = function (token) {
  return OAuthRefreshTokenModel.destroy({
    refresh_token: token.refreshToken
  }).then(result => {
    return !!result
  })
}

// 認可コードの生成
module.exports.saveAuthorizationCode = function (code, client, user) {
  let authCode = {
    code: code.authorizationCode,
    expires_at: code.expiresAt,
    redirect_uri: code.redirectUri,
    scope: code.scope,
    client_id: client.id,
    user_id: user.id
  }
  return OAuthAuthorizationCodeModel.create(authCode)
    .then(authorizationCode => {
      return {
        authorizationCode: authorizationCode.code,
        expiresAt: authorizationCode.expires_at,
        redirectUri: authorizationCode.redirect_uri,
        scope: authorizationCode.scope,
        client: { id: authorizationCode.client_id },
        user: { id: authorizationCode.user_id }
      }
    })
}

// アクセストークンの生成
module.exports.saveToken = function (token, client, user) {
  let accessToken = null;
  let refreshToken = null;
  let fns = [accessToken, refreshToken]
  fns = [
    new Promise(resolve => {
      OAuthTokenModel.create({
        access_token: token.accessToken,
        expires_at: token.accessTokenExpiresAt,
        scope: token.scope,
        client_id: client.id,
        user_id: user.id,
      }).then(result => {
        resolve(result)
      })
    }),
    new Promise(resolve => {
      OAuthRefreshTokenModel.create({
        refresh_token: token.refreshToken,
        expires_at: token.refreshTokenExpiresAt,
        scope: token.scope,
        client_id: client.id,
        user_id: user.id,
      }).then(result => {
        resolve(result)
      })
    })
  ]

  return Promise.all(fns)
    .then(([accessToken, refreshToken]) => {
      return {
        accessToken: accessToken.access_token,
        accessTokenExpiresAt: accessToken.expires_at,
        refreshToken: refreshToken.refresh_token,
        refreshTokenExpiresAt: refreshToken.expires_at,
        scope: accessToken.scope,
        client: { id: accessToken.client_id },
        user: { id: accessToken.user_id }
      }
    })
}

// scopeのベリファイ
module.exports.verifyScope = function (token, scope) {
  if (!token.scope) {
    return false
  }
  let requestedScopes = scope.split(' ')
  let authorizedScopes = token.split(' ')
  return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0)
}