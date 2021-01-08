const { apigateway } = require('googleapis/build/src/apis/apigateway')
var AuthApi = require('splitwise-node')

//api key 0sRaXQPTyrWKHlNw2vsQ4PcwsQr4TLjhxojCXK4y

var userOAuthToken, userOAuthTokenSecret
var authApi = new AuthApi("sEkI7SS9dU7M5Mq7gfB2wH4KsuQsYPbrZ8vnb5H4", "IPEiZjZaLHTENfZMl8AbJTpcWA9ewBHFRxPIUprQ")
var userAuthUrl = authApi.getOAuthRequestToken().then(({token, secret}) => {
    [userOAuthToken, userOAuthTokenSecret] = [token, secret]
    return apigateway.getUserAuthorisationUrl(token)
})