var express = require('express');
var router = express.Router();
const asyncHandler = require('express-async-handler')
const config = require('../../config')

const rewrite = require('../../rewrite')

async function rewriteRoles(content, info){
    
    var scheme = info.secure ? 'https' : 'http'

    host = `${scheme}://${info.host}`
    if(info.port != 80 && info.port != 443){
        host = `${scheme}://${info.host}:${info.port}`
    }
    var res = content
    for(var item in rewrite){
        res = res.replace(new RegExp(item, "g"), `${host}${rewrite[item]}`)
    }
    return res
}

async function update(req) {
    var info = req.info
    var repo = info.repo

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
    
    spawn2 = require('child_process').spawn;
    
    if (repo.startsWith("www")){
        var prc2 = spawn('publishtools',  ['build', '--repo', repo, '--pathprefix']);
    }else{
        var prc2 = spawn('publishtools',  ['flatten', '--repo', repo, '--pathprefix']);
    }
    //noinspection JSUnresolvedFunction
    prc2.stdout.setEncoding('utf8');
    prc2.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    });

    prc2.on('close', function (code) {
        console.log('process exit code ' + code);
    });

}

async function handleWebsiteFile(req, res, info){
    driveObj = info.drive
    var url = req.url.replace(`/${info.alias}/`, "")
    var filepath = `${info.dir}/${url}`
    console.log(filepath)
    var encoding = 'utf-8'
    if(filepath.endsWith('png')){
        res.type("image/png")
        encoding = 'binary'
    }else if(filepath.endsWith('jpg')){
        res.type("image/jpg")
        encoding = 'binary'
    }else if(filepath.endsWith('jpeg')){
        encoding = 'binary'
        res.type('image/jpeg')
    }else if(filepath.endsWith('svg')){
        encoding = 'binary'
        res.type('image/svg+xml')
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
        if(encoding != 'binary')
            content = await(rewriteRoles(content, info))
        return res.send(content)
    } catch (e) {
        console.log(e)
        return res.status(404).json('');
    }
}

async function handleWikiFile(req, res, info){
    var filename = req.url.replace(`/info`, "").replace(`/${info.alias}/`, "")
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

    if(filename.endsWith('png')){
        res.type("image/png")
        encoding = 'binary'
    }else if(filename.endsWith('jpg')){
        res.type("image/jpg")
        encoding = 'binary'
    }else if(filename.endsWith('jpeg')){
        encoding = 'binary'
        res.type('image/jpeg')
    }else if(filename.endsWith('svg')){
        encoding = 'binary'
        res.type('image/svg+xml')
    }else if(filename.endsWith("md") ){
        encoding = 'utf-8'  
    }

    filepath = `/${wikiname}/${filename}`
    driveObj = null
    for(var alias in config.aliases.wikis){
        var item = config.aliases.wikis[alias]
        if(item.dir == `/${wikiname}`){
            driveObj =  item.drive
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
        if(encoding != 'binary')
            content = await(rewriteRoles(content, info))
        return res.send(content)
       
    } catch (e) {
        if (filename == "README.md"){
            filepath = `/${wikiname}/readme.md`
            try{
                entry = await driveObj.promises.stat(filepath)
                var content = await  driveObj.promises.readFile(filepath, encoding);
                content = await(rewriteRoles(content, info))
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
router.get('/publishtools/list', asyncHandler(async (req, res) =>  {
        var info = req.info
        console.log
        var domains = []

        var wikis = new Set()
        var sites = new Set()

        for(var w in config.aliases.websites){
            var item = config.aliases.websites[w]
            var d = `${info.host}`
            if(info.port != 80 && info.port != 443){
                d = `${d}:${info.port}`
            }
            if(w == '/'){
                w = ""
            }

            sites.add({"name": item.alias, "url": `${d}/${w}`})
        }

        for(var w in config.aliases.wikis){
            var item = config.aliases.wikis[w]
            var d = `${info.host}`
            if(info.port != 80 && info.port != 443){
                d = `${d}:${info.port}`
            }
            if(w == '/'){
                w = ""
            }

            wikis.add({"name": item.alias, "url": `${d}/info/${w}`})
        }

        domains.push({"domain": info.host, "websites": Array.from(sites), "wikis": Array.from(wikis)})

        res.render('sites/home.mustache', {
            domains : domains,
            port: info.port
        });       
    }
))

router.get('/', asyncHandler(async (req, res) =>  {
    var info = req.info
     var driveObj = info.drive
     var dir = info.dir
     var filepath = `${dir}/index.html`
     var entry = null
     try {
         entry = await driveObj.promises.stat(filepath)
         var content = await  driveObj.promises.readFile(filepath, 'utf8');
         content = await(rewriteRoles(content, info))
         return res.send(content)
     } catch (e) {
         console.log(e)
         return res.status(404).json('');
     }    
}))

router.get('/:website', asyncHandler(async (req, res) =>  {
     if(req.params.website == 'update'){
        await update(req)
        return res.redirect('/')
     }

     var info = req.info
     var driveObj = info.drive
     var dir = info.dir
     var filepath = `${dir}/index.html`
     var entry = null
     try {
         entry = await driveObj.promises.stat(filepath)
         var content = await  driveObj.promises.readFile(filepath, 'utf8');
         content = await(rewriteRoles(content, info))
         return res.send(content)
     } catch (e) {
         console.log(e)
         return res.status(404).json('');
     }
}))

router.get('/info/:wiki', asyncHandler(async (req, res) =>  {
    var info = req.info
    var driveObj = info.drive
    var dir = info.dir
    var filepath = `${dir}/index.html`
    var entry = null
    try {
        entry = await driveObj.promises.stat(filepath)
        var content = await  driveObj.promises.readFile(filepath, 'utf8');
        content = await(rewriteRoles(content, info))
        return res.send(content)
    } catch (e) {
        console.log(e)
        return res.status(404).json('');
    }
}))



router.get('/:website/flexsearch', asyncHandler(async (req, res) => {
    var info = req.info

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
router.get('/info/:wiki/errors', asyncHandler(async (req, res) => {
    var info = await req.info

    var driveObj = info.drive
    var wikiname = info.dir.substring(1)
    
    filepath = `${info.dir}/errors.json`
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


router.get('/info/:wiki/update', asyncHandler(async (req, res) => {
    await update(req)
    return res.redirect(`/info/${req.params.wiki}`)
}))

router.get('/:website/update', asyncHandler(async (req, res) => {
    await update(req)
    return res.redirect(`/${req.params.website}`)
}))

// wiki files
router.get('/info/:wiki/*', asyncHandler(async (req, res) => {
    var info = req.info
    return handleWikiFile(req, res, info)
}))

// website files
router.get('/:website/*', asyncHandler(async (req, res) => {
    var info = req.info
    return handleWebsiteFile(req, res, info)
}))





module.exports = router


