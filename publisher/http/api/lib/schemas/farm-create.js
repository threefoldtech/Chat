module.exports = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    entity: { type: 'integer' },
    twin: { type: 'integer' },
    city: { type: 'integer' },
    country: { type: 'integer' },
    policy: { type: 'interger' }
  },
  required: ['name', 'entity', 'twin', 'city', 'country', 'policy'],
  additionalProperties: false
}
