var path = require('path')
const chalk = require('chalk');
const groups = require('./groups')
var config = require ('../config')
var utils = require('../utils')


async function process(drive, dir){
    var info = {"websites": {}, "wikis": {}}
    var domains = {}

    var p = path.join("/", dir)
    var dirs = await drive.promises.readdir(p)
    var groupObj = await groups.load(drive)
    dirs = dirs.filter((item) => {if(!item.startsWith(".")){return item}}).sort()
    
    var defs = {}

    for(var i=0; i < dirs.length; i++){
        var dir = path.join(p, dirs[i])

        var domainfilepath = path.join(dir, ".domains.json")
        var repofilepath = path.join(dir, ".repo")
        var aclfilepath = path.join(dir, '.acls.json')
        
        try{
            await drive.promises.stat(domainfilepath)
            
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} does not contain .domains.json`))
            continue
        }

        try{
            await drive.promises.stat(aclfilepath)
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} does not contain .acls.json`))
            continue
        }

        try{
            await drive.promises.stat(repofilepath)
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} does not contain .repo`))
            continue
        }

        var domainInfo = {}
        try{
            var domainData = await  drive.promises.readFile(domainfilepath, 'utf8');
            domainInfo = JSON.parse(domainData)
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} Error reading: ${domainfilepath}`))
            continue
        }

        var repoInfo = {}
        try{
            var repoData = await  drive.promises.readFile(repofilepath, 'utf8');
            repoInfo = JSON.parse(repoData)
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} Error reading: ${repofilepath}`))
            continue
        }
        var users = []
        var acl = {}

        try{
            var aclata = await drive.promises.readFile(aclfilepath, 'utf8');
            acl = JSON.parse(aclata)
            users  = await groupObj.parseAcl(acl)
           
        }catch(e){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} Error reading: ${aclfilepath}`))
            continue
        }
        var isWebSite = repoInfo["repo"].startsWith("www")
        
        var item =  isWebSite? "websites" : "wikis"

        var alias = repoInfo["alias"]
        if (alias in info[item]){
            console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} duplicated alias`))
            continue
        }

        // load defs from wikis
        if(!isWebSite){
            try{
                var defpath = path.join(dir, 'defs.json')
                var defdata = await  drive.promises.readFile(defpath, 'utf8');
                defInfo = JSON.parse(defdata)
                for(var k=0; k< defInfo.defs.length; k++){
                    var obj = defInfo.defs[k]
                    defs[obj.def] = {"wikiname": obj.site, "pagename": obj.page}
                }
            }catch(e){
                console.log(chalk.red(`    ✓ (Drive (${drive.name}) Ignoring path: ${dir} Error reading: ${defpath}`))
            }
        }

        var val = {
            "drive": drive,
            "dir": dir,
            "repo": repoInfo["repo"],
            "alias": repoInfo["alias"],
            "isWebSite": isWebSite,
            "users": users,
            "login": acl.login,
            "domains": domainInfo.domains
        }

        info[item][alias] = val

        for(var k=0; k < domainInfo.domains.length; k++){
            var domain = domainInfo.domains[k]
            domains[domain] = val
        }
    }
    info["defs"] = defs
    info["domains"] = domains

    return info
}

async function loadInfo(drive){
    var dirs = await drive.promises.readdir("/")
    dirs = dirs.filter((item) => {if(!item.startsWith(".")){return item}}).sort()
    var items = []
    items.push(await process(drive, "."))
    return items
}

async function reduce(items){
    var res = {"websites": {}, "wikis": {}, "defs": {}, "domains": {}}
    
    for(var i=0; i<items.length; i++){
        var obj = items[i]
        
        for(var def in obj.defs){
            res.defs[def] = obj.defs[def]
        }

        for(var d in obj.domains){
            res.domains[d] = obj.domains[d]
        }


        for(var alias in obj["websites"]){
            if(alias in res["websites"]){
                var driv = res["websites"][alias].drive
                var dir = res["websites"][alias].dir
                console.log(chalk.red(`    ✓ (Drive (${driv.name}) Ignoring path: ${dir} duplicate alias for domain ${domain}`))
                continue
            }else{
                res["websites"][alias] =  obj["websites"][alias]
                var domains = obj["websites"][alias].domains
                for(var j=0; j< domains.length; j++){
                    var domain = domains[j]
                    prefix = obj["websites"][alias].isWebSite? "/" : "/info/"
                    await utils.addRewriteRuleForDomains(domain, prefix+alias, true)
                }
            }
        }
        for(var alias in obj["wikis"]){
            if(alias in res["wikis"]){
                var driv = res["websites"][alias].drive
                var dir = res["websites"][alias].dir
                console.log(chalk.red(`    ✓ (Drive (${driv.name}) Ignoring path: ${dir} duplicate alias for domain ${domain}`))
                continue
            }else{
                res["wikis"][alias] =  obj["wikis"][alias]
                var domains = obj["wikis"][alias].domains
                for(var j=0; j< domains.length; j++){
                    var domain = domains[j]
                    prefix = obj["wikis"][alias].isWebSite? "/" : "/info/"
                    await utils.addRewriteRuleForDomains(domain, prefix+alias, false)
                }
            }
        }
    }
    return res
}

module.exports = {
    loadInfo: loadInfo,
    reduce: reduce
}