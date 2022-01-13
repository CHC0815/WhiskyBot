var AuthApi = require('splitwise-node')


var userOAuthToken, userOAuthTokenSecret
var authApi = new AuthApi("", "")
var userAuthUrl = authApi.getOAuthRequestToken().then(({
    token,
    secret
}) => {
    [userOAuthToken, userOAuthTokenSecret] = [token, secret]
    return apigateway.getUserAuthorisationUrl(token)
})


module.exports = {
    userAuthUrl,
    userOAuthToken,
    userOAuthTokenSecret,
    authApi
}