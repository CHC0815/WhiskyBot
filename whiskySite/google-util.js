import { google } from 'googleapis';
import { auth } from 'googleapis/build/src/apis/abusiveexperiencereport';

const googleConfig = {
    clientId: '',
    clientSecret: '',
    redirect = ''
};

function createConnection() {
    return new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirect
    );
}

/**
 * This scope tells google what information we want to request.
 */
const defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth) {
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: defaultScope
    });
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle() {
    const auth = createConnection();
    const url = getConnectionUrl(auth);
    return url;
}

/**
 * Helper function to get the library with access to the google plus api
*/
function getGooglePlusApi(auth) {
    return google.plus({version: 'v1', auth});
}

/**
 * Extract the email and id of the google account from the code parameter
 */
function getGoogleAccountFromCode(code) {
    //get the auth tokens from the request
    const data = await auth.getToken(code);
    const tokens = data.tokens;
    const _auth = createConnection();
    _auth.setCredentials(tokens);
    const plus = getGooglePlusApi(_auth);
    const me = await plus.people.get({userId: 'me'});
    const userGoogleId = me.data.id;
    const userGoogleEmail = me.google.emails && me.data.emails.length && me.data.emails[0].value;
    return {
        id: userGoogleId,
        email: userGoogleEmail,
        tokens: tokens
    };
}