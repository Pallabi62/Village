const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory array to simulate database for basic CRUD operations
let villages = [];
let nextId = 1;

// CREATE: Add a new village
app.post('/api/villages', (req, res) => {
    const { state, district, sub_district, name, pin_code } = req.body;

    if (!state || !district || !sub_district || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newVillage = {
        id: nextId++,
        state,
        district,
        sub_district,
        name,
        pin_code: pin_code || null
    };

    villages.push(newVillage);
    res.status(201).json(newVillage);
});

// READ: Get all villages
app.get('/api/villages', (req, res) => {
    res.json(villages);
});

// READ: Search village by ID
app.get('/api/villages/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const village = villages.find(v => v.id === id);

    if (!village) {
        return res.status(404).json({ error: 'Village not found' });
    }

    res.json(village);
});

// UPDATE: Update a village by ID
app.put('/api/villages/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const villageIndex = villages.findIndex(v => v.id === id);

    if (villageIndex === -1) {
        return res.status(404).json({ error: 'Village not found' });
    }

    const { state, district, sub_district, name, pin_code } = req.body;

    // Update fields if provided
    if (state) villages[villageIndex].state = state;
    if (district) villages[villageIndex].district = district;
    if (sub_district) villages[villageIndex].sub_district = sub_district;
    if (name) villages[villageIndex].name = name;
    if (pin_code !== undefined) villages[villageIndex].pin_code = pin_code;

    res.json(villages[villageIndex]);
});

// DELETE: Delete a village by ID
app.delete('/api/villages/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const villageIndex = villages.findIndex(v => v.id === id);

    if (villageIndex === -1) {
        return res.status(404).json({ error: 'Village not found' });
    }

    const deletedVillage = villages.splice(villageIndex, 1)[0];
    res.json({ message: 'Village deleted successfully', village: deletedVillage });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
