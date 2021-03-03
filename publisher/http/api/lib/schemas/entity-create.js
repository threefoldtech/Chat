module.exports = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    country: { type: 'integer' },
    city: { type: 'integer' }
  },
  required: ['name', 'country', 'city'],
  additionalProperties: false
}
