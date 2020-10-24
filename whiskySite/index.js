const express = require('express');
const app = express();
const request = require('request');
import * as queryString from 'query-string';
require('dotenv').config();

app.set('view engine', 'ejs');

const stringifiedParams = queryString.stringify({
    client_id: process.env.CLIENT_ID_GOES_HERE,
    redirect_uri: 'https://www.example.com/authenticate/google',
    scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
});
const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;

app.get('/', (req, res) => {
    res.render('login', {
        google_url: googleLoginUrl
    });
});

app.get('/authenticate/google', (req, res) => {
    res.render('index');
});

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