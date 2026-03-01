const express = require('express');
const cors = require('cors');
const getCircularChartController = require('./controllers/getCircularChart.controller.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/get/circularchart', async (req, res) => {
    try {
        const params = req.body;
        if (!params.press || !params.date) {
            console.warn('Missing required parameters in request body:', params);
            return res.status(400).json({ status: false, message: 'Missing required parameters: press and date', data: null, err: null });
        }
        const data = await getCircularChartController.getCircularChartData(params);
        data.press = params.press;
        data.date = params.date;
        if (!data.status) {
            console.warn('No data returned from getCircularChartData:', data);
            return res.status(404).json(data);
        } else {
            console.log('Data successfully retrieved for circular chart:', data);
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error('Error in /get/circularchart route', error);
        res.status(500).json({ status: false, message: 'Internal Server Error', errMessage: error.message, errStack: error.stack });
    }
});


const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


function gracefulShutdown() {

    server.close(async () => {

        try {
            const pool1 = require('./config/config.mysql.js');
            await pool1.end();
            console.log('Closed out remaining connections');
        } catch (error) {
            console.error('Error closing MySQL pool', error);
        }
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}
process.on('uncaughtException', err => {
    console.error('Uncaught Exception', {
        message: err.message,
        stack: err.stack
    });
});

process.on('unhandledRejection', err => {
    console.error('Unhandled Promise Rejection', err);
});