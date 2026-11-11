'use strict';
// config/nsysu-extra-ca.pem is loaded by the workflows through NODE_EXTRA_CA_CERTS so that NSYSU
// sites which forget to send their intermediate certificate still verify. This is the one test
// that looks at today's date on purpose: it starts failing 30 days before a certificate expires.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { X509Certificate } = require('crypto');

const pem = fs.readFileSync(path.join(__dirname, '..', 'config', 'nsysu-extra-ca.pem'), 'utf8');
const certs = (pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || []).map((c) => new X509Certificate(c));

test('extra CA bundle: three TWCA certificates that chain to each other', () => {
  assert.equal(certs.length, 3);
  assert.match(certs[0].subject, /TWCA SSL Certification Authority/);
  assert.equal(certs[0].checkIssued(certs[1]), true);
  assert.equal(certs[1].checkIssued(certs[2]), true);
  for (const c of certs) assert.equal(c.ca, true);
});

test('extra CA bundle: nothing expires within 30 days (renew config/nsysu-extra-ca.pem when this fails)', () => {
  const limit = Date.now() + 30 * 86400000;
  for (const c of certs) assert.ok(new Date(c.validTo).getTime() > limit, `${c.subject.replace(/\n/g, ', ')} 到期日 ${c.validTo}`);
});

test('both deploying workflows load the bundle', () => {
  for (const f of ['data.yml', 'course-watch.yml']) {
    const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', f), 'utf8');
    assert.match(yml, /NODE_EXTRA_CA_CERTS: \$\{\{ github\.workspace \}\}\/config\/nsysu-extra-ca\.pem/, f);
  }
});
