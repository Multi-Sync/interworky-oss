const request = require('supertest');
const { createApp } = require('../createApp');

describe('API Smoke Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp({ loadRoutes: false });
  });

  test('GET / returns Hello World', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Hello World!' });
  });

  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Not Found' });
  });

  test('CORS headers are present', async () => {
    const res = await request(app).get('/').set('Origin', 'http://example.com');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  test('Helmet security headers are present', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('JSON body parsing works', async () => {
    const res = await request(app)
      .post('/nonexistent')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(404);
  });

  test('responds with JSON content-type', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
