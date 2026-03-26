const request = require('supertest');
const express = require('express');
const rideController = require('../controller/ride.controller');

jest.mock('../models/ride.model');
const rideModel = require('../models/ride.model');

jest.mock('../service/rabbit', () => ({
    publishToQueue: jest.fn(),
    subscribeToQueue: jest.fn()
}));
const { publishToQueue } = require('../service/rabbit');

const app = express();
app.use(express.json());


app.use((req, res, next) => {
    req.user = { _id: "user123" };
    next();
});

app.post('/ride', rideController.createRide);
app.get('/ride/accept', rideController.acceptRide);


beforeEach(() => {
    jest.clearAllMocks();
});



describe("Create Ride", () => {

    it("should create ride and publish event", async () => {

        rideModel.prototype.save = jest.fn().mockResolvedValue({
            _id: "ride123",
            pickup: "A",
            destination: "B"
        });

        const res = await request(app)
            .post('/ride')
            .send({ pickup: "A", destination: "B" });

        expect(res.statusCode).toBe(200);
        expect(res.body.pickup).toBe("A");

        expect(publishToQueue).toHaveBeenCalledWith(
            "new-ride",
            expect.any(String)
        );
    });

});



describe("Accept Ride", () => {

    it("should accept ride and publish event", async () => {

        const mockRide = {
            _id: "ride123",
            status: "pending",
            save: jest.fn().mockResolvedValue(true) 
        };

        rideModel.findById = jest.fn().mockResolvedValue(mockRide);

        const res = await request(app)
            .get('/ride/accept?rideId=ride123');

        expect(res.statusCode).toBe(200);
        expect(mockRide.status).toBe("accepted");

        expect(publishToQueue).toHaveBeenCalledWith(
            "ride-accepted",
            expect.any(String)
        );
    });


    it("should return 404 if ride not found", async () => {

        rideModel.findById = jest.fn().mockResolvedValue(null);

        const res = await request(app)
            .get('/ride/accept?rideId=invalid');

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Ride not found");
    });

});