import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import rid from 'connect-rid';
import bodyParser from 'body-parser';
import compression from 'compression';
import errorHandler from 'errorhandler';
import responseTime from 'response-time';
import { parentPort, workerData } from 'worker_threads';
import routes from '../Routes/index.js';

const app = express();
const port = workerData.port;
app.listen(port, () => {});
app.use(rid());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(responseTime());
app.use(errorHandler());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));

Object.keys(routes).forEach(route => {
    const methods = routes[route];
    if (methods.get) {
        app.get(route, methods.get);
    }

    if (methods.post) {
        app.post(route, methods.post);
    }

    if (methods.patch) {
        app.patch(route, methods.patch);
    }

    if (methods.delete) {
        app.delete(route, methods.delete);
    }
});

parentPort.on('message', ({ req, res }) => {
    const mockReq = { method: req.method, url: req.url, body: req.body };
    const mockRes = {
        status: (code) => ({
            send: (body) => parentPort.postMessage({ status: code, body, resId: res.id })
        }),
        send: (body) => parentPort.postMessage({ status: 200, body, resId: res.id })
    };

    const routeHandler = routes[req.url] && routes[req.url][req.method.toLowerCase()];
    if (!routeHandler) {
        return mockRes.status(404).send('Not Found');
    }

    Promise.resolve(routeHandler(mockReq, mockRes)).catch(error => parentPort.postMessage({ error: error.message, resId: res.id }));
});