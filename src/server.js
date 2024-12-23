import 'dotenv/config';
import async from 'async';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { Worker } from 'worker_threads';
import { createColorizedLogger } from './Helper/helper.js';

const logger = createColorizedLogger();
const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer() {
    const workerPath = resolve(__dirname, './Config/worker.js');
    const ports = [process.env.SERVER_PORT];
    const workers = ports.map(port => new Worker(workerPath, { workerData: { port } }));
    async.each(workers, (worker, callback) => {
        let callbackCalled = false;
        const safeCallback = (err) => {
            if (!callbackCalled) {
                callbackCalled = true;
                callback(err);
            }
        };

        worker.on('message', (message) => {
            if (message.error) {
                logger.error(`Error from worker: ${message.error}`);
            } else if (message.resId) {
                logger.verbose(`Worker response: ${message.status} - ${message.body}`);
            } else {
                logger.verbose(`Worker started on port ${message.port}`);
            }
        });

        worker.on('error', (error) => {
            logger.error(`Worker error: ${error.message}`);
            safeCallback(error);
        });

        worker.on('exit', (code) => {
            logger.info(`Worker stopped with exit code ${code}`);
            safeCallback(null);
        });
    }, (err) => {
        if (err) {
            logger.error('An error occurred with one of the workers:', err);
        } else {
            logger.info('All workers have been started successfully.');
        }
    });

    logger.info(`Lunar Dashboard Server Online @ Port ${process.env.SERVER_PORT}`);
}

startServer();