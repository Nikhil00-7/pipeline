
const mongoose = require('mongoose');


const mockConnect = jest.fn().mockResolvedValue({
    connection: {
        readyState: 1
    }
});

module.exports = {
    connect: mockConnect,
    mongoose
};