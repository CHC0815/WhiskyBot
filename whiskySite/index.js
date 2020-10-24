const express = require('express');
const app = express();
const request = require('request');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    let loggedIn = true;
    if (!loggedIn)
        res.render('login', {
            google_url: 'google.com'
        })
    else
        res.render('index')
});

app.get('/test', (req, res) => {
    request('http://localhost:3000/', {}, (err, res, body) => {
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