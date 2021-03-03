var url = require('url');
var express = require('express');
var router = express.Router();
var config = require('../../config')

const asyncHandler = require('express-async-handler')

var threebot = require('@threefoldjimber/threefold_login')


router.get('/threebot/connect', asyncHandler(async (req, res) => {
    var next = req.query.next
    const threeFoldAPIHost = 'https://login.threefold.me/';
    const appId = req.headers.host
    const redirectUrl = '/threebot/authorize';

    if (next){
        redirectUrl = redirectUrl + `?next=${next}`
    }

    const login = new threebot.ThreefoldLogin( threeFoldAPIHost,
                                appId,
                                config.threebot.passPhrase,
                                redirectUrl );
    await login.init();
    const state = threebot.generateRandomString();
    req.session.state = state
    req.session.save()
    const loginUrl = login.generateLoginUrl(state);
    res.redirect(loginUrl)
        
}))

router.get('/threebot/authorize', asyncHandler(async (req, res) => {
    var state = req.session.state
    const threeFoldAPIHost = 'https://login.threefold.me/';
    const appId = req.headers.host;
    const redirectUrl = '/threebot/authorize';
    var next = req.query.next ? req.query.next : '/'

    const login = new threebot.ThreefoldLogin( threeFoldAPIHost,
                                appId,
                                config.threebot.passPhrase,
                                redirectUrl );
    
    var uri = req.protocol + '://' + req.get('host') + req.originalUrl;
    try{
        const profileData = await login.parseAndValidateRedirectUrl(new url.URL(uri), state)
        req.session.authorized = true
        req.user = profileData
        req.session.save()
        res.redirect(next)
    }catch(e){
        console.log(e)
        return res.status(200).json(e)
    }

}))

module.exports = router
