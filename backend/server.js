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

// Auth Middleware for X-API-Key and X-API-Secret
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json(formatError('INVALID_API_KEY', 'API key missing or invalid'));
    }

    // Check if it's a write operation (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const apiSecret = req.headers['x-api-secret'];
        if (!apiSecret) {
            return res.status(401).json(formatError('INVALID_API_KEY', 'API secret missing or invalid for write operation'));
        }
    }

    next();
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

app.use('/v1', authenticateApiKey);

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
