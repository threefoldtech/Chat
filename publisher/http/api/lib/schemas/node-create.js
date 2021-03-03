module.exports = {
  type: 'object',
  properties: {
    farm: { type: 'integer' },
    node: { type: 'string' },
    capacity: {
      sru: { type: 'integer' },
      mru: { type: 'integer' },
      cru: { type: 'integer' },
      hru: { type: 'integer' }
    },
    location: {
      longitude: { type: 'string' },
      latitude: { type: 'string' }
    },
    secret: { type: 'string' }
  },
  required: ['farm', 'node', 'capacity', 'location', 'secret'],
  additionalProperties: false
}
