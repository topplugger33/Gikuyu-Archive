const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= HELPER: Save message to JSON file =================
const messagesFile = path.join(__dirname, "messages.json");

function saveMessage(message) {
    let messages = [];
    if (fs.existsSync(messagesFile)) {
        const data = fs.readFileSync(messagesFile, "utf8");
        messages = JSON.parse(data);
    }
    messages.push(message);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// ================= ROUTES =================

// Health check — just to confirm the server is alive
app.get("/", (req, res) => {
    res.json({ status: "Gĩkũyũ Archive backend is running 🔥" });
});

// Contact form submission
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    // Save it
    const newMessage = {
        id: Date.now(),
        name,
        email,
        subject,
        message,
        date: new Date().toISOString()
    };
    saveMessage(newMessage);

    console.log("📩 New contact message from:", name);

    res.json({
        success: true,
        message: "Message received. Asante! We'll get back to you soon."
    });
});

// View all messages (for now — later this will be behind an admin login)
app.get("/api/contact", (req, res) => {
    if (!fs.existsSync(messagesFile)) {
        return res.json({ success: true, messages: [] });
    }
    const data = fs.readFileSync(messagesFile, "utf8");
    res.json({ success: true, messages: JSON.parse(data) });
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Gĩkũyũ Archive backend running on http://localhost:${PORT}`);
});
