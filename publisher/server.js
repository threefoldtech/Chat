
const chalk = require('chalk');
const process = require('process');

const config = require('./config')
const localDrive = require('./drive/local')
const hyperdrive = require('./drive/hyperdrive');
const utils = require('./drive/utils')
const dnsserver = require("./servers/dns")
var rewrite = require('./rewrite')

const letsencrypt = require('./letsencrypt')

var inited = false

async function init(){
    var old_config = Object.assign({}, config.info) 
    var old_letsencrypt = Object.assign({}, letsencrypt) 

    try{
      var domainsList = []

      await config.load()
      await rewrite.load()

      domainsList.push(...await localDrive.load())
      
      var cleanup = function () {}

      if(config.hyperdrive.enabled){
        const {_, cleanup } = await hyperdrive.start();
        domainsList.push(...await hyperdrive.load())
      }
      var info = await utils.reduce(domainsList)
      
      config.info = info

      // write new greenlock config
      await letsencrypt.process()

      // re read letsencrypt config if we are reloading
      // inited = false, means first time running server, the following
      // block of code will be executed by functon main any ways
      // so no need here
      if(inited){
        if (config.nodejs.production){
          require('greenlock-express').init({
            packageRoot: __dirname,
            // contact for security and critical bug notices
            maintainerEmail: "hamdy.a.farag@gmail.com",
            // where to look for configuration
            configDir: './greenlock.d',
            // whether or not to run at cloudscale
            cluster: false
          })
        }
      }
      
      
      inited = true
      return cleanup

    }catch(e){
      config.info = old_config
      letsencrypt = old_letsencrypt

      if (config.nodejs.production){
        require('greenlock-express').init({
          packageRoot: __dirname,
          // contact for security and critical bug notices
          maintainerEmail: "hamdy.a.farag@gmail.com",
          // where to look for configuration
          configDir: './greenlock.d',
          // whether or not to run at cloudscale
          cluster: false
        })
      }

      if(!inited){
        throw new Error(e)
      }

      console.log("An error happened during an attempt to reload configuration")
      console.log("One or more sites/wikis may contain malformed .domains, .repo, .roles, .acls files")
      console.log("going back to to old configuration")
      console.log(e)
    }

    

}

async function main(){
  
    var cleanup = await init().catch((e)=>{console.log(e);process.exit(0)})

    if(config.dns.enabled){
      
      if (config.nodejs.production){
        config.dns.port = 53
      }

      console.log(chalk.green(`✓ (DNS Server) : ${config.dns.port}`));
      dnsserver.listen(config.dns.port);
    }

    // HTTP(s) Server
    var server = null
    process.on('SIGINT', () => {
        cleanup()
        dnsserver.close()
        server.close(() => {
            console.log(chalk.red(`✓ ALL Closed `));
        })
    })

    // custom user defined signal using kill -10 to reload config
    process.on('SIGUSR1', async () => {
        console.log("Received SIGUSR1 Signal .. Reloading config")
        cleanup = await init()
    })


    const app = require('./http/app.js')

    if (!config.nodejs.production){
      var port = config.http.port
      server = app.listen(port, "localhost", () => {	
        console.log(chalk.green(`✓ (HTTP Server) : http://localhost:${port}`));
      })
    }else{

      require('greenlock-express').init({
        packageRoot: __dirname,
        // contact for security and critical bug notices
        maintainerEmail: "hamdy.a.farag@gmail.com",
        // where to look for configuration
        configDir: './greenlock.d',
        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
    }

   
    }

main()
