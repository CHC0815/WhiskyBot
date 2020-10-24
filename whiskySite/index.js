const express = require('express')
const app = express()

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    let loggedIn = true;
    if(!loggedIn)
        res.render('login', {google_url: 'google.com'})
    else
        res.render('index')
});

app.listen(3000, () => {
    console.log('WhiskySite listening on port 3000!')
});