const express = require('express');
var session = require('express-session')

const mustacheExpress = require('mustache-express');
const config = require('../config')

const cors = require('cors');
const sites = require('./web/sites')
const threebot = require('./web/threebot')

var morgan = require('morgan')

var path = require('path')
var rfs = require('rotating-file-stream') 
const auth = require('basic-auth')
const bodyParser = require('body-parser');


let app = express()
app.use(bodyParser.urlencoded({ extended: true }));

// Session
var sess = {
    secret: config.http.session.secret,
    cookie: {},
    resave: true,
    saveUninitialized: true
  }
  
  if (config.nodejs.production) {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }
  
app.use(session(sess))

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');

// logging (rotating fs)
var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, '..', 'logs')
})

app.use(morgan('combined', { stream: accessLogStream }))

// req info
app.use(function (req, res, next) {
  var port = 443
    var host = ""

    if (req.headers.host){
      host = req.headers.host
      var splitted = req.headers.host.split(':')
      if (splitted.length > 1){
          port = splitted[1]
          host = splitted[0]
      }
  }

  if (host === ""){
      return res.status(400).json('Host Header is missing');
  }
  
  if(req.url.startsWith('/threebot')){
    if(req.session.authorized){
      return res.status(201)
    }

    next()
    return
  }

  if(req.url.startsWith('/logout')){
    next()
    return
  }

  

  var info = null

  if(host == 'localhost'){
    info = config.info.websites['threefold'] || config.info.wikis['threefold']
  }
  else{
    info = config.info.domains[host]
    if(!info){
      return res.status(404).send('Not Found')
    }
  }
  
  if(req.url.startsWith('/login')){
    var alias = req.query.next.replace('/', '')
    info = config.info.websites[alias] || config.info.wikis[alias]

  }else if(req.url != '/'){
    var found = false
    for (var alias in config.info.websites){
      if (req.url == `/${alias}` || req.url.startsWith(`/${alias}/`)){
        info = config.info.websites[alias]
        found = true
        break
      }
    }

    if(!found){
      for (var alias in config.info.wikis){
        if (req.url.startsWith(`/info/${alias}`)){
          info = config.info.wikis[alias]
          found = true
          break
        }
      }
    }
    
    // threefold.io/blog   it is not website that is pathprefixed
    if(!found){
      info = Object.assign({}, info) 
      info.subPath = true
    }
  }
  req.info = info
  req.info.host = host
  req.info.port = port
  req.info.secure = req.secure
  next()
  return
})

app.use((req, res, next) => {
  if(req.url.startsWith('/threebot') || req.url.startsWith('/login') || req.url.startsWith('/logout')){
    next()
    return
  }
  var info = req.info
  var requirePassword = false
  var threebotConnect = false
  if (Object.keys(info.acls.secrets).length !== 0){
    requirePassword = true
    req.session.requirePassword = true
    req.session.save()
  }

  if(Object.keys(info.acls.users).length !== 0){
    threebotConnect = true
    req.session.threebotConnect = true
    
    req.session.save()
  }

  if (requirePassword || threebotConnect){  
    if(req.session.authorized || req.url.startsWith('/login?next=')){
      next()
      return
    }else{
      return res.redirect(`/login?next=${req.url}`)
    }
  }else{
    next()
    return
  }
})


// stellar.toml
app.use((req, res, next) => {
  
  if (req.url == '/.well-known/stellar.toml'){
    stellar = `[[CURRENCIES]]
code = "TFT"
issuer = "GBOVQKJYHXRR3DX6NOX2RRYFRCUMSADGDESTDNBDS6CDVLGVESRTAC47"
display_decimals = 2
name = "Threefold Token"
desc = "A digital currency used to buy autonomous and decentralized Internet services (compute, storage, and application) on the ThreeFold Network"
image = "https://raw.githubusercontent.com/threefoldfoundation/www_threefold_io/development/src/favicon.png"

[[CURRENCIES]]
code = "TFTA"
issuer = "GBUT4GP5GJ6B3XW5PXENHQA7TXJI5GOPW3NF4W3ZIW6OOO4ISY6WNLN2"
display_decimals = 2
name = "Threefold Token"
desc = "A digital currency used to buy autonomous and decentralized Internet services (compute, storage, and application) on the ThreeFold Network"
image = "https://raw.githubusercontent.com/threefoldfoundation/www_threefold_io/development/src/favicon.png"
`
    res.set('Content-Type', 'text/plain');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(stellar)
    return
  }
  else{
    next()
  }
})

//ACLS
app.use((req, res, next) => {
  
  if(req.session.authorized && !req.url.startsWith('/logout')){
    var info = req.info
    if(req.session.authorization_mechanism == 'password'){
      var pass = req.session.used_pass
      var acl = info.acls.secrets[pass]
      if(!acl){
        return res.status(401).send(`Un authorized <a href="/logout?next=${req.url}">Login again with different user</>`)
      }
    }else if(req.session.authorization_mechanism == '3bot'){
      var user = req.session.user.profile.doubleName.replace('.3bot', '')
      var acl = info.acls.users[user]
      
      if(!acl){
        return res.status(401).send(`Un authorized <a href="/logout?next=${req.url}">Login again with different user</>`)
      }
    }
  }
  next()
  return
})

app.use(express.json());

app.use(threebot)
app.use(sites);
app.use(cors());

module.exports = app
