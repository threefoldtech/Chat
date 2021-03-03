module.exports = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    secret: { type: 'string' },
    ipv4: { type: 'string' },
    ipv6: { type: 'string' }
  },
  required: ['name', 'secret', 'ipv4', 'ipv6'],
  additionalProperties: false
}
