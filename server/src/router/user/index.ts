const express = require('express');
import mongodbClient from '../../middleware/mongodbClient';
import { OAuthClients } from '../../middleware/oauth_client';
import { nanoid } from 'nanoid'
import OAuthServer from 'express-oauth-server'
const app = express();
const router = express.Router();

app.oauth = new OAuthServer({
    model: require('../../middleware/services/oauth'),
    //useErrorHandler: true,
    //debug: true,
    continueMiddleware: true
}
);

// 現在ログイン中のユーザー情報をハンドリングする
function loadCurrentUser(req) {
    // const User = {id: req.session.passport.user}
    const User = { user_id: 2 }
    return User
}

// 認可エンドポイント GET
// クライアント情報を送信し、エンドユーザー許可画面にクエリ付きでリダイレクトする
router.get('/oauth/authorize', (req, res, next) => {
    /**********************************
    認可エンドポイント パラメータ一覧
    ?response_type=code 必須
    &client_id={クライアントID} 必須
    &redirect_uri={リダイレクトURI} 必須
    &scope={スコープ} 必須
    &state={任意文字列} CSRF防止のため推奨
    ***********************************/
    const authorize_key = nanoid();
    const URI = '/user/authorize'
        + '?response_type=code'
        + '&client_id=' + req.query.client_id
        + '&redirect_uri=' + req.query.redirect_uri
        + '&scope=' + req.query.scope
        + '&state=' + req.query.state;

    res.json(URI);
})

// 認可エンドポイント POST
// 上記で許可されたクエリがPOST送信され、自動で認可コードが発行される
// 認可コードはredirect_uriで指定されたURLにクエリ付きで通知
/* router.post('/oauth/authorize', app.oauth.authorize({//saveAuthorizationCode()の返り値
    authenticateHandler: {
        handle: loadCurrentUser
    }
}), function (req, res, next) {
    console.log(req);
    //return res
    // new OAuthServer時にoptions: {continueMiddleware: true}が呼ばれていなければ読み込まれない
}) */

router.post('/oauth/authorize', function (req, res, next) {
    console.log(req.body);
    //return res
    // new OAuthServer時にoptions: {continueMiddleware: true}が呼ばれていなければ読み込まれない
}, app.oauth.authorize({//saveAuthorizationCode()の返り値
    authenticateHandler: {
        handle: loadCurrentUser
    }
}), function (req, res, next) {
    console.log(req);
    //return res
    // new OAuthServer時にoptions: {continueMiddleware: true}が呼ばれていなければ読み込まれない
})

// トークンエンドポイント POST
// grant_typeがauthorization_codeの場合、
// client_id, client_secret, redirect_uri, 上記で通知された認可コードを送信する
// アクセストークンとリフレッシュトークンが返却される
// grant_typeがrefresh_tokenの場合、
// client_id, client_secret, refresh_tokenを送信する
// 新たなアクセストークンとリフレッシュトークンが返却される
router.post('/oauth/token', app.oauth.token(), (req, res, next) => {//saveTOken()からの返り値
    /***********************************
    トークンエンドポイント パラメータ一覧
    ?grant_type=authorization_code or refresh_token 必須 clientテーブルにgrantカラムとして登録しておくっぽい
    &client_id={クライアントID} 必須
    &client_secret={クライアントシークレット} 必須
    &redirect_uri={リダイレクトURI} authorization_codeの場合必須
    &code={認可コード} 必須 authorization_codeの場合必須
    &refresh_token={リフレッシュトークン} refresh_tokenの場合必須
    ************************************/
    res.json('token') // <--- new OAuthServer時にoptions: {continueMiddleware: true}が呼ばれていなければ読み込まれません
})

// セキュリティで保護されたルート
// headerにAuthorization: Bearer {アクセストークン}を設定することでアクセスできる
router.get('/oauth/secret', app.oauth.authenticate(), (req, res, next) => {//getAccessTOken()からの返り値
    res.json('secret')
})

// クライアント取得確認済
router.get('/oauth/client/:id', (req, res, next) => {
    const user_id = Number(req.params.id);
    mongodbClient((err, client, db) => {
        if (err) {
            client.close();
            res.status(500).json({ message: err.message });
            return next(err);
        }
        db.collection<OAuthClients>('OAuthClients', (err, collection) => {
            collection.findOne({ user_id: user_id }, (err, result) => {
                if (err) {
                    client.close();
                    res.status(500).json({ message: err.message });
                    return next(err);
                }

                if (result == null) {
                    res.status(404).json({ message: 'Not found.' });
                    return next(err);
                } else {
                    res.json(result);
                    client.close();
                }
            })
                ;
        });
    });
});
// クライアント登録確認済
router.post('/oauth/client', (req, res, next) => {
    const client_name = req.body.client_name;
    const client_id = nanoid();
    const client_secret = nanoid();
    const redirect_uri = req.body.redirect_uri;
    const user_id = req.body.user_id;
    console.log(redirect_uri);
    mongodbClient((err, client, db) => {
        if (err) {
            client.close();
            res.status(500).json({ message: err.message });
            return;
        }
        db.collection<OAuthClients>('OAuthClients', (err, collection) => {
            collection.insertOne(
                {
                    client_name: client_name,
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect_uri,
                    user_id: user_id
                },
                (err, result) => {
                    if (err) {
                        client.close();
                        res.status(500).json({ message: err.message });
                        return;
                    }
                    res.json({
                        client_name: client_name,
                        client_id: client_id,
                        client_secret: client_secret,
                        redirect_uri: redirect_uri,
                        user_id: user_id
                    });
                }
            );
        });
    });
});


// クライアント削除確認済
router.delete('/oauth/client/:id', (req, res, next) => {
    const id = req.params.id;

    mongodbClient((err, client, db) => {
        if (err) {
            client.close();
            res.status(500).json({ message: err.message });
            return next(err);
        }

        const collection = db.collection<OAuthClients>('OAuthClients');
        const user_id = Number(req.params.id);
        collection.findOneAndDelete({ user_id: user_id }, (err, result) => {
            if (err) {
                client.close();
                res.status(500).json({ message: err.message });
                return next(err);
            }

            client.close();
            if (result.value == null) {
                res.status(404).json({ message: 'Not Found.' });
            } else {
                res.json({ message: 'Deleted.' });
            }
        });
    });
})

export default router;