
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.MONGO_URL = 'mongodb://localhost:27017/test';


global.console.error = jest.fn();
global.console.log = jest.fn();


jest.setTimeout(10000);


afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
});