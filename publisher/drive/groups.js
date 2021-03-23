const path = require('path')
const chalk = require('chalk');

class Groups{
    constructor(){
        this._groups = {}

        // flatten group
        this._flatten= function(group, groups){
            var users = new Set()
            
            group.users.map((u)=>{
                users.add(u)
            })

            group.groups.map((g)=>{
                g = groups[g]
                Array.from(this._flatten(g, groups)).map((u)=>{
                    users.add(u)
                })
            })
            return users 
        }
        
        this.list = function(){
            var res = []
            for(var g in this._groups){
                res.push(g)
            }
            return res
        }  
        
        this.load = async function(drive){
            var groupsfilepath = path.join("/", '.groups.json')
            try{
                await drive.promises.stat(groupsfilepath)
                
            }catch(e){
                console.log(chalk.red(`    ✓ (Drive (${drive.name}) does not contain .groups file exiting`))
                process.exit(1)
            }

            try{
                this._groups =  await JSON.parse( await drive.promises.readFile(path.join("/", ".groups.json")));
            }catch(e){
                console.log(chalk.red(`    ✓ (Drive (${drive.name}) can not read .groups file`))
                process.exit(1)
            }
            
            for(var item in this._groups){
                var g = this._groups[item]
                // make sure subgroups exis
                var subgroups =g.groups
                for(var i=0; i< subgroups.length; i++){
                    if(!(subgroups[i] in this._groups)){
                        throw new Error(`Group ${subgroups[i]} does not exist`)
                    }
                }
                // flatten users
                g._allUsers =  Array.from(this._flatten(g, this._groups))
                
            }
            return this
        }

        this.get =  async function(name){
            if(!name in this._groups){
                throw new Error("Not found")
            }
            return this._groups[name]
        }

        this.parseAcl = async function (aclData) {
            var users = new Set()
            aclData.users.forEach((u)=>{users.add(u)})
            await aclData.groups.forEach(async (g)=>{
                try{
                    var groupObj = await this.get(g)
                    groupObj._allUsers.forEach((u)=>{users.add(u)})
                }catch(e){
                    console.log(chalk.red(`    ✓ (Group (${g}) can not be found .. ignoring`))
                }
            })
            return Array.from(users)
        }
    }
}

module.exports = new Groups()