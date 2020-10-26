var express = require('express');
var Session = require('express-session');
var {
    google
} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
var request = require('request');
var axios = require('axios');
var queryString = require('query-string');
require('dotenv').config();

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('whitelist.json');
const db = low(adapter);

db.defaults({
    allowed: []
}).write();

const app = express();
app.use(Session({
    secret: 'rdnm23186SecReTT54201!..,öasd',
    resave: true,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');

const stringifiedParams = queryString.stringify({
    client_id: process.env.client_id,
    redirect_uri: process.env.redirect_uri,
    scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
});
const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;


function getOAuthClient() {
    return new OAuth2(process.env.client_id, process.env.client_secret, process.env.redirect_uri);
}

function getAuthUrl() {
    var oauth2Client = getOAuthClient();
    var scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    return url;
}


app.get('/', (req, res) => {
    res.render('login', {
        google_url: getAuthUrl(),
        extra: ''
    });
});

app.get('/authenticate/google', async (req, res) => {
    var oauth2Client = getOAuthClient();
    var session = req.session;
    var code = req.query.code;

    oauth2Client.getToken(code, function (err, tokens) {
        if (!err) {
            oauth2Client.setCredentials(tokens);
            session["tokens"] = tokens;

            if (isValidUser())
                res.render('index');
            else
                res.render('login', {
                    google_url: getAuthUrl(),
                    extra: 'You need a whitelisted account!'
                });
        }
    });
});

async function isValidUser() {

    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session["tokens"]);

    var p = new Promise(function (resolve, reject) {
        plus.google.get({
            userId: 'me',
            auth: oauth2Client
        }, function (err, response) {
            resolve(response || err);
        });
    }).then(function (data) {
        //check whether the current user is whitelisted
        var user = db.get('allowed').find({
            email: data.email
        });

        if (user != undefined) {
            return true;
        } else {
            return false;
        }
    });
}

app.get('/test', (req, res) => {
    request('http://localhost:3000/', {}, (err, response, body) => {
        if (err) {
            console.log(err);
            res.send('test was not successful 😥');
        }
        res.send(body);
    });
});

app.listen(80, () => {
    console.log('WhiskySite listening on port 80!')
});