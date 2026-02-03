const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Database configuration
const pool = new Pool({
    connectionString: 'postgresql://cognitive_tests_user:NewPasswordForCognitiveDb-2025!@localhost:5432/cognitive_tests_db'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// Explicitly handle root to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Explicitly handle clean URLs for specific languages to ensure they work
['ru', 'ua', 'en', 'pl', 'cz', 'team', 'team-ua', 'team-en', 'team-pl', 'team-cz'].forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', `${page}.html`));
    });
});

// Create table if not exists
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS landing_waitlist (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                center_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database', err);
    }
};

initDb();

// API Endpoint
app.post('/api/register', async (req, res) => {
    const { email, center_name } = req.body;

    if (!email || !center_name) {
        return res.status(400).json({ error: 'Email and Center Name are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO landing_waitlist (email, center_name) VALUES ($1, $2) RETURNING *',
            [email, center_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving to database', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
