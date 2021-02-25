var express = require('express');
var router = express.Router();
const asyncHandler = require('express-async-handler')

var drive = require('../../drive.js')
var cache = require('../../cache')


async function getRequestInfo(req){
    var domains = cache.domains
    var port = 443
    var host = ""
    var err = ""
    var driveObj = null
    var status = 200
    var dir = ""
    var repo = ""

    if (req.headers.host){
        host = req.headers.host
        var splitted = req.headers.host.split(':')
        if (splitted.length > 1){
            port = splitted[1]
            host = splitted[0]
        }
    }

    if (host === ""){
        status = 500
        err = "Host is missing from headers"
    }else if (!(host in domains)){
        status = 404
        err = "Host is unknown"
    }

    driveObj = await drive.get(domains[host]["drive"])
    dir = domains[host]["dir"]
    repo = domains[host]["repo"]
    
    return {
        "status" : status,
        "err": err,
        "port": port,
        "host": host,
        "drive": driveObj,
        "dir" : dir,
        "repo": repo
    }

}

async function handleWebsiteFile(req, res, info){
    driveObj = info.drive
    var filepath = `${info.dir}/${req.url}`
    var encoding = 'utf-8'
    if(filepath.endsWith('png') || filepath.endsWith('jpg') || filepath.endsWith('jpeg')){
        encoding = 'binary'
    }else if (filepath.endsWith("js")){
        res.type("text/javascript");
    }else if (filepath.endsWith("css")){
            res.type("text/css");
    }else if (filepath.endsWith("json")){
        res.type("application/json");
    }

    var entry = null
    try {
        entry = await driveObj.promises.stat(filepath)
        if(entry.isDirectory()){
            filepath = filepath + "/index.html"
            entry = await driveObj.promises.stat(filepath)
        }

        var content = await  driveObj.promises.readFile(filepath, encoding);
        return res.send(content)
    } catch (e) {
        console.log(e)
        return res.status(404).json('');
    }
}

async function handleWikiFile(req, res, info){
    
    var filepath = `${info.dir}/${req.url}`
    var filename = req.url.substring(1)
    var wikiname = info.dir.substring(1)
    
    if(filename.includes("__")){
        var splitted = filename.split("__")
        filename = splitted[1]
        wikiname = `wiki_${splitted[0]}`
    }

    var encoding = 'utf-8'  
    
    if (filename == "_sidebar.md"){
        filename = "sidebar.md"
    }
    
    var splitted = filename.split("/")
    if (splitted.length > 1){
        filename = splitted[splitted.length - 1]
    }

    if (filename.endsWith("jpeg") || filename.endsWith("jpg") || filename.endsWith("gif") || filename.endsWith("png")){
        encoding = 'binary'
    }else if(filename.endsWith("md") ){
        encoding = 'utf-8'  
    }

    filepath = `/${wikiname}/${filename}`
    driveObj = null

    var domains = cache.domains
    for(var key in domains){
        var item = domains[key]
        if(item.dir == `/${wikiname}`){
            try{
                driveObj =  await drive.get(item.drive)
            }catch(e){

            }
        }
    }

    if(!driveObj){
        return res.status(404).json('');
    }

    // `/${req.params.wikiname}/${req.params.filename}`
    var entry = null
    try {
        entry = await driveObj.promises.stat(filepath)
        var content = await  driveObj.promises.readFile(filepath, encoding);
        return res.send(content)
       
    } catch (e) {
        if (filename == "README.md"){
            filepath = `/${wikiname}/readme.md`
            try{
                entry = await driveObj.promises.stat(filepath)
                var content = await  driveObj.promises.readFile(filepath, encoding);
                return res.send(content)
            }catch(e){
                var content =`# ${wikiname}`
                return res.send(content)
            }            
        }
        return res.status(404).json('');
    }
}

// Home (list of wikis and sites)
router.get('/', asyncHandler(async (req, res) =>  {
    var info = await getRequestInfo(req)

    if(info.status != 200){
        return res.status(info.status).json({"err": info.err});
    }

    var domains = cache.domains

    // Local listing page
    if (info.host == "localhost" || info.host == "127.0.0.1" ){
        var wikis = []
        var sites = []
        for (var item in domains){
            if (domains[item]["dir"].startsWith("/wiki")){
                wikis.push(item)
            }else{
                sites.push(item)
            }
        }
        res.render('sites/home.mustache', {
            sites : sites,
            wikis: wikis,
            port: info.port
        });   
        return
    }else{
        // Handle website or wiki
        var driveObj = info.drive
        var dir = info.dir
        var filepath = `${dir}/index.html`
        var entry = null
        try {
            entry = await driveObj.promises.stat(filepath)
            var content = await  driveObj.promises.readFile(filepath, 'utf8');
            return res.send(content)
        } catch (e) {
            console.log(e)
            return res.status(404).json('');
        }
    }
}))


router.get('/flexsearch', asyncHandler(async (req, res) => {
    var info = await getRequestInfo(req)

    if(info.status != 200){
        return res.status(info.status).json({"err": info.err});
    }

    var driveObj = info.drive
    var filepath = `${info.dir}/flexsearch.json`
    var entry = null
    try {
        entry = await driveObj.promises.stat(filepath)
        var content = await  driveObj.promises.readFile(filepath, 'utf8');
        res.type("application/json");
        return res.send(content)
    } catch (e) {
        console.log(e)
        return res.status(404).json('');
    }
}))

// Wiki errors
router.get('/errors', asyncHandler(async (req, res) => {
    var info = await getRequestInfo(req)

    if(info.status != 200){
        return res.status(info.status).json({"err": info.err});
    }

    var driveObj = info.drive
    var wikiname = info.dir.substring(1)
    
    filepath = `${info.dir}/errors.json`
    var entry = null
    try {
        entry = await driveObj.promises.stat(filepath)

        var content = await  driveObj.promises.readFile(filepath, 'utf-8');
        
        var data = JSON.parse(content)
        var errors = {
            page_errors : []
        }
        errors.site_errors = data.site_errors
        
        for (var key in data.page_errors){
            var e = {
                page : key,
                errors : data.page_errors[key]
            }
            errors.page_errors.push(e)
        }
        res.render('sites/errors.mustache', {site_name: wikiname, site_errors : errors.site_errors, page_errors: errors.page_errors});
       
    } catch (e) {
        console.log(e)
        return res.status(404).json('');
    }
}))

// files
router.get('/update', asyncHandler(async (req, res) => {
    var info = await getRequestInfo(req)
    var repo = info.repo

    if(info.status != 200){
        return res.status(info.status).json({"err": info.err});
    }

    var spawn = require('child_process').spawn;
    var prc = spawn('publishtools',  ['pull', '--repo', repo]);
    
    //noinspection JSUnresolvedFunction
    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    });

    prc.on('close', function (code) {
        console.log('process exit code ' + code);
    });
    
   
    if (repo.startsWith("www")){
        prc = spawn('publishtools',  ['build', '--repo', repo]);
    }else{
        prc = spawn('publishtools',  ['flatten', '--repo', repo]);
    }
    //noinspection JSUnresolvedFunction
    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    });

    prc.on('close', function (code) {
        console.log('process exit code ' + code);
    });

    return res.redirect("/")
}))

// files
router.get('/*', asyncHandler(async (req, res) => {
    var info = await getRequestInfo(req)

    if(info.status != 200){
        return res.status(info.status).json({"err": info.err});
    }
    return info.dir.startsWith("/www") ? handleWebsiteFile(req, res, info) : handleWikiFile(req, res, info)
    
}))

module.exports = router


