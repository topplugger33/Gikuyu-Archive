const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
if (!MONGO_URI) { console.error("❌ MONGO_URI not set!"); process.exit(1); }
if (!JWT_SECRET) { console.error("❌ JWT_SECRET not set!"); process.exit(1); }

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files allowed."));
    }
});

mongoose.connect(MONGO_URI)
    .then(() => { console.log("✅ Connected to MongoDB"); seedArticles(); })
    .catch((err) => console.error("❌ MongoDB error:", err));

// MODELS
const MessageSchema = new mongoose.Schema({ name: String, email: String, subject: String, message: String, date: { type: Date, default: Date.now } });
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
    status: { type: String, enum: ["pending", "published", "rejected"], default: "published" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submitterName: String,
    date: { type: Date, default: Date.now }
});
const LikeSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, articleId: mongoose.Schema.Types.ObjectId, date: { type: Date, default: Date.now } });
const CommentSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, userName: String, articleId: mongoose.Schema.Types.ObjectId, text: String, date: { type: Date, default: Date.now } });

// FORUM MODELS
const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" },
    image: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    baseLikes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});
const PostLikeSchema = new mongoose.Schema({ postId: mongoose.Schema.Types.ObjectId, userId: mongoose.Schema.Types.ObjectId, date: { type: Date, default: Date.now } });
const PostCommentSchema = new mongoose.Schema({ postId: mongoose.Schema.Types.ObjectId, userId: mongoose.Schema.Types.ObjectId, userName: String, text: String, date: { type: Date, default: Date.now } });

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);
const Article = mongoose.model("Article", ArticleSchema);
const Like = mongoose.model("Like", LikeSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Post = mongoose.model("Post", PostSchema);
const PostLike = mongoose.model("PostLike", PostLikeSchema);
const PostComment = mongoose.model("PostComment", PostCommentSchema);

// SEED
async function seedArticles() {
    const count = await Article.countDocuments();
    if (count > 0) return;
    const seedData = [
        { title: "The Legend of Mount Kenya", slug: "legend-of-mount-kenya", category: "Mythology", image: "story-1.jpg", excerpt: "Discover the sacred mythology behind Kĩrĩnyaga.", content: "Mount Kenya, known to the Agĩkũyũ as Kĩrĩnyaga, is more than a mountain.\n\nAccording to oral tradition, Ngai dwells on the peaks of Kĩrĩnyaga.\n\nThe name Kĩrĩnyaga means 'the mountain of whiteness'.", status: "published" },
        { title: "Wanjiru's Sacrifice", slug: "wanjiru-sacrifice", category: "Folklore", image: "story-2.jpg", excerpt: "The haunting tale of Wanjiru's sacrifice.", content: "Wanjiru's story is one of the most powerful tales in Gĩkũyũ oral tradition.\n\nA great drought had fallen upon the land. The elders were told that a daughter must be offered.\n\nWanjiru gave her life willingly.", status: "published" },
        { title: "The Origin of the Nine Clans", slug: "origin-nine-clans", category: "History", image: "story-3.jpg", excerpt: "How the nine clans were born.", content: "The Agĩkũyũ nation traces its roots to Gĩkũyũ and Mũmbi.\n\nYoung men from the forest married their daughters, and nine unions were blessed.", status: "published" },
        { title: "Mugumo: The Sacred Fig Tree", slug: "mugumo-sacred-fig-tree", category: "Culture", image: "story-4.jpg", excerpt: "The sacred Mugumo tree.", content: "The Mugumo tree is a sacred space — a temple without walls.\n\nOaths were taken beneath it.", status: "published" },
        { title: "The Clever Hare and the Hyena", slug: "clever-hare-and-hyena", category: "Folklore", image: "story-5.jpg", excerpt: "A classic folktale about wisdom.", content: "Kamũingĩ the hare is the trickster.\n\nThe hyena learned that strength without wisdom is useless.", status: "published" },
        { title: "The First Fire", slug: "first-fire", category: "Mythology", image: "story-6.jpg", excerpt: "How fire came to the Agĩkũyũ.", content: "Before the Agĩkũyũ had fire, they lived in darkness.\n\nA young man found a spark and brought it home.", status: "published" }
    ];
    await Article.insertMany(seedData);
    console.log(`📚 Seeded ${seedData.length} articles.`);
}

// AUTH
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
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
    next();
}

// PUBLIC
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

// ARTICLES
app.get("/api/articles", async (req, res) => {
    try {
        const articles = await Article.find({ $or: [{ status: "published" }, { status: { $exists: false } }, { status: null }] }).sort({ date: -1 });
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
        if (article.status === "pending" || article.status === "rejected") {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];
            let isAdminUser = false;
            if (token) { try { isAdminUser = jwt.verify(token, JWT_SECRET).role === "admin"; } catch (e) {} }
            if (!isAdminUser) return res.status(404).json({ success: false, message: "Not found." });
        }
        const realLikes = await Like.countDocuments({ articleId: article._id });
        const likeCount = (article.baseLikes || 0) + realLikes;
        const commentCount = await Comment.countDocuments({ articleId: article._id });
        let userHasLiked = false;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) { try { const d = jwt.verify(token, JWT_SECRET); userHasLiked = !!(await Like.findOne({ userId: d.id, articleId: article._id })); } catch (e) {} }
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

// SUBMISSIONS
app.post("/api/submissions", authenticateToken, upload.single("file"), async (req, res) => {
    try {
        const { title, category, excerpt, content, image } = req.body;
        if (!title || !excerpt || !content) return res.status(400).json({ success: false, message: "Title, excerpt, content required." });
        let imageUrl = image || "story-1.jpg";
        if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "gikuyu-archive/submissions", resource_type: "image" });
            imageUrl = result.secure_url;
        }
        let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        let slug = baseSlug;
        let counter = 1;
        while (await Article.findOne({ slug })) { slug = baseSlug + "-" + counter; counter++; }
        const article = await Article.create({ title, slug, category: category || "Community", image: imageUrl, excerpt, content, author: req.user.name, status: "pending", submittedBy: req.user.id, submitterName: req.user.name });
        res.json({ success: true, message: "Story submitted! An admin will review it soon.", article });
    } catch (e) { res.status(500).json({ success: false, message: "Server error: " + e.message }); }
});

app.get("/api/submissions/mine", authenticateToken, async (req, res) => {
    try {
        const subs = await Article.find({ submittedBy: req.user.id }).sort({ date: -1 });
        res.json({ success: true, submissions: subs });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

// ================= FORUM (Public) =================
app.get("/api/forum/posts", async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        const withCounts = await Promise.all(posts.map(async (p) => {
            const realLikes = await PostLike.countDocuments({ postId: p._id });
            const commentCount = await PostComment.countDocuments({ postId: p._id });
            return { _id: p._id, title: p.title, content: p.content, category: p.category, image: p.image, userName: p.userName, userId: p.userId, date: p.date, likeCount: (p.baseLikes || 0) + realLikes, commentCount };
        }));
        res.json({ success: true, posts: withCounts });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/forum/posts/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Not found." });
        const realLikes = await PostLike.countDocuments({ postId: post._id });
        const commentCount = await PostComment.countDocuments({ postId: post._id });
        let userHasLiked = false;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) { try { const d = jwt.verify(token, JWT_SECRET); userHasLiked = !!(await PostLike.findOne({ postId: post._id, userId: d.id })); } catch (e) {} }
        res.json({ success: true, post: { ...post.toObject(), likeCount: (post.baseLikes || 0) + realLikes, commentCount, userHasLiked } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/forum/posts", authenticateToken, upload.single("file"), async (req, res) => {
    try {
        const { title, content, category, image } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required." });
        let imageUrl = image || "";
        if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "gikuyu-archive/forum", resource_type: "image" });
            imageUrl = result.secure_url;
        }
        const post = await Post.create({ title, content, category: category || "General", image: imageUrl, userId: req.user.id, userName: req.user.name });
        res.json({ success: true, message: "Post created.", post });
    } catch (e) { res.status(500).json({ success: false, message: "Server error: " + e.message }); }
});

app.post("/api/forum/posts/:id/like", authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Not found." });
        const existing = await PostLike.findOne({ postId: post._id, userId: req.user.id });
        let liked;
        if (existing) { await PostLike.deleteOne({ _id: existing._id }); liked = false; }
        else { await PostLike.create({ postId: post._id, userId: req.user.id }); liked = true; }
        const realLikes = await PostLike.countDocuments({ postId: post._id });
        const likeCount = (post.baseLikes || 0) + realLikes;
        res.json({ success: true, liked, likeCount });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/forum/posts/:id/comments", async (req, res) => {
    try {
        const comments = await PostComment.find({ postId: req.params.id }).sort({ date: 1 });
        res.json({ success: true, comments });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.post("/api/forum/posts/:id/comments", authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) return res.status(400).json({ success: false, message: "Comment empty." });
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Not found." });
        const comment = await PostComment.create({ postId: post._id, userId: req.user.id, userName: req.user.name, text: text.trim() });
        res.json({ success: true, message: "Comment posted.", comment });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

// ADMIN
app.get("/api/admin/stats", authenticateToken, isAdmin, async (req, res) => {
    try {
        const [messageCount, userCount, articleCount, commentCount, likeCount, pendingCount, postCount] = await Promise.all([
            Message.countDocuments(), User.countDocuments(),
            Article.countDocuments({ $or: [{ status: "published" }, { status: { $exists: false } }, { status: null }] }),
            Comment.countDocuments(), Like.countDocuments(),
            Article.countDocuments({ status: "pending" }), Post.countDocuments()
        ]);
        res.json({ success: true, stats: { messageCount, userCount, articleCount, commentCount, likeCount, pendingCount, postCount } });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get("/api/admin/submissions", authenticateToken, isAdmin, async (req, res) => {
    try { res.json({ success: true, submissions: await Article.find({ status: "pending" }).sort({ date: -1 }) }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.put("/api/admin/submissions/:id/approve", authenticateToken, isAdmin, async (req, res) => {
    try { const a = await Article.findByIdAndUpdate(req.params.id, { status: "published" }, { new: true }); res.json({ success: true, message: "Published!", article: a }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.put("/api/admin/submissions/:id/reject", authenticateToken, isAdmin, async (req, res) => {
    try { const a = await Article.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true }); res.json({ success: true, message: "Rejected.", article: a }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.get("/api/admin/messages", authenticateToken, isAdmin, async (req, res) => {
    try { res.json({ success: true, messages: await Message.find().sort({ date: -1 }) }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.delete("/api/admin/messages/:id", authenticateToken, isAdmin, async (req, res) => {
    try { await Message.findByIdAndDelete(req.params.id); res.json({ success: true, message: "Deleted." }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try { res.json({ success: true, users: await User.find().select("-password").sort({ date: -1 }) }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.put("/api/admin/users/:id/role", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "contributor", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
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
    try { res.json({ success: true, comments: await Comment.find().populate("articleId", "title slug").sort({ date: -1 }) }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.delete("/api/admin/comments/:id", authenticateToken, isAdmin, async (req, res) => {
    try { await Comment.findByIdAndDelete(req.params.id); res.json({ success: true, message: "Deleted." }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.post("/api/admin/upload", authenticateToken, isAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file." });
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, { folder: "gikuyu-archive", resource_type: "image" });
        res.json({ success: true, url: result.secure_url });
    } catch (error) { res.status(500).json({ success: false, message: "Upload failed: " + error.message }); }
});
app.post("/api/admin/articles", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, slug, category, image, excerpt, content, author, baseLikes } = req.body;
        if (!title || !slug || !excerpt || !content) return res.status(400).json({ success: false, message: "Missing fields." });
        if (await Article.findOne({ slug })) return res.status(400).json({ success: false, message: "Slug exists." });
        const article = await Article.create({ title, slug, category: category || "Folklore", image: image || "story-1.jpg", excerpt, content, author: author || "Gĩkũyũ Archive", baseLikes: Number(baseLikes) || 0, status: "published" });
        res.json({ success: true, message: "Article created.", article });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.put("/api/admin/articles/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const update = { ...req.body };
        if (update.baseLikes !== undefined) update.baseLikes = Number(update.baseLikes) || 0;
        const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
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
app.get("/api/admin/articles", authenticateToken, isAdmin, async (req, res) => {
    try {
        const articles = await Article.find().sort({ date: -1 });
        const withCounts = await Promise.all(articles.map(async (a) => {
            const realLikes = await Like.countDocuments({ articleId: a._id });
            const commentCount = await Comment.countDocuments({ articleId: a._id });
            return { _id: a._id, title: a.title, slug: a.slug, category: a.category, image: a.image, excerpt: a.excerpt, author: a.author, date: a.date, baseLikes: a.baseLikes || 0, status: a.status || "published", submitterName: a.submitterName, likeCount: (a.baseLikes || 0) + realLikes, commentCount };
        }));
        res.json({ success: true, articles: withCounts });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.put("/api/admin/articles/:id/likes", authenticateToken, isAdmin, async (req, res) => {
    try {
        const num = Number(req.body.baseLikes);
        if (isNaN(num) || num < 0) return res.status(400).json({ success: false, message: "Invalid." });
        const article = await Article.findByIdAndUpdate(req.params.id, { baseLikes: num }, { new: true });
        const realLikes = await Like.countDocuments({ articleId: article._id });
        res.json({ success: true, message: "Likes adjusted.", baseLikes: num, totalLikes: num + realLikes });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

// Admin Forum moderation
app.get("/api/admin/forum/posts", authenticateToken, isAdmin, async (req, res) => {
    try { res.json({ success: true, posts: await Post.find().sort({ date: -1 }) }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.delete("/api/admin/forum/posts/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        await PostComment.deleteMany({ postId: req.params.id });
        await PostLike.deleteMany({ postId: req.params.id });
        res.json({ success: true, message: "Post deleted." });
    } catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});
app.delete("/api/admin/forum/comments/:id", authenticateToken, isAdmin, async (req, res) => {
    try { await PostComment.findByIdAndDelete(req.params.id); res.json({ success: true, message: "Comment deleted." }); }
    catch (e) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.listen(PORT, () => { console.log(`🚀 Gĩkũyũ Archive backend running on port ${PORT}`); });
