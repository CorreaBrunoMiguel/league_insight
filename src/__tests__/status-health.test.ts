import request from 'supertest';
import { createApp } from '../app';

describe('status and health endpoints', () => {
  const app = createApp();

  it('GET /api/status should return ok and service info', async () => {
    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('service');
  });

  it('GET /api/healthz should return ok', async () => {
    const res = await request(app).get('/api/healthz');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});
