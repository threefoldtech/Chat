const TfgridApiClient = require('tfgrid-api-client')

const url = 'wss://explorer.devnet.grid.tf/ws'
const mnemo = 'maid major gossip speak thank disagree blame museum slide canvas trash submit'
const botipv6 = '200:b57d:d1f0:aad3:71f3:bf:232:9c4'

function getClient (url, mnemonic) {
  const cli = new TfgridApiClient(url, mnemonic)
  cli.init()

  return cli
}

// global tfclient
const tfclient = getClient(url, mnemo)

const express = require('express')
const router = express.Router()
const path = require('path')
const app = express()
const clusters = require('./clusters.js')
const httpError = require('http-errors')
const { omit } = require('lodash')
const log = require('pino')()

const { validateBodyMiddleware } = require('./lib/validate')

const tferrors = {
  1: 'StorageOverflow',
  2: 'CannotCreateNode',
  3: 'NodeNotExists',
  4: 'NodeWithPubkeyExists',
  5: 'CannotDeleteNode',
  6: 'FarmExists',
  7: 'FarmNotExists',
  8: 'CannotCreateFarmWrongTwin',
  9: 'CannotDeleteFarm',
  10: 'CannotDeleteFarmWrongTwin',
  11: 'EntityWithNameExists',
  12: 'EntityWithPubkeyExists',
  13: 'EntityNotExists',
  14: 'EntitySignatureDoesNotMatch',
  15: 'EntityWithSignatureAlreadyExists',
  16: 'CannotUpdateEntity',
  17: 'CannotDeleteEntity',
  18: 'TwinExists',
  19: 'TwinNotExists',
  20: 'CannotCreateTwin',
  21: 'UnauthorizedToUpdateTwin',
  22: 'PricingPolicyExists',
  23: 'CertificationCodeExists',
  24: 'OffchainSignedTxError',
  25: 'NoLocalAcctForSigning'
}

app.use(function (err, req, res, next) {
  if (httpError.isHttpError(err)) {
    // use warning since we threw the error
    log.warn(err)
    res.status(err.status)
    if (process.env.NODE_ENV !== 'development') return res.send(omit(err, ['stack']))
    return res.send(err)
  }

  // default error handler
  log.error(err, 'error happened handling the request')
  res.status(err.status || 500).send(err.message)
})

function jsonError (res, msg) {
  return res.status(422).json({ success: false, message: msg })
}

//
// entities
//
router.post('/entities', validateBodyMiddleware('entity-create'), (req, res, next) => {
  const { body } = req
  const { name, country, city } = body

  tfclient.createEntity(name, country, city, content => events(content, res, 201))
    .catch(next)
})

router.get('/entities', (req, res, next) => {
  tfclient.listEntities().then(content => res.json(content))
    .catch(next)
})

router.get('/entities/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.getEntityByID(id).then(content => res.json(content))
    .catch(next)
})

router.delete('/entities', (req, res, next) => {
  tfclient.deleteEntity(content => events(content, res, 200))
    .catch(next)
})

router.put('/entities/:id', (req, res, next) => {
  // TODO: update entity
})

//
// twins
//

router.post('/twins', validateBodyMiddleware('twin-create'), (req, res, next) => {
  const { body } = req
  const { ip = botipv6 } = body

  tfclient.createTwin(ip, content => events(content, res, 201))
    .catch(next)
})

router.get('/twins', (req, res, next) => {
  tfclient.listTwins().then(content => res.json(content))
    .catch(next)
})

router.get('/twins/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.getTwinByID(id).then(content => res.json(content))
    .catch(next)
})

router.delete('/twins/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.deleteTwin(parseInt(id), content => res.json(content))
    .catch(next)
})

router.post('/twins/:id/entities', validateBodyMiddleware('twin-entity-create'), (req, res, next) => {
  const { params, body } = req
  const { id } = params
  const { entity, signature } = body

  tfclient.addTwinEntity(id, entity, signature, content => events(content, res, 201))
    .catch(next)
})

router.delete('/twins/:tid/entities/:eid', (req, res, next) => {
  const { params } = req
  const { tid, eid } = params

  tfclient.removeTwinEntity(parseInt(tid), parseInt(eid), content => events(content, res, 200))
    .catch(next)
})

//
// farms
//

router.get('/farms', (req, res, next) => {
  tfclient.listFarms().then(content => res.json(content))
    .catch(next)
})

router.get('/farms/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.getFarmByID(id).then(content => res.json(content))
    .catch(next)
})

router.post('/farms', validateBodyMiddleware('farm-create'), (req, res, next) => {
  const { body } = req
  const { name, entity, twin, country, city, policy } = body

  const certificationType = tfclient.api.createType('CertificationType', 0)
  const farm = {
    name: name,
    entity_id: entity,
    twin_id: twin,
    pricingPolicyID: policy,
    certificationType: certificationType,
    country_id: country,
    city_id: city
  }

  tfclient.createFarm(farm, (content) => events(content, res, 201))
    .catch(next)
})

router.delete('/farms/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.deleteFarm(parseInt(id), (content) => events(content, res, 200))
    .catch(next)
})

//
// nodes
//

router.get('/nodes', (req, res, next) => {
  tfclient.listNodes().then(content => res.json(content))
    .catch(next)
})

router.get('/nodes/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.getNodeByID(id).then(content => res.json(content))
    .catch(next)
})

router.post('/nodes', validateBodyMiddleware('node-create'), (req, res, next) => {
  const { body } = req
  const { farm, node: nodeId, capacity, location } = body

  // TODO: do something with secret?

  const resources = tfclient.api.createType('Resources', capacity)
  const loc = tfclient.api.createType('Location', {
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString()
  })

  // TODO: remove hard coded stuff

  const node = {
    farm_id: farm,
    pub_key: nodeId,
    twin_id: 1,
    resources,
    location: loc,
    country_id: 1,
    city_id: 1,
    role: 'Node'
  }

  tfclient.createNode(node, content => events(content, res, 201))
    .catch(next)
})

router.delete('/nodes/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  tfclient.deleteNode(parseInt(id), content => events(content, res, 200))
    .catch(next)
})

//
// gateway
//
router.post('/gateways', validateBodyMiddleware('node-create'), (req, res, next) => {
  const { body } = req
  const { farm, node: nodeId, capacity, location } = body

  const resources = tfclient.api.createType('Resources', capacity)
  const loc = tfclient.api.createType('Location', {
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString()
  })

  const node = {
    farm_id: farm,
    pub_key: nodeId,
    twin_id: 1,
    resources,
    location: loc,
    country_id: 1,
    city_id: 1,
    role: 'Gateway'
  }

  tfclient.createNode(node, content => events(content, res, 201))
    .catch(next)
})

//
// account
//

// router.get('/account/price', (req, res, next) => {
//   tfclient.getPrice().then(content => res.json(content))
//     .catch(next)
// })

router.get('/account/balance', (req, res, next) => {
  tfclient.getBalance().then(content => res.json(content))
    .catch(next)
})

//
// owner signing debug
//

router.get('/debug/cluster/:name', (req, res, next) => {
  clusters.findByName(clusters.rootpath, req.params.name).then((content) => {
    console.log(content)
    res.json(content)
  })
})

//
// crypto verification
//

router.post('/signature', validateBodyMiddleware('sign-create'), (req, res, next) => {
  const { body } = req
  const { entity, twin } = body

  tfclient.sign(entity, twin).then(content => res.json(content))
    .catch(next)
})

//
// clusters
//

router.get('/clusters', (req, res, next) => {
  clusters.list(clusters.rootpath).then(content => res.json(content))
    .catch(next)
})

router.post('/clusters', validateBodyMiddleware('cluster-create'), (req, res, next) => {
  const { body } = req
  const { name } = body

  if (!name.match(/^[0-9a-zA-Z._-]*$/)) throw httpError(400, 'Invalid cluster name: only alpha, number, period, underscore and dash allowed')

  const fullpath = path.join(clusters.rootpath, name + '.json')
  const apath = path.resolve(fullpath)

  clusters.put(apath, body).then(content => res.json(content))
    .catch(next)
})

router.get('/clusters/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  const fullpath = path.join(clusters.rootpath, id + '.json')
  const apath = path.resolve(fullpath)

  clusters.get(apath).then(content => res.json(content))
    .catch(next)
})

router.delete('/clusters/:id', (req, res, next) => {
  const { params } = req
  const { id } = params

  const fullpath = path.join(clusters.rootpath, id + '.json')
  const apath = path.resolve(fullpath)

  clusters.remove(apath).then(() => res.status(202).send())
    .catch(next)
})

router.put('/clusters/:id', validateBodyMiddleware('cluster-create'), (req, res, next) => {
  const { params, body } = req
  const { id } = params

  const fullpath = path.join(clusters.rootpath, id + '.json')
  const apath = path.resolve(fullpath)

  clusters.put(apath, body).then(() => res.status(202).send())
    .catch(next)
})

function events (content, res, okcode) {
  if (content instanceof Error) return jsonError(res, content)

  const { events = [], status } = content
  console.log(`Current status is ${status.type}`)
  let code = okcode

  let result = null

  if (status.isFinalized) {
    console.log(`Transaction included at blockHash ${status.asFinalized}`)

    // Loop through Vec<EventRecord> to display all events
    events.forEach(({ phase, event: { data, method, section } }) => {
      console.log(`>> ${phase}: ${section}.${method}:: ${data}`)

      console.log(data)

      // skip if result is already set
      if (result) return

      // error
      if (section === 'system' && method === 'ExtrinsicFailed') {
        code = 422 // Error code

        const module = data[0].asModule

        const errid = module.error.words[0]
        let errmsg = 'unknown'

        if (errid in tferrors) errmsg = tferrors[errid]

        // node already exists, not an error
        if (errmsg === 'NodeWithPubkeyExists') code = 304 // Not Modified

        result = {
          success: false,
          error: errmsg,
          errno: errid
        }
      }

      // success
      if (section === 'tfgridModule') {
        result = {
          success: true,
          message: method,
          id: data[0].words[0]
        }
      }
    })

    res.status(code).json(result)
  }
}

module.exports = router
