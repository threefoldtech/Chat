const process = require('process')
const dns = require('dns2');
const cache = require("../cache");
const { Packet } = dns;

const dnsserver = dns.createUDPServer((request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;
    var host = process.env.HOST_IP || '8.8.8.8'
    if (name in cache.domains){
        response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 300,
            address: host
          });
    }else{
        response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 300,
            address: '8.8.8.8'
          });
    }
    
    send(response);
  });

dnsserver.on('request', (request, response, rinfo) => {
    console.log(request.header.id, request.questions[0]);
  });


module.exports = dnsserver