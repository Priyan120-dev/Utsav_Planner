import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Production Client Serving & SPA Fallback', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('GET / returns 200 and serves the built index.html in production', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<!doctype html>');
    expect(res.text).toContain('<div id="root"></div>');
  });

  it('GET /any-non-api-route returns index.html (SPA client fallback)', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<!doctype html>');
  });

  it('GET /api/health returns 200 and JSON response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('utsav-planner-api');
  });

  it('GET /api/nope returns 404 with JSON error and does NOT return index.html', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ error: 'Endpoint not found' });
  });

  it('POST /api/nope returns 404 with JSON error', async () => {
    const res = await request(app).post('/api/nope').send({});
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ error: 'Endpoint not found' });
  });

  it('sets Helmet CSP headers allowing own scripts, styles/inline styles, fonts, and data-URI favicon', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain('data:');
  });

  it('allows same-origin requests through CORS without blocking', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Host', 'my-utsav-app.onrender.com')
      .set('Origin', 'https://my-utsav-app.onrender.com');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
