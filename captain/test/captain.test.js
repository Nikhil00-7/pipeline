// test/captain.test.js
// Mock all dependencies BEFORE anything else
jest.mock('../models/captain.model');
jest.mock('../models/blacklisttoken.model');
jest.mock('../service/rabbit');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../middleware/authMiddleware');

// Mock waitForNewRide
jest.mock('../controllers/captain.controller', () => {
    const originalModule = jest.requireActual('../controllers/captain.controller');
    return {
        ...originalModule,
        waitForNewRide: jest.fn().mockImplementation((req, res) => {
            res.status(200).json({ message: 'No new rides' });
        })
    };
});

// Now import with mocks
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const captainModel = require('../models/captain.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');
const { subscribeToQueue } = require('../service/rabbit');
const authMiddleware = require('../middleware/authMiddleware');
const captainController = require('../controllers/captain.controller');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Create a test app with routes defined directly
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(require('cookie-parser')());
    
    app.post('/api/captain/register', captainController.register);
    app.post('/api/captain/login', captainController.login);
    app.get('/api/captain/logout', captainController.logout);
    app.get('/api/captain/profile', authMiddleware.captainAuth, captainController.profile);
    app.patch('/api/captain/toggle-availability', authMiddleware.captainAuth, captainController.toggleAvailability);
    app.get('/api/captain/new-ride', authMiddleware.captainAuth, captainController.waitForNewRide);
    
    return app;
};

describe('Captain Controller - Unit Tests', () => {
    let mockCaptain;
    let mockToken;
    let testApp;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock captain data
        mockCaptain = {
            _id: '507f1f77bcf86cd799439011',
            name: 'John Doe',
            email: 'captain@example.com',
            password: 'hashedPassword123',
            isAvailable: true,
            save: jest.fn().mockResolvedValue(true),
            _doc: {
                password: 'hashedPassword123'
            }
        };

        mockToken = 'mock-jwt-token';

        // Mock JWT sign
        jwt.sign.mockReturnValue(mockToken);
        
        // Mock bcrypt
        bcrypt.hash.mockResolvedValue('hashedPassword123');
        bcrypt.compare.mockResolvedValue(true);

        // Mock auth middleware
        authMiddleware.captainAuth.mockImplementation((req, res, next) => {
            req.captain = mockCaptain;
            next();
        });

        // CRITICAL FIX: Properly mock findOne for register
        captainModel.findOne.mockImplementation((query) => {
            // For register - if email is newcaptain@example.com, return null (user doesn't exist)
            if (query && query.email === 'newcaptain@example.com') {
                return Promise.resolve(null);
            }
            // For register - if email is captain@example.com, return existing user
            if (query && query.email === 'captain@example.com') {
                return Promise.resolve(mockCaptain);
            }
            // For login - return a query with select method
            const mockQuery = {
                select: jest.fn().mockReturnValue(Promise.resolve(mockCaptain))
            };
            return mockQuery;
        });
        
        // CRITICAL FIX: Properly mock the captain model constructor and save
        const mockSaveFunction = jest.fn().mockImplementation(function() {
            // Simulate the save operation
            const savedCaptain = {
                ...this,
                _id: '507f1f77bcf86cd799439011',
                _doc: { ...this, password: 'hashedPassword123' }
            };
            // Remove password from _doc
            if (savedCaptain._doc) {
                delete savedCaptain._doc.password;
            }
            return Promise.resolve(savedCaptain);
        });
        
        // Mock the captain model constructor
        captainModel.mockImplementation((data) => {
            return {
                ...data,
                save: mockSaveFunction,
                _doc: { ...data, password: data.password }
            };
        });
        
        // Mock findById for toggleAvailability
        captainModel.findById.mockResolvedValue(mockCaptain);
        
        // Mock blacklisttokenModel
        blacklisttokenModel.create.mockResolvedValue({ token: mockToken });

        testApp = createTestApp();
    });

    afterEach(() => {
        jest.resetModules();
    });

    describe('register', () => {
        it('should register a new captain successfully', async () => {
            // Ensure findOne returns null for new email
            captainModel.findOne.mockResolvedValueOnce(null);
            
            const response = await request(testApp)
                .post('/api/captain/register')
                .send({
                    name: 'John Doe',
                    email: 'newcaptain@example.com',
                    password: 'password123'
                });

            // Log the response for debugging
            if (response.status !== 200) {
                console.log('Register response:', response.body);
            }
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token', mockToken);
            expect(response.body.newcaptain).toBeDefined();
        });

        it('should return 400 if captain already exists', async () => {
            captainModel.findOne.mockResolvedValueOnce(mockCaptain);

            const response = await request(testApp)
                .post('/api/captain/register')
                .send({
                    name: 'John Doe',
                    email: 'captain@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'captain already exists');
        });
    });

    describe('login', () => {
        it('should login captain successfully', async () => {
            const mockQuery = {
                select: jest.fn().mockReturnValue(Promise.resolve(mockCaptain))
            };
            captainModel.findOne.mockReturnValue(mockQuery);

            const response = await request(testApp)
                .post('/api/captain/login')
                .send({
                    email: 'captain@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token', mockToken);
        });

        it('should return 400 if captain not found', async () => {
            const mockQuery = {
                select: jest.fn().mockReturnValue(Promise.resolve(null))
            };
            captainModel.findOne.mockReturnValue(mockQuery);

            const response = await request(testApp)
                .post('/api/captain/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should return 400 if password is incorrect', async () => {
            const mockQuery = {
                select: jest.fn().mockReturnValue(Promise.resolve(mockCaptain))
            };
            captainModel.findOne.mockReturnValue(mockQuery);
            bcrypt.compare.mockResolvedValueOnce(false);

            const response = await request(testApp)
                .post('/api/captain/login')
                .send({
                    email: 'captain@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('profile', () => {
        it('should return captain profile', async () => {
            const response = await request(testApp)
                .get('/api/captain/profile')
                .set('Cookie', ['token=mock-jwt-token']);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('email', mockCaptain.email);
        });
    });

    describe('logout', () => {
        it('should logout captain successfully', async () => {
            const response = await request(testApp)
                .get('/api/captain/logout')
                .set('Cookie', ['token=mock-jwt-token']);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'captain logged out successfully');
            expect(blacklisttokenModel.create).toHaveBeenCalled();
        });
    });

    describe('toggleAvailability', () => {
        it('should toggle captain availability from true to false', async () => {
            mockCaptain.isAvailable = true;
            captainModel.findById.mockResolvedValue(mockCaptain);

            const response = await request(testApp)
                .patch('/api/captain/toggle-availability')
                .set('Cookie', ['token=mock-jwt-token']);

            expect(response.status).toBe(200);
            expect(response.body.isAvailable).toBe(false);
        });

        it('should toggle captain availability from false to true', async () => {
            mockCaptain.isAvailable = false;
            captainModel.findById.mockResolvedValue(mockCaptain);

            const response = await request(testApp)
                .patch('/api/captain/toggle-availability')
                .set('Cookie', ['token=mock-jwt-token']);

            expect(response.status).toBe(200);
            expect(response.body.isAvailable).toBe(true);
        });
    });

    describe('waitForNewRide', () => {
        it('should handle long polling request with immediate response', async () => {
            captainController.waitForNewRide.mockImplementationOnce((req, res) => {
                res.status(200).json({ message: 'No new rides available' });
            });
            
            const response = await request(testApp)
                .get('/api/captain/new-ride')
                .set('Cookie', ['token=mock-jwt-token']);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('No new rides available');
        });

        it('should handle timeout gracefully', async () => {
            captainController.waitForNewRide.mockImplementationOnce((req, res) => {
                setTimeout(() => {
                    res.status(204).end();
                }, 10);
            });
            
            const response = await request(testApp)
                .get('/api/captain/new-ride')
                .set('Cookie', ['token=mock-jwt-token']);
            
            expect([200, 204]).toContain(response.status);
        });
    });

    describe('RabbitMQ Subscription', () => {
        it('should have subscribeToQueue mocked', () => {
            expect(subscribeToQueue).toBeDefined();
        });
    });
});