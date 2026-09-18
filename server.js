const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set!");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ================= MODELS =================
const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// ================= ROUTES =================

// Health check
app.get("/", (req, res) => {
    res.json({ status: "Gĩkũyũ Archive backend is running 🔥" });
});

// Contact form submission
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const newMessage = new Message({ name, email, subject, message });
        await newMessage.save();

        console.log("📩 New contact message from:", name);

        res.json({
            success: true,
            message: "Message received. Asante! We'll get back to you soon."
        });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
});

// View all messages
app.get("/api/contact", async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Gĩkũyũ Archive backend running on port ${PORT}`);
});
