const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

// Basic Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    message: 'Too many requests, please try again later.'
});
app.use('/v1', limiter);

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

// Exclude these domains from registration
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

// JWT Auth Middleware for Dashboard
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Auth Middleware for X-API-Key and X-API-Secret
const authenticateApiKey = async (req, res, next) => {
    // Allow demo endpoint to bypass strict DB check for demonstration purposes,
    // if using the specific demo key mentioned in specs.
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json(formatError('INVALID_API_KEY', 'API key missing or invalid'));
    }

    if (apiKey === 'demo_public_key_for_presentations') {
        req.user = { planType: 'FREE' }; // Demo context
        return next();
    }

    try {
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true }
        });

        if (!keyRecord) {
            return res.status(401).json(formatError('INVALID_API_KEY', 'API key missing or invalid'));
        }

        // Check if it's a write operation (POST, PUT, DELETE, PATCH)
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const apiSecret = req.headers['x-api-secret'];
            if (!apiSecret) {
                return res.status(401).json(formatError('INVALID_API_KEY', 'API secret missing or invalid for write operation'));
            }
            const match = await bcrypt.compare(apiSecret, keyRecord.secretHash);
            if (!match) {
                return res.status(401).json(formatError('INVALID_API_KEY', 'Invalid API secret'));
            }
        }

        req.user = keyRecord.user;
        next();
    } catch (err) {
        return res.status(500).json(formatError('INTERNAL_ERROR', 'Database error during authentication'));
    }
};

const formatResponse = (req, data, startTime) => {
    const responseTime = Date.now() - startTime;
    return {
        success: true,
        count: Array.isArray(data) ? data.length : (data ? 1 : 0),
        data: data,
        meta: {
            requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
            responseTime,
            rateLimit: {
                remaining: req.rateLimit ? req.rateLimit.remaining : 5000,
                limit: req.rateLimit ? req.rateLimit.limit : 5000,
                reset: req.rateLimit ? req.rateLimit.resetTime : new Date(Date.now() + 15*60*1000).toISOString()
            }
        }
    };
};

const formatError = (code, description) => {
    return {
        success: false,
        error: { code, description }
    };
};

// ==========================================
// Auth / Dashboard Routes
// ==========================================

app.post('/v1/auth/register', async (req, res) => {
    const { email, password, businessName, phone } = req.body;

    if (!email || !password || !businessName) {
        return res.status(400).json(formatError('INVALID_INPUT', 'Missing required fields'));
    }

    const domain = email.split('@')[1];
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
        return res.status(400).json(formatError('INVALID_EMAIL', 'Free email providers are not allowed. Please use a business email.'));
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                planType: 'PENDING_APPROVAL'
            }
        });

        res.status(201).json({ success: true, message: 'Registration submitted. Awaiting admin approval.' });
    } catch (err) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Failed to register user. Email might be taken.'));
    }
});

app.post('/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json(formatError('AUTH_FAILED', 'Invalid credentials'));
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, planType: user.planType },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Login failed'));
    }
});

// Exclude routes from API Key authentication
app.use((req, res, next) => {
    if (req.path.startsWith('/v1/auth') || req.path.startsWith('/v1/admin/export')) {
        return next();
    }
    authenticateApiKey(req, res, next);
});

// Admin Exports (Requires JWT)
app.get('/v1/admin/export/json', authenticateJWT, async (req, res) => {
    // Basic export stub, in a real app we'd stream large JSON
    try {
        const data = await prisma.state.findMany({ include: { districts: true } });
        res.setHeader('Content-disposition', 'attachment; filename=export.json');
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify(data));
    } catch (err) {
        res.status(500).send('Export failed');
    }
});

app.get('/v1/admin/export/csv', authenticateJWT, async (req, res) => {
    // Basic CSV stub
    try {
        const data = await prisma.state.findMany();
        let csv = 'ID,Code,Name\n';
        data.forEach(s => csv += `${s.id},${s.code},${s.name}\n`);

        res.setHeader('Content-disposition', 'attachment; filename=export.csv');
        res.setHeader('Content-type', 'text/csv');
        res.send(csv);
    } catch (err) {
        res.status(500).send('Export failed');
    }
});

// ==========================================
// API v1 Routes (Hierarchical Data Fetching)
// ==========================================

app.get('/v1/states', async (req, res) => {
    const startTime = Date.now();
    try {
        const states = await prisma.state.findMany();
        res.json(formatResponse(req, states, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.get('/v1/states/:id/districts', async (req, res) => {
    const startTime = Date.now();
    const stateId = parseInt(req.params.id, 10);
    try {
        const districts = await prisma.district.findMany({
            where: { stateId }
        });
        res.json(formatResponse(req, districts, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.get('/v1/districts/:id/subdistricts', async (req, res) => {
    const startTime = Date.now();
    const districtId = parseInt(req.params.id, 10);
    try {
        const subDistricts = await prisma.subDistrict.findMany({
            where: { districtId }
        });
        res.json(formatResponse(req, subDistricts, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.get('/v1/subdistricts/:id/villages', async (req, res) => {
    const startTime = Date.now();
    const subDistrictId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    try {
        const villages = await prisma.village.findMany({
            where: { subDistrictId },
            take: limit,
            skip: skip
        });
        res.json(formatResponse(req, villages, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.get('/v1/search', async (req, res) => {
    const startTime = Date.now();
    const { q, limit } = req.query;

    if (!q || q.length < 3) {
        return res.status(400).json(formatError('INVALID_QUERY', 'Search query too short or invalid'));
    }

    const takeLimit = parseInt(limit, 10) || 50;

    try {
        const villages = await prisma.village.findMany({
            where: {
                name: { contains: q, mode: 'insensitive' }
            },
            take: takeLimit
        });
        res.json(formatResponse(req, villages, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.get('/v1/autocomplete', async (req, res) => {
    const startTime = Date.now();
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json(formatError('INVALID_QUERY', 'Search query too short or invalid'));
    }

    try {
        const villages = await prisma.village.findMany({
            where: {
                name: { contains: q, mode: 'insensitive' }
            },
            take: 10,
            include: {
                subDistrict: {
                    include: {
                        district: {
                            include: {
                                state: {
                                    include: { country: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const formattedData = villages.map(v => {
            const sd = v.subDistrict;
            const d = sd?.district;
            const s = d?.state;
            const c = s?.country;

            return {
                value: `village_id_${v.id}`,
                label: v.name,
                fullAddress: `${v.name}, ${sd?.name || ''}, ${d?.name || ''}, ${s?.name || ''}, ${c?.name || ''}`,
                hierarchy: {
                    village: v.name,
                    subDistrict: sd?.name,
                    district: d?.name,
                    state: s?.name,
                    country: c?.name
                }
            };
        });

        res.json(formatResponse(req, formattedData, startTime));
    } catch (error) {
        res.status(500).json(formatError('INTERNAL_ERROR', 'Server-side error'));
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
