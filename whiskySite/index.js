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


const isLoggedIn = (req, res, next) => {
    if (req.user) {
        var user = db.get('allowrd').find({
            email: req.user.email
        })
        if (user != undefined) {
            next()
        } else {
            res.sendStatus(401)
        }
    } else {
        res.sendStatus(401)
    }
}


app.get('/', (req, res) => res.send('You are not logged in! 😐 <br><a href="/google">Login</a>'))
app.get('/failed', (req, res) => res.send('You failed to log in! 😥'))

app.get('/whisky', isLoggedIn, (req, res) => {
    request('http://localhost:3000/', {}, (_err, _res, _body) => {
        if (_err) {
            console.log(_err)
            res.send('there was an error... 😓')
        } else {
            res.send(_body)
        }
    })
})

app.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))
app.get('/authenticate/google', passport.authenticate('google', {
    failureRedirect: '/login'
}), function (req, res) {
    res.redirect('/whisky')
})

app.get('/logout', (req, res) => {
    req.session = null
    req.logout()
    res.redirect('/')
})

app.listen(80, () => {
    console.log('WhiskySite listening on port 80!')
});