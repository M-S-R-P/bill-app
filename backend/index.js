const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.listen(5000, () => {
    console.log("Listening on port 5000");
});

// Login route

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        if (rows.length === 0 || password != rows[0].password) {
            console.log(
                "Invalid Username/Password",
                rows.length,
                username,
                password,
                req.body
            );
            return res.status(401).json({ error: "Invalid Username/Password" });
        }
        const token = jwt.sign({ id: rows[0].id }, "your_secret_key", {
            expiresIn: "1h",
        });
        res.json({ token });
    } catch (err) {
        res.status(403).json({ error: "DBError" });
        console.log(err);
    }
});

// Authentication Middleware

const authenticate = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "No header provided" });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    jwt.verify(token, "your_secret_key", async (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ error: "Failed to verify token" });
        }
        try {
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE id = $1",
                [decoded.id]
            );
            if (rows.length === 0) {
                return res.status(403).json({ error: "Invalid user" });
            }
            req.user = rows[0];
            next();
        } catch (err) {
            console.log(err);
            return res.status(403).json({ error: "DB Error" });
        }
    });
};

// Fetch Bills route

app.get("/bills", authenticate, async (req, res) => {
    try {
        const response = await pool.query(
            "SELECT * FROM bills WHERE user_id = $1",
            [req.user.id]
        );
        res.json(response.rows);
    } catch (err) {
        console.log(err);
        return res.status(403).json({ error: "DB Error" });
    }
});

// Bill submission route

app.post("/submit", authenticate, async (req, res) => {
    const { user_id } = req.user;
    const { trip_dates_from, trip_dates_to, expenses, justification } =
        req.body;
    if (!trip_dates_from || !trip_dates_to || !expenses || !justification) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const result = await pool.query(
            "INSERT INTO bills (user_id, trip_dates_from, trip_dates_to, expenses, justification) VALUES ($1, $2, $3, $4, $5)",
            [user_id, trip_dates_from, trip_dates_to, expenses, justification]
        );
        res.status(201).json({
            message: "Bill submitted successfully",
            bill: result.rows[0],
        });
    } catch (err) {
        console.log(err);
        res.status(403).json({ error: "DB Error (inserting bill)" });
    }
});

// Bill modification route

app.put("/modify/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { trip_dates_from, trip_dates_to, expenses, justification } =
        req.body;
    if (!trip_dates_from || !trip_dates_to || !expenses || !justification) {
        console.log(req.body, "Missing values");
        return res.status(403).json({ error: "Missing values" });
    }
    try {
        const { rows } = await pool.query(
            "UPDATE bills SET trip_dates_from = $1, trip_dates_to = $2, expenses = $3, justification = $4 WHERE id = $5 RETURNING *",
            [trip_dates_from, trip_dates_to, expenses, justification, id]
        );
        res.status(201).json({
            message: "Modified successfully",
            bill: rows[0]
        });
    } catch (err) {
        console.log(err);
        return res.status(403).json({ error: "DB Error" });
    }
});

// Bill deletion route

app.delete("/delete/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("DELETE FROM bills WHERE id = $1", [
            id,
        ]);
        return res.json({
            message: "Bill deleted successfully",
            bill: rows[0],
        });
    } catch (err) {
        console.log(err);
        res.status(403).json({ error: "Error deleting bill" });
    }
});
