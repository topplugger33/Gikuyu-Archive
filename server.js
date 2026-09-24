const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) { console.error("❌ MONGO_URI not set!"); process.exit(1); }
if (!JWT_SECRET) { console.error("❌ JWT_SECRET not set!"); process.exit(1); }

mongoose
    .connect(MONGO_URI)
    .then(() => { console.log("✅ Connected to MongoDB"); seedArticles(); })
    .catch((err) => console.error("❌ MongoDB error:", err));

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

const ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "Folklore" },
    image: { type: String, default: "story-1.jpg" },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "Gĩkũyũ Archive" },
    baseLikes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});

const LikeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    date: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);
const Article = mongoose.model("Article", ArticleSchema);
const Like = mongoose.model("Like", LikeSchema);
const Comment = mongoose.model("Comment", CommentSchema);

// ================= SEED =================
async function seedArticles() {
    const count = await Article.countDocuments();
    if (count > 0) { console.log(`📚 Articles already seeded (${count}).`); return; }
    const seedData = [
        { title: "The Legend of Mount Kenya", slug: "legend-of-mount-kenya", category: "Mythology", image: "story-1.jpg", excerpt: "Discover the sacred mythology behind Kĩrĩnyaga, the mountain that served as the throne of Ngai.", content: "Mount Kenya, known to the Agĩkũyũ as Kĩrĩnyaga, is more than a mountain. It is the throne of Ngai (God), the highest point in the land, and the spiritual compass of the Gĩkũyũ people.\n\nAccording to oral tradition, Ngai dwells on the peaks of Kĩrĩnyaga, where the clouds touch the earth. When the first Gĩkũyũ man looked upon the mountain, he knew it was the place where the creator lived.\n\nThe name Kĩrĩnyaga means 'the mountain of whiteness' — a reference to the snow-capped peaks that gleam in the sun." },
        { title: "Wanjiru's Sacrifice", slug: "wanjiru-sacrifice", category: "Folklore", image: "story-2.jpg", excerpt: "The haunting and powerful tale of Wanjiru, whose ultimate sacrifice saved her people from drought.", content: "Wanjiru's story is one of the most powerful and painful tales in Gĩkũyũ oral tradition. It speaks of sacrifice, community, and the sacred bond between the living and the ancestors.\n\nA great drought had fallen upon the land. The elders gathered and prayed, and they were told that the only way to end the drought was for a daughter of the community to be offered as a sacrifice.\n\nWanjiru was chosen. But she was not taken by force — she was asked to give her life willingly. And she did." },
        { title: "The Origin of the Nine Clans", slug: "origin-nine-clans", category: "History", image: "story-3.jpg", excerpt: "How Gĩkũyũ and Mũmbi's daughters married the mysterious strangers from the forest.", content: "The Agĩkũyũ nation traces its roots to a single ancestral couple — Gĩkũyũ and his wife Mũmbi.\n\nOne day, young men began to appear at the homestead. They came from the forest, drawn by something they could not explain.\n\nBut Gĩkũyũ was wise. He tested the men — their courage, honesty, and ability to provide. Only those who passed were allowed to marry into the family.\n\nIn time, nine of these unions were blessed. And from these came the nine clans of the Agĩkũyũ." },
        { title: "Mugumo: The Sacred Fig Tree", slug: "mugumo-sacred-fig-tree", category: "Culture", image: "story-4.jpg", excerpt: "Why the Mugumo tree was revered as a place of prayer, oath-taking, and community gathering.", content: "The Mugumo tree is more than a tree. To the Agĩkũyũ, it is a sacred space — a temple without walls, a witness to history.\n\nWhen someone took a solemn oath, they did so beneath the Mugumo. The tree was considered the dwelling place of ancestral spirits.\n\nEven today, the Mugumo remains significant. Many elders still refuse to cut one down." },
        { title: "The Clever Hare and the Hyena", slug: "clever-hare-and-hyena", category: "Folklore", image: "story-5.jpg", excerpt: "A classic Kikuyu folktale teaching wisdom, patience, and the consequences of greed.", content: "In Gĩkũyũ folklore, Kamũingĩ the hare is the trickster — small, quick-witted, and always one step ahead. The hyena is his opposite: big, strong, greedy, and easily fooled.\n\nOne day, the hare invited the hyena to a feast. But there was a condition — only the clever could attend.\n\nFinally, exhausted, the hyena returned home with nothing. He had learned a lesson: that strength without wisdom is useless." },
        { title: "The First Fire", slug: "first-fire", category: "Mythology", image: "story-6.jpg", excerpt: "The mythological story of how fire was brought to the Agĩkũyũ people.", content: "Before the Agĩkũyũ had fire, they lived in darkness.\n\nOne day, a young man decided to seek fire. He traveled far, past the lands he knew. And there, in a hidden valley, he found a spark.\n\nHe carried it home carefully. And when he arrived, he shared it with his people. And so the elders declared: fire is a gift from the ancestors. It must never be wasted." }
    ];
    try { await Article.insertMany(seedData); console.log(`📚 Seeded ${seedData.length} articles.`); }
    catch (err) { console.error("Seed error:", err); }
}

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Login required." });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid token." });
        req.user = decoded;
        next();
    });
}

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required." });
    }
    next();
}

// ================= PUBLIC ROUTES =================
app.get("/", (req, res) => res.json({ status: "Gĩkũyũ Archive backend is running 🔥" }));

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) return res.status(400).json({ success: false, message: "All fields required." });
        await new Message({ name, email, subject, message }).save();
        res.json({ success: true, message: "Message received. Asante!" });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields required." });
        if (password.length < 6) return res.status(400).json({ success: false, message: "Password too short." });
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ success: false, message: "Email already registered." });
        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: email.toLowerCase(), password: hashed });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ success: true, message: "Account created. Karibu!", token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required." });
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials." });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ success: false, message: "Invalid credentials." });
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ success: true, message: "Karibu tena!", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Not found." });
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/articles", async (req, res) => {
    try {
        const articles = await Article.find().sort({ date: -1 });
        const withCounts = await Promise.all(articles.map(async (a) => {
            const realLikes = await Like.countDocuments({ articleId: a._id });
            const likeCount = (a.baseLikes || 0) + realLikes;
            const commentCount = await Comment.countDocuments({ articleId: a._id });
            return { _id: a._id, title: a.title, slug: a.slug, category: a.category, image: a.image, excerpt: a.excerpt, author: a.author, date: a.date, baseLikes: a.baseLikes || 0, likeCount, commentCount };
        }));
        res.json({ success: true, articles: withCounts });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/articles/:slug", async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        const realLikes = await Like.countDocuments({ articleId: article._id });
        const likeCount = (article.baseLikes || 0) + realLikes;
        const commentCount = await Comment.countDocuments({ articleId: article._id });
        let userHasLiked = false;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const like = await Like.findOne({ userId: decoded.id, articleId: article._id });
                userHasLiked = !!like;
            } catch (e) {}
        }
        res.json({ success: true, article: { ...article.toObject(), likeCount, commentCount, userHasLiked } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/articles/:slug/like", authenticateToken, async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        const existing = await Like.findOne({ userId: req.user.id, articleId: article._id });
        let liked;
        if (existing) { await Like.deleteOne({ _id: existing._id }); liked = false; }
        else { await Like.create({ userId: req.user.id, articleId: article._id }); liked = true; }
        const realLikes = await Like.countDocuments({ articleId: article._id });
        const likeCount = (article.baseLikes || 0) + realLikes;
        res.json({ success: true, liked, likeCount });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/articles/:slug/comments", async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        const comments = await Comment.find({ articleId: article._id }).sort({ date: -1 });
        res.json({ success: true, comments });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/articles/:slug/comments", authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) return res.status(400).json({ success: false, message: "Comment empty." });
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        const comment = await Comment.create({ userId: req.user.id, userName: req.user.name, articleId: article._id, text: text.trim() });
        res.json({ success: true, message: "Comment posted.", comment });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

// ================= ADMIN ROUTES =================
app.get("/api/admin/stats", authenticateToken, isAdmin, async (req, res) => {
    try {
        const [messageCount, userCount, articleCount, commentCount, likeCount] = await Promise.all([
            Message.countDocuments(), User.countDocuments(), Article.countDocuments(),
            Comment.countDocuments(), Like.countDocuments()
        ]);
        res.json({ success: true, stats: { messageCount, userCount, articleCount, commentCount, likeCount } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/admin/messages", authenticateToken, isAdmin, async (req, res) => {
    try { const messages = await Message.find().sort({ date: -1 }); res.json({ success: true, messages }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.delete("/api/admin/messages/:id", authenticateToken, isAdmin, async (req, res) => {
    try { await Message.findByIdAndDelete(req.params.id); res.json({ success: true, message: "Deleted." }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try { const users = await User.find().select("-password").sort({ date: -1 }); res.json({ success: true, users }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.put("/api/admin/users/:id/role", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "contributor", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Not found." });
        res.json({ success: true, message: "Role updated.", user });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.delete("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ userId: req.params.id });
        await Like.deleteMany({ userId: req.params.id });
        res.json({ success: true, message: "User deleted." });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/admin/comments", authenticateToken, isAdmin, async (req, res) => {
    try {
        const comments = await Comment.find().populate("articleId", "title slug").sort({ date: -1 });
        res.json({ success: true, comments });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.delete("/api/admin/comments/:id", authenticateToken, isAdmin, async (req, res) => {
    try { await Comment.findByIdAndDelete(req.params.id); res.json({ success: true, message: "Deleted." }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/admin/articles", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, slug, category, image, excerpt, content, author, baseLikes } = req.body;
        if (!title || !slug || !excerpt || !content) return res.status(400).json({ success: false, message: "Missing fields." });
        const existing = await Article.findOne({ slug });
        if (existing) return res.status(400).json({ success: false, message: "Slug exists." });
        const article = await Article.create({
            title, slug,
            category: category || "Folklore",
            image: image || "story-1.jpg",
            excerpt, content,
            author: author || "Gĩkũyũ Archive",
            baseLikes: Number(baseLikes) || 0
        });
        res.json({ success: true, message: "Article created.", article });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.put("/api/admin/articles/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const update = { ...req.body };
        if (update.baseLikes !== undefined) update.baseLikes = Number(update.baseLikes) || 0;
        const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        res.json({ success: true, message: "Article updated.", article });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.delete("/api/admin/articles/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ articleId: req.params.id });
        await Like.deleteMany({ articleId: req.params.id });
        res.json({ success: true, message: "Article deleted." });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.put("/api/admin/articles/:id/likes", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { baseLikes } = req.body;
        const num = Number(baseLikes);
        if (isNaN(num) || num < 0) return res.status(400).json({ success: false, message: "Invalid number." });
        const article = await Article.findByIdAndUpdate(req.params.id, { baseLikes: num }, { new: true });
        if (!article) return res.status(404).json({ success: false, message: "Not found." });
        const realLikes = await Like.countDocuments({ articleId: article._id });
        res.json({ success: true, message: "Likes adjusted.", baseLikes: num, totalLikes: num + realLikes });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.listen(PORT, () => { console.log(`🚀 Gĩkũyũ Archive backend running on port ${PORT}`); });
