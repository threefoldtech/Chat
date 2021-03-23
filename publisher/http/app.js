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

let app = express()

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

  var info = null

 
  if(req.url == '/'){
    info = config.aliases.websites['/'] || config.aliases.wikis['/']
    if(!info){
      return res.status(404).content("No alias found for /")
    }

  }else{
    for (var alias in config.aliases.websites){
      if (req.url.startsWith(`/${alias}`)){
        info = config.aliases.websites[alias]
        break
      }
    }

    for (var alias in config.aliases.wikis){
      if (req.url.startsWith(`/info/${alias}`)){
        info = config.aliases.wikis[alias]
        break
      }
    }

    if(!info){
      info = config.aliases.wikis['/'] || config.aliases.websites['/']
      var splitted = req.url.split("/")
      // var pass = ["flexsearch.json", "favicon.ico"] 
      if(splitted.length == 2){
        const clone = Object.assign({}, info);
        clone.dir = path.join(info.dir,  splitted[1])
        info = clone
      }
    }
  }
  req.info = info
  req.info.host = host
  req.info.port = port
  req.info.secure = req.secure

  if(req.info.login){
    if(!req.session.authorized){
      res.redirect(`/threebot/connect?next=${req.url}`)
    }else{
      if(req.info.users.length > 0 && (!req.info.users.map((u)=>u.replace('.3bot', '')).includes(req.session.user.profile.doubleName.replace('.3bot', '')))){
        return res.status(401).json({"error": "Unauthorized access"})
      }else{
        next()
        return 
      }
    }
  }else{
    next()
    return
  }
})



app.use(express.json());

app.use(threebot)
app.use(sites);
app.use(cors());

module.exports = app
