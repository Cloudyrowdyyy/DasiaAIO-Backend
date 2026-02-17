const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
    it('should return a 200 status for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    it('should return a welcome message', async () => {
        const response = await request(app).get('/');
        expect(response.body.message).toBe('Welcome to the API!');
    });
});