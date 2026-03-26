const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()
const connect = require('./db/db')
connect()
const userRoutes = require('./routes/user.routes')
const cookieParser = require('cookie-parser')
const rabbitMq = require('./service/rabbit')
const client = require("prom-client");

rabbitMq.connect()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ 
  prefix: 'myapp_', 
  timeout: 5000   
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

app.use('/', userRoutes)

app.get("/health" ,(req , res)=>{
   return res.status(200).json({message: "OK"})
})

module.exports = app

