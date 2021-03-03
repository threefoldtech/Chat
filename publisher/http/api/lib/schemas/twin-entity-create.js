module.exports = {
  type: 'object',
  properties: {
    signature: { type: 'string' },
    entity: { type: 'number' }
  },
  required: ['signature', 'entity'],
  additionalProperties: false
}
