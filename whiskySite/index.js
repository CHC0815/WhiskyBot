const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const passport = require('passport')
const cookieSession = require('cookie-session')
require('./passport-setup')
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('whitelist.json');
const db = low(adapter);
const request = require('request')
const https = require('https')
const http = require('http')
var fs = require('fs');

var privateKey = fs.readFileSync('/etc/letsencrypt/live/challenger227.mydhp.de/privkey.pem', 'utf8')
var certificate = fs.readFileSync('/etc/letsencrypt/live/challenger227.mydhp.de/fullchain.pem', 'utf8')
var credentials = {key: privateKey, cert: certificate};
//var AuthApi = require('splitwise-node')
//const splitwise = require('./splitwise')

//initializes the json database and the express app
db.defaults({
    allowed: []
}).write();

app.set('view engine', 'ejs');
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieSession({
    name: 'WhiskySite-Session',
    keys: ['key1', 'key2']
}))
app.use(bodyParser.json())
app.use(passport.initialize())
app.use(passport.session())


//checks if a user is logged in and allowed
//use this to protect a route
const isLoggedIn = (req, res, next) => {
    if (req.user) {
        var user = db.get('allowed').find({
            email: req.user._json.email
        }).value()
        if (user != undefined) {
            req.whiskyUser = user
            next()
        } else {
            res.sendStatus(401)
        }
    } else {
        res.sendStatus(401)
    }
}

//standard routes
app.get('/', (req, res) => res.send('You are not logged in! 😐 <br><a href="/google">Login</a>'))
app.get('/failed', (req, res) => res.send('You failed to log in! 😥'))

/*
app.get('/splitwise', isLoggedIn, (req, res) => {
    var url = splitwise.userAuthUrl()
    return res.send(`<a href="${url}">Click me</a>`)
})*/

app.get('/whisky', isLoggedIn, (req, res) => {
    request('http://localhost:3000/', {}, (_err, _res, _body) => {
        if (_err) {
            console.log(_err)
            res.send('there was an error... 😓')
        } else {
            var db = _body
            // TODO: render each bottle

            db = JSON.parse(db)
            var bottles = db["bottles"]
            
            var whiskyUser = req.whiskyUser
            var params = []

            for (var i = 0; i < bottles.length; i++)
            {
                //current item
                var item = bottles[i]
                //only add bottle if current user is creator of the bottle share
                if(item.userid == whiskyUser.telegramID || whiskyUser.role == "admin")
                {
                    //current bottle
                    var bottle = {
                        whiskyName: item.name,
                        volume: item.volume,
                        level: item.level,
                        id: item.bottleid,
                        whiskyCreator: item.userid
                    }
                    //list of users of the current bottle
                    var users = item["users"]
                    //param object of current bottle
                    var _params = {
                        "bottle": bottle,
                        "users": users,
                    }
                    //push current bottle params to global list
                    params.push(_params)
                }
            }
            res.render('index', {
                "path": __dirname + "/views/whisky.ejs",
                "params": params
            })
        }
    })
})

//google authentification route
app.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))

//google redirect route after authentification
app.get('/authenticate/google', passport.authenticate('google', {
    failureRedirect: '/login'
}), function (req, res) {
    res.redirect('/whisky')
})

//passthrough
app.get('/order/delete/:bottleid/:orderid', (req, res) => {
    var bottleid = req.params.bottleid
    var orderid = req.params.orderid
    request('http://localhost:3000/order/delete/' + bottleid + '/' + orderid, {}, (_err, _res, _body) => {
        if (_err) {
            console.log(_err)
            res.send('there was an error... 😓')
        }else{
            res.send(_body)
        }
    })
})
//passthrough
app.get('/order/ok/:bottleid/:orderid', (req, res) => {
    var bottleid = req.params.bottleid
    var orderid = req.params.orderid
    request('http://localhost:3000/order/ok/' + bottleid + '/' + orderid, {}, (_err, _res, _body) => {
        if (_err) {
            console.log(_err)
            res.send('there was an error... 😓')
        }else{
            res.send(_body)
        }
    })
})

//removes the session to log out a user
app.get('/logout', (req, res) => {
    req.session = null
    req.logout()
    res.redirect('/')
})

//starts the WhiskySite on port 443
var httpsServer = https.createServer(credentials, app)
httpsServer.listen(443, () => {
    console.log("WhiskySite is running on port 443")
})

//starts simple http server
const requestListener = function(req, res) {
    res.writeHead(200)
    res.end('Please Use Https')
}

var httpServer = http.createServer(requestListener)
httpServer.listen(80, () => {
    console.log("Basic http server is running on port 80")
})