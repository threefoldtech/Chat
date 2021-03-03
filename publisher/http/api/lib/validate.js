const validate = require('jsonschema').validate
const httpError = require('http-errors')

async function validateP (schemaName, object = {}) {
  return new Promise((resolve, reject) => {
    let schema
    try {
      schema = require(`./schemas/${schemaName}`)
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') return reject(new Error(`no schema defined under name ${schema}`))
      return reject(err)
    }

    const result = validate(object, schema)

    result.valid
      ? resolve(object)
      : reject(new Error(result.errors.toString()))
  })
}

function validateBodyMiddleware (schema) {
  if (!schema) throw new Error('schema has to be provided')
  return (req, res, next) => {
    const { body } = req
    validateP(schema, body)
      .then(_ => next())
      .catch(err => next(httpError(400, err.message)))
  }
}

module.exports = {
  validateBodyMiddleware
}
