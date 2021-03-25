const fs = require('fs')
const p = require('process')
const chalk = require('chalk');

const config = require("./config");

async function process(){
    var letsencrypt = {}

    for(var i=0; i<  config.domains.length; i++){
        var domain = config.domains[i]
        letsencrypt[domain] = {"renewAt": 1, "altnames": [domain]}
    }


     // //{ "sites": [{ "subject": "example.com", "altnames": ["example.com"] }] }
     try{
        fs.statSync('greenlock.d/config.json')
     }catch(e){
        fs.copyFileSync('greenlock.d/config.json.bak', 'greenlock.d/config.json');
     }
    var c = {}
    try{
        c = JSON.parse(fs.readFileSync('greenlock.d/config.json'));
    }catch(e){
        console.log(chalk.red(`X (Let'sEncrypt) Failed to read config file greenlock.d/config.json`))
        c = JSON.parse(fs.readFileSync('greenlock.d/config.json'));
    }

    var currentDomains = {}
    c.sites.forEach(element => {
        currentDomains[element.subject] = element.renewAt || 1
    });
    
    for(var item in currentDomains){
        if (!(item in letsencrypt)){
            continue
        }else{
            letsencrypt[item]["renewAt"] = currentDomains[item]
        }
    }
    
    var newSites = []
    for(item in letsencrypt){
        if(item == "localhost" || item == "127.0.0.1"){
            continue
        }

        var obj = {}
        obj.subject = item
        obj.altnames = letsencrypt[item].altnames
        obj.renewAt = letsencrypt[item].renewAt
        newSites.push(obj)
    }
    c.sites = newSites
    try{
        fs.writeFileSync('greenlock.d/config.json', JSON.stringify(c, null, 4), {flag: 'w'})
    }catch(e){
        console.log(chalk.red(`X (Let'sEncrypt) Failed to write config file greenlock.d/config.json`))
        p.exit(1)
    }
}

module.exports = {
    process : process
}