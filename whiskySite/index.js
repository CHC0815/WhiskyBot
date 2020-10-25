const express = require('express');
const app = express();
const request = require('request');
const axios = require('axios');
const queryString = require('query-string');
require('dotenv').config();

const whitelist = require('./whitelist.json');

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

app.get('/', (req, res) => {
    res.render('login', {
        google_url: googleLoginUrl,
        extra: ''
    });
});

app.get('/authenticate/google', async (req, res) => {
    let code = req.query.code;
    console.log(`Code: ${code}`);
    let isValidUser = false;

    if (code) {
        let accessToken = await getAccesTokenFromCode(code);
        isValidUser = await isValidUser(accessToken);
    }

    if (isValidUser) {
        res.render('index');
    } else {
        res.render('login', {
            google_url: googleLoginUrl,
            extra: 'You need a whitelisted account!'
        });
    }
});

async function getAccesTokenFromCode(code) {
    let data = await axios({
        url: 'https://oauth2.googleapis.com/token',
        method: 'post',
        data: {
            client_id: process.env.client_id,
            client_secret: process.env.client_secret,
            redirect_uri: `${process.env.redirect_uri}`,
            grant_type: 'authorization_code',
            code: code
        }
    });
    console.log(`Data: ${data}`);
    return data.access_token;
}

async function isValidUser(accessToken) {
    let data = await axios({
        url: 'https://www.googleapis.com/aotuh2/v2/userinfo',
        method: 'get',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    console.log(data);

    //check wether the current user is whitelisted
    for (var i = 0; i < whitelist.allowed.length; i++) {
        if (whitelist.allowed[i].email == data.email)
            return true;
    }

    return false;
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