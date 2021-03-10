const fs = require('fs').promises
const path = require('path')
const rootpath = '/tmp/clusters'
const reports = '/root/reports'
const httpError = require('http-errors')

async function list (cpath) {
  const files = await fs.readdir(cpath)
  const pathName = cpath

  const apath = path.resolve(pathName)

  // make a map that contains al fs.readFile promises
  const reads = files.map(file => {
    return fs.readFile(apath + '/' + file)
  })

  // resolve all promises
  const result = await Promise.all(reads)

  // return parsed result
  return result.map(res => JSON.parse(res))
}

async function get (cpath) {
  try {
    await fs.access(cpath, fs.F_OK)
  } catch (err) {
    throw httpError(400, 'invalid cluster')
  }

  try {
    const content = await fs.readFile(cpath)
    return JSON.parse(content)
  } catch (err) {
    console.log(`${err}`)
    throw httpError(400, err)
  }
}

async function remove (cpath) {
  try {
    await fs.access(cpath, fs.F_OK)
  } catch (err) {
    throw httpError(400, 'invalid cluster')
  }

  try {
    await fs.unlink(cpath)
  } catch (err) {
    throw httpError(400, 'cannot delete cluster')
  }
}

async function put (cpath, body) {
  try {
    await fs.writeFile(cpath, JSON.stringify(body))
  } catch (err) {
    console.log(`${err}`)
    throw httpError(400, 'invalid cluster')
  }
}

async function findByName (cpath, name) {
  const values = await list(cpath)

  return values.filter(value => value.name === name)
}

async function saveReport(id, report) {
  const target = path.resolve(reports, id)

  try {
    await fs.mkdir(target, {recursive: true})
  } catch (err) {
    throw httpError(400, 'could not save report')
  }

  const file = path.resolve(target, Date.now().toString())
  console.log("Saving report:", file)

  try {
    await fs.writeFile(file, JSON.stringify(report))
  } catch (err) {
    console.log(`${err}`)
    throw httpError(400, 'could not write report')
  }
}

module.exports = { rootpath, list, get, remove, put, findByName, saveReport }
