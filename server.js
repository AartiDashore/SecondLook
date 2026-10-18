const express = require('express');
const path = require('path');

const PROJECT_DIR = __dirname;

function createApp(options = {}) {
  const app = express();
  const backendUrl = (options.backendUrl || process.env.PYTHON_API_URL || 'http://127.0.0.1:8000')
    .replace(/\/$/, '');
  const timeoutMs = Number(options.timeoutMs || process.env.BACKEND_TIMEOUT_MS || 5000);

  function sendProjectFile(fileName) {
    return (_request, response) => response.sendFile(path.join(PROJECT_DIR, fileName));
  }

  async function proxyJson(response, endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const backendResponse = await fetch(`${backendUrl}${endpoint}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      const payload = await backendResponse.json();
      response.status(backendResponse.status).json(payload);
    } catch (_error) {
      response.status(502).json({
        detail: 'The confidence service is currently unavailable.'
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  app.get('/', sendProjectFile('index.html'));
  app.get('/script.js', sendProjectFile('script.js'));
  app.get('/styles.css', sendProjectFile('styles.css'));
  app.get('/sound.css', sendProjectFile('sound.css'));
  app.get('/api/demo/michael', (_request, response) => {
    proxyJson(response, '/api/demo/michael');
  });
  app.get('/api/confidence/M1002/:paymentId', (request, response) => {
    proxyJson(
      response,
      `/api/confidence/M1002/${encodeURIComponent(request.params.paymentId)}`
    );
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`SecondLook frontend: http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
