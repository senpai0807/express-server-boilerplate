import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createColorizedLogger } from '../../Helper/helper.js';

const router = express.Router();
const logger = createColorizedLogger();
const secretKey = process.env.SECRET_KEY;

router.post('/token', async (req, res) => {
    const payload = req.body;
    logger.info(`Received Request [Token Generation]: ${payload.licenseKey}`);

    const payloadString = JSON.stringify(payload);
    const sha256Hash = crypto.createHash('sha256').update(payloadString).digest('hex');
    const token = jwt.sign({ hash: sha256Hash }, secretKey, { expiresIn: '300000' });
    res.status(200).json({ token: token, message: "Successful Validation" });
});

export default router;