const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set!");
    process.exit(1);
}

if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET environment variable is not set!");
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

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "contributor", "admin"], default: "user" },
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid or expired token." });
        }
        req.user = decoded;
        next();
    });
}

// ================= ROUTES =================

// Health check
app.get("/", (req, res) => {
    res.json({ status: "Gĩkũyũ Archive backend is running 🔥" });
});

// --- CONTACT ROUTES ---
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const newMessage = new Message({ name, email, subject, message });
        await newMessage.save();

        console.log("📩 New contact message from:", name);

        res.json({ success: true, message: "Message received. Asante! We'll get back to you soon." });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});

app.get("/api/contact", async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// --- AUTH ROUTES ---

// Signup
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ New user signed up:", email);

        res.json({
            success: true,
            message: "Account created. Karibu!",
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ User logged in:", email);

        res.json({
            success: true,
            message: "Karibu tena!",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});

// Get current user (requires token)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Gĩkũyũ Archive backend running on port ${PORT}`);
});
