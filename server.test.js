const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const { createApp } = require('./server');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('Node proxies Michael confidence JSON without changing it', async () => {
  const expected = {
    member_id: 'M1002',
    payment_id: 'P1002-012',
    confidence_percentage: 33,
    risk_tier: 'Pause',
    top_risk_factors: [
      { id: 'new_recipient', title: 'New recipient', description: 'Recipient is new.' }
    ]
  };
  const backend = http.createServer((request, response) => {
    assert.equal(request.url, '/api/demo/michael');
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(expected));
  });
  await listen(backend);
  const backendPort = backend.address().port;

  const frontend = createApp({ backendUrl: `http://127.0.0.1:${backendPort}` }).listen(0, '127.0.0.1');
  await new Promise((resolve) => frontend.once('listening', resolve));
  const frontendPort = frontend.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/api/demo/michael`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
  } finally {
    await close(frontend);
    await close(backend);
  }
});

test('Node reports a backend connection failure as JSON', async () => {
  const frontend = createApp({ backendUrl: 'http://127.0.0.1:1', timeoutMs: 100 }).listen(0, '127.0.0.1');
  await new Promise((resolve) => frontend.once('listening', resolve));
  const frontendPort = frontend.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/api/demo/michael`);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      detail: 'The confidence service is currently unavailable.'
    });
  } finally {
    await close(frontend);
  }
});

test('Node serves the teammate index as the active frontend', async () => {
  const frontend = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => frontend.once('listening', resolve));
  const frontendPort = frontend.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<script src="script\.js"><\/script>/);
    assert.match(html, /id="score"/);
  } finally {
    await close(frontend);
  }
});
