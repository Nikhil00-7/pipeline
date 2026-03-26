const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const EventEmitter = require('events');

const userController = require('../controllers/user.controller');

// Mock dependencies
jest.mock('../models/user.model');
const userModel = require('../models/user.model');

jest.mock('../models/blacklisttoken.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');

jest.mock('bcryptjs');
const bcrypt = require('bcryptjs');

jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');

jest.mock('../service/rabbit', () => ({
  subscribeToQueue: jest.fn()
}));

// Create EventEmitter
const rideEventEmitter = new EventEmitter();
userController.rideEventEmitter = rideEventEmitter;

// Create express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Auth middleware
const authMiddleware = (req, res, next) => {
  req.user = { _id: "user123", name: "Test User", email: "test@test.com" };
  next();
};

// Routes
app.post('/register', userController.register);
app.post('/login', userController.login);
app.post('/logout', userController.logout);
app.get('/profile', authMiddleware, userController.profile);
app.get('/accepted-ride', authMiddleware, userController.acceptedRide);

// Unauth app
const unauthApp = express();
unauthApp.use(express.json());
unauthApp.use(cookieParser());
unauthApp.get('/profile', userController.profile);

beforeEach(() => {
  jest.clearAllMocks();
  rideEventEmitter.removeAllListeners();
});

afterAll(() => {
  rideEventEmitter.removeAllListeners();
});

describe("User Controller Tests", () => {

  describe("Register", () => {
    it("should register new user successfully", async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue("hashed-password");

      const mockSave = jest.fn().mockResolvedValue({
        _id: "user123",
        name: "John",
        email: "test@test.com",
        _doc: { password: "hashed-password" }
      });

      userModel.mockImplementation(() => ({
        save: mockSave,
        _doc: { password: "hashed-password" }
      }));

      jwt.sign = jest.fn().mockReturnValue("token123");

      const response = await request(app)
        .post('/register')
        .send({
          name: "John",
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token', "token123");
    });

    it("should return error if user already exists", async () => {
      userModel.findOne = jest.fn().mockResolvedValue({ _id: "user123" });

      const response = await request(app)
        .post('/register')
        .send({
          name: "John",
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("User already exists");
    });

    it("should handle registration errors", async () => {
      userModel.findOne = jest.fn().mockRejectedValue(new Error("DB error"));

      const response = await request(app)
        .post('/register')
        .send({
          name: "John",
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(500);
    });
  });

  describe("Login", () => {
    it("should login user successfully", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@test.com",
        password: "hashed-password",
        _doc: { password: "hashed-password" }
      };

      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue("token123");

      const response = await request(app)
        .post('/login')
        .send({
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBe("token123");
    });

    it("should fail if user not found", async () => {
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(400);
    });

    it("should fail if password incorrect", async () => {
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          password: "hashed-password",
          _doc: {}
        })
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send({
          email: "test@test.com",
          password: "wrong"
        });

      expect(response.statusCode).toBe(400);
    });

    it("should handle login errors", async () => {
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error())
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: "test@test.com",
          password: "123456"
        });

      expect(response.statusCode).toBe(500);
    });
  });

  describe("Logout", () => {
    it("should logout user successfully", async () => {
      blacklisttokenModel.create = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .post('/logout')
        .set('Cookie', ['token=test-token']);

      expect(response.statusCode).toBe(200);
    });

    it("should handle logout errors", async () => {
      blacklisttokenModel.create = jest.fn().mockRejectedValue(new Error());

      const response = await request(app)
        .post('/logout')
        .set('Cookie', ['token=test-token']);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("Profile", () => {
    it("should return profile", async () => {
      const response = await request(app).get('/profile');

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toBe("user123");
    });

    it("should return error when not authenticated", async () => {
      const response = await request(unauthApp).get('/profile');

      // ✅ FIXED
      expect(response.statusCode).toBe(401);
    });
  });

  describe("Accepted Ride", () => {

    it("should handle timeout when no ride is accepted", async () => {
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = (cb, ms) => {
        if (ms === 30000) {
          return originalSetTimeout(cb, 10);
        }
        return originalSetTimeout(cb, ms);
      };

      const response = await request(app).get('/accepted-ride');

      global.setTimeout = originalSetTimeout;

      expect(response.statusCode).toBe(204);
    });

// it("should handle when ride is accepted", async () => {
//   const rideData = {
//     rideId: "123",
//     pickup: "Location A",
//     dropoff: "Location B"
//   };


//   const emitter = userController.rideEventEmitter;

//   const responsePromise = request(app).get('/accepted-ride');


//   await new Promise(process.nextTick);


//   emitter.emit('ride-accepted', rideData);

//   const response = await responsePromise;

//   expect(response.statusCode).toBe(200);
//   expect(response.body).toEqual(rideData);
// });

  });

});