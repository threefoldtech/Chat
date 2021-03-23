const express = require("express");
const mustacheExpress = require("mustache-express");

const cors = require("cors");
const drive = require("./api/drive");
const sites = require("./web/sites");

let app = express();

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");

// logging (rotating fs)
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "..", "logs"),
});

app.use(morgan("combined", { stream: accessLogStream }));

// req info
app.use(function (req, res, next) {
  var port = 443;
  var host = "";

  if (req.headers.host) {
    host = req.headers.host;
    var splitted = req.headers.host.split(":");
    if (splitted.length > 1) {
      port = splitted[1];
      host = splitted[0];
    }
  }

  if (host === "") {
    return res.status(400).json("Host Header is missing");
  }

  if (req.url.startsWith("/threebot")) {
    if (req.session.authorized) {
      return res.status(201);
    }
    next();
    return;
  }

  var info = null;

  for (var alias in config.aliases.websites) {
    if (alias == "/") {
      info = config.aliases.websites["/"];
      break;
    }
  }

  if (req.url == "/") {
    if (!info) {
      for (var alias in config.aliases.wikis) {
        if (alias == "/") {
          info = config.aliases.wikis["/"];
          break;
        }
      }
    }
  } else {
    for (var alias in config.aliases.websites) {
      if (req.url.startsWith(`/${alias}`)) {
        info = config.aliases.websites[alias];
        break;
      }
    }

    for (var alias in config.aliases.wikis) {
      if (req.url.startsWith(`/info/${alias}`)) {
        info = config.aliases.wikis[alias];
        break;
      }
    }
  }

  if (!info) {
    return res.status(404).json("");
  }
  req.info = info;
  req.info.host = host;
  req.info.port = port;
  req.info.secure = req.secure;

  if (req.info.login) {
    if (!req.session.authorized) {
      res.redirect(`/threebot/connect?next=${req.url}`);
    } else {
      if (
        req.info.users.length > 0 &&
        !req.info.users
          .map((u) => u.replace(".3bot", ""))
          .includes(req.session.user.profile.doubleName.replace(".3bot", ""))
      ) {
        return res.status(401).json({ error: "Unauthorized access" });
      } else {
        next();
        return;
      }
    }
  } else {
    next();
    return;
  }
});

app.use(express.json());

app.use(threebot);
app.use(sites);
app.use(cors());

module.exports = app;
