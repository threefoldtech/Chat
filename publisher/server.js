const chalk = require("chalk");

const config = require("./config");
const app = require("./http/app.js");
const process = require("process");
const dnsserver = require("./servers/dns");
const letsencrypt = require("./letsencrypt");

async function init() {
  const drive = require("./drive.js");
  const { _, cleanup } = await drive.ensureHyperSpace();
  await drive.load();
  return { _, cleanup };
}

async function main() {
  var host = config.http.host;
  var port = config.http.port;
  var httpport = config.http.port;
  var httpsport = config.http.httpsPort;
  var dnsport = config.dns.port;

  // S

  const { _, cleanup } = await init();

  // DNS

  if (config.development) {
    dnsserver.listen(dnsport);
  } else {
    dnsserver.listen(53);
  }

  console.log(chalk.green(`✓ (DNS Server) : ${dnsport}`));

  // HTTP(s) Server
  process.on("SIGINT", () => {
    cleanup();
    server.close(() => {
      console.log(chalk.green(`✓ (HTTP Server) http://${host}:${httpport}`));
      console.log(chalk.green(`✓ (HTTPS Server) https://${host}:${httpsport}`));
      console.log(chalk.green(`✓ (DNS Server) : ${dnsport}`));
      console.log(chalk.red(`\t✓ closed`));
    });
  });

  if (config.development) {
    const server = app.listen(port, host, () => {
      console.log(chalk.green(`✓ (HTTP Server) : http://${host}:${port}`));
    });
  } else {
    // write new config
    letsencrypt.process();

    require("greenlock-express")
      .init({
        packageRoot: __dirname,
        // contact for security and critical bug notices
        maintainerEmail: "hamdy.a.farag@gmail.com",
        // where to look for configuration
        configDir: "./greenlock.d",
        // whether or not to run at cloudscale
        cluster: false,
      })
      // Serves on 80 and 443
      // Get's SSL certificates magically!
      .serve(app);
  }
}

main();
