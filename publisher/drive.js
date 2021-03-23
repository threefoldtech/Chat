const chalk = require("chalk");
const fs = require("fs");
var path = require("path");

const { Server: HyperspaceServer } = require("hyperspace");
const { Client: HyperspaceClient } = require("hyperspace");
const HyperDrive = require("hyperdrive");
const config = require("./config.js");
const db = JSON.parse(fs.readFileSync("db/drives.json"));
const cache = require("./cache.js");

let client;
let server;

class LocalDrive {
  constructor() {
    var base = config.filesystem.path;
    this.promises = {
      stat: async function (filepath) {
        return fs.lstatSync(path.join(base, filepath));
      },
      readdir: async function (dirpath) {
        return fs.readdirSync(path.join(base, dirpath));
      },
      readFile: async function (filepath, encoding) {
        if (encoding == "binary") {
          return fs.readFileSync(path.join(base, filepath));
        }
        return fs.readFileSync(path.join(base, filepath), encoding);
      },
    };
  }
}

async function getDomains(id, drive) {
  var dirs = await drive.promises.readdir("/");
  dirs.sort();

  var res = await dirs.map(async function (dir) {
    var filepath = path.join("/", dir, ".domains.json");
    var domains = {};
    try {
      await drive.promises.stat(filepath);
    } catch (e) {
      console.log(
        chalk.red(
          `    ✓ (Drive (${id}) Ignoring path: /${dir} does not contain .domains.json`
        )
      );
      return [];
    }
    try {
      var content = await drive.promises.readFile(filepath, "utf8");
      var data = JSON.parse(content);
      for (var i = 0; i < data.domains.length; i++) {
        domains[data.domains[i]] = {
          drive: id,
          dir: path.join("/", dir),
        };
      }
      return domains;
    } catch (e) {
      console.log(chalk.red(` ✓ (Drive (${id}) Error reading: ${filepath}`));
    }
  });

  return res.filter((item) => item !== undefined);
}

async function create(name) {
  let drive = new HyperDrive(client.corestore(), null);
  await drive.promises.ready();

  const key = drive.key.toString("hex");
  console.log(chalk.green("✓ (HyperSpace Drive) created"));
  console.log(chalk.blue(`\t✓ ${name} (${key})`));

  await client.replicate(drive);
  await new Promise((r) => setTimeout(r, 3e3)); // just a few seconds
  await client.network.configure(drive, { announce: false, lookup: false });
  db.hyperdrives.push({ name: name, key: key });
  fs.writeFile("db/drives.json", JSON.stringify(db), function (err) {
    if (err) {
      console.log(chalk.red("Error saving key to db"));
    }
  });
  cache.drives[key] = drive;
  cache.drives[name] = drive;

  return key;
}

async function get(id_or_name) {
  return cache.drives[id_or_name];
}

async function load() {
  var domains = {};
  var drivedomains = [];
  var letsencrypt = [];

  db.hyperdrives.map(async function (item) {
    let drive = new HyperDrive(client.corestore(), item.key);
    await drive.promises.ready();
    await client.replicate(drive);
    await new Promise((r) => setTimeout(r, 3e3)); // just a few seconds
    await client.network.configure(drive, { announce: false, lookup: false });
    console.log(
      chalk.blue(`✓ (HyperSpace Drive) loaded ${item.name} (${item.key})`)
    );
    cache.drives[item.name] = drive;
    cache.drives[item.key] = drive;
    drivedomains.push(...(await getDomains(item.key, drive)));
  });
  var localdrive = new LocalDrive();
  cache.drives["local"] = localdrive;
  console.log(chalk.blue(`\n✓ (LocalDrive Drive) loaded`));

  drivedomains.push(...(await getDomains("local", localdrive)));

  for (var i = 0; i < drivedomains.length; i++) {
    var item = await drivedomains[i];
    if (!item) {
      continue;
    }
    for (var domain in item) {
      if (domain in domains) {
        console.log(
          chalk.red(`(X Duplicate domain) ${item} ${drivedomains[item]}`)
        );
      } else {
        domains[domain] = item[domain];
        console.log(chalk.blue(`    ✓ (Loaded domain ${domain}`));
      }
    }
  }

  cache.domains = domains;
  cache.domains["127.0.0.1"] = { drive: null, dir: "" };
  cache.domains["localhost"] = { drive: null, dir: "" };
}

async function ensureHyperSpace() {
  try {
    client = new HyperspaceClient();
    await client.ready();
  } catch (e) {
    // no daemon, start it in-process
    console.log(config.hyperdrive.path);
    server = new HyperspaceServer({ storage: config.hyperdrive.path });
    await server.ready();
    client = new HyperspaceClient();
    await client.ready();
    console.log(chalk.green("✓ (HyperSpace Daemon)"));
    console.log(chalk.green("\t✓ start"));
    console.log(chalk.green("✓ (HyperSpace Daemon) connected status"));
    console.log(await client.status());
  }

  return {
    client,
    async cleanup() {
      await client.close();
      if (server) {
        await server.stop();
        console.log(chalk.green("✓ (HyperSpace Daemon)"));
        console.log(chalk.red("\t✓ closed"));
      }
    },
  };
}

module.exports = {
  ensureHyperSpace: ensureHyperSpace,
  create: create,
  load: load,
  get: get,
};
