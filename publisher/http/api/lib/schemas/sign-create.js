module.exports = {
  type: 'object',
  properties: {
    entity: { type: 'number' },
    twin: { type: 'number' }
  },
  required: ['entity', 'twin'],
  additionalProperties: false
}
