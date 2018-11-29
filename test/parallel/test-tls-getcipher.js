// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';
const common = require('../common');

if (!common.hasCrypto)
  common.skip('missing crypto');

const assert = require('assert');
const tls = require('tls');
// import fixtures directly from its module
const fixtures = require('../common/fixtures');

const cipher_list = ['AES128-SHA256', 'AES256-SHA256'];
const options = {
  key: fixtures.readKey('agent2-key.pem'),
  cert: fixtures.readKey('agent2-cert.pem'),
  ciphers: cipher_list.join(':'),
  honorCipherOrder: true
};

const server = tls.createServer(options, common.mustCall());

server.listen(0, '127.0.0.1', common.mustCall(function() {
  const client = tls.connect({
    host: '127.0.0.1',
    port: this.address().port,
    ciphers: cipher_list.join(':'),
    rejectUnauthorized: false
  }, common.mustCall(function() {
    const cipher = client.getCipher();
    assert.strictEqual(cipher.name, cipher_list[0]);
    assert.strictEqual(cipher.version, 'TLSv1/SSLv3');
    client.end();
    server.close();
  }));
}));

tls.createServer({
  key: fixtures.readKey('agent2-key.pem'),
  cert: fixtures.readKey('agent2-cert.pem'),
  ciphers: 'TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_CCM_8_SHA256',
  maxVersion: 'TLSv1.3',
}, common.mustCall(function() {
  this.close();
})).listen(0, common.mustCall(function() {
  const client = tls.connect({
    port: this.address().port,
    ciphers: 'TLS_AES_128_CCM_8_SHA256',
    maxVersion: 'TLSv1.3',
    rejectUnauthorized: false
  }, common.mustCall(() => {
    const cipher = client.getCipher();
    assert.strictEqual(cipher.name, 'TLS_AES_128_CCM_8_SHA256');
    // For legacy reasons, version is a hard-coded string with no relationship
    // to the actual cipher.
    // See https://github.com/nodejs/node/pull/16130
    assert.strictEqual(cipher.version, 'TLSv1/SSLv3');
    client.end();
  }));
}));
