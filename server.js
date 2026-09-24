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
    .then(() => {
        console.log("✅ Connected to MongoDB");
        seedArticles();
    })
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

const ArticleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "Folklore" },
    image: { type: String, default: "story-1.jpg" },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "Gĩkũyũ Archive" },
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

// ================= SEED ARTICLES =================
async function seedArticles() {
    const count = await Article.countDocuments();
    if (count > 0) {
        console.log(`📚 Articles already seeded (${count} articles).`);
        return;
    }

    const seedData = [
        {
            title: "The Legend of Mount Kenya",
            slug: "legend-of-mount-kenya",
            category: "Mythology",
            image: "story-1.jpg",
            excerpt: "Discover the sacred mythology behind Kĩrĩnyaga, the mountain that served as the throne of Ngai and the guiding light for the Agĩkũyũ people.",
            content: "Mount Kenya, known to the Agĩkũyũ as Kĩrĩnyaga, is more than a mountain. It is the throne of Ngai (God), the highest point in the land, and the spiritual compass of the Gĩkũyũ people.\n\nAccording to oral tradition, Ngai dwells on the peaks of Kĩrĩnyaga, where the clouds touch the earth. When the first Gĩkũyũ man, Gĩkũyũ, looked upon the mountain, he knew it was the place where the creator lived. He built his homestead facing the mountain, and his descendants followed.\n\nThe name Kĩrĩnyaga means 'the mountain of whiteness' — a reference to the snow-capped peaks that gleam in the sun. For generations, this sight has reminded the Agĩkũyũ that the divine is always present, watching over them.\n\nWhen elders pray, they face the mountain. When oaths are taken, Kĩrĩnyaga is invoked as a witness. To this day, the mountain remains central to Gĩkũyũ identity — a silent guardian in the sky."
        },
        {
            title: "Wanjiru's Sacrifice",
            slug: "wanjiru-sacrifice",
            category: "Folklore",
            image: "story-2.jpg",
            excerpt: "The haunting and powerful tale of Wanjiru, whose ultimate sacrifice saved her people from drought, a story passed down through generations.",
            content: "Wanjiru's story is one of the most powerful and painful tales in Gĩkũyũ oral tradition. It speaks of sacrifice, community, and the sacred bond between the living and the ancestors.\n\nA great drought had fallen upon the land. The rains had failed, the rivers had dried up, and the people were dying. The elders gathered and prayed, and they were told that the only way to end the drought was for a daughter of the community to be offered as a sacrifice.\n\nWanjiru was chosen. But she was not taken by force — she was asked to give her life willingly. And she did.\n\nAs she was led to the sacred place, the people sang and wept. She was given to the earth, and her blood soaked into the soil. Then, from the sky, the rains came.\n\nThe drought ended. The people were saved. And Wanjiru became a spirit of the land itself, watching over her people forever.\n\nToday, Wanjiru's story is told to remind us of the deepest meaning of community — that we do not exist alone, but as part of something greater than ourselves."
        },
        {
            title: "The Origin of the Nine Clans",
            slug: "origin-nine-clans",
            category: "History",
            image: "story-3.jpg",
            excerpt: "How Gĩkũyũ and Mũmbi's daughters married the mysterious strangers from the forest, forming the nine foundational clans of the Agĩkũyũ nation.",
            content: "The Agĩkũyũ nation traces its roots to a single ancestral couple — Gĩkũyũ and his wife Mũmbi. Together they had daughters, but no sons. And so, when the time came for the family to grow, the daughters would need husbands.\n\nOne day, young men began to appear at the homestead. They came from the forest, from far lands, drawn by something they could not explain. Each one sought the hand of one of Gĩkũyũ's daughters.\n\nBut Gĩkũyũ was wise. He did not give his daughters away easily. He tested the men — their courage, their honesty, their ability to provide and protect. Only those who passed were allowed to marry into the family.\n\nIn time, nine of these unions were blessed. And from these nine marriages came the nine clans of the Agĩkũyũ:\n\nAchera — the brave, with the lion as totem\nAgaciku — the clever, with the monkey as totem\nAmbui — the graceful, with the duiker as totem\nAngari — the strong, with the leopard as totem\nAithiegeni — the communal, with the baboon as totem\nAithiirũ — the resourceful, with the mongoose as totem\nAirimu — the independent, with the wild cat as totem\nAnjiru — the enduring, with the hyena as totem\nEthaga — the powerful, with the buffalo as totem\n\nAnd so the nation grew. Every Mũgĩkũyũ today can trace their lineage back to one of these nine clans — and through them, back to Gĩkũyũ and Mũmbi themselves."
        },
        {
            title: "Mugumo: The Sacred Fig Tree",
            slug: "mugumo-sacred-fig-tree",
            category: "Culture",
            image: "story-4.jpg",
            excerpt: "Why the Mugumo tree was revered as a place of prayer, oath-taking, and community gathering, and how it still holds spiritual significance today.",
            content: "The Mugumo tree is more than a tree. To the Agĩkũyũ, it is a sacred space — a temple without walls, a witness to history, and a bridge between the living and the ancestors.\n\nWhen someone took a solemn oath, they did so beneath the Mugumo. The tree was considered the dwelling place of ancestral spirits, and lying beneath it was believed to bring immediate judgment.\n\nWhen elders gathered to make decisions affecting the community, they often sat under the Mugumo. Its shade was considered a place of wisdom and calm.\n\nWhen a great leader died, they were sometimes buried under the Mugumo. The tree would then become a shrine for that person's spirit, and the community would visit to offer prayers and remember.\n\nEven today, the Mugumo remains significant. Many elders still refuse to cut one down. And in rural areas, you will find ancient Mugumo trees that have stood for centuries — silent witnesses to generation after generation.\n\nThe lesson of the Mugumo is that nature and spirit are one. That the land itself remembers. And that some things are too sacred to be moved."
        },
        {
            title: "The Clever Hare and the Hyena",
            slug: "clever-hare-and-hyena",
            category: "Folklore",
            image: "story-5.jpg",
            excerpt: "A classic Kikuyu folktale teaching wisdom, patience, and the consequences of greed through the rivalry between the hare (Kamũingĩ) and the hyena.",
            content: "In Gĩkũyũ folklore, Kamũingĩ the hare is the trickster — small, quick-witted, and always one step ahead. The hyena (hiti) is his opposite: big, strong, greedy, and easily fooled.\n\nOne day, the hare invited the hyena to a feast. But there was a condition — only the clever could attend, and the hyena would have to prove his cleverness.\n\nThe hyena, desperate for food, agreed. The hare led him on a long journey, full of riddles and tests. Each time, the hyena failed. And each time, the hare found a new reason to delay the feast.\n\nFinally, exhausted and humiliated, the hyena returned home with nothing but hunger. He had learned a lesson: that strength without wisdom is useless, and that greed will always lead you astray.\n\nThe hare, meanwhile, had eaten the entire feast himself. And from that day, the two were rivals forever.\n\nThis story is told to children not just to entertain, but to teach. The hare represents the value of intelligence and caution. The hyena represents the danger of greed and pride. And the feast itself — well, that is life, and how we approach it matters."
        },
        {
            title: "The First Fire",
            slug: "first-fire",
            category: "Mythology",
            image: "story-6.jpg",
            excerpt: "The mythological story of how fire was brought to the Agĩkũyũ people, and the spiritual lessons embedded in the way it was discovered.",
            content: "Before the Agĩkũyũ had fire, they lived in darkness. They ate their food raw, they were cold at night, and they feared the shadows that moved in the forest.\n\nOne day, a young man decided to seek fire. He traveled far, past the lands he knew, into lands that no one had ever seen. And there, in a hidden valley, he found a spark — falling from the sky during a great storm.\n\nHe gathered the spark carefully and wrapped it in dry leaves. He carried it home, protecting it from wind and rain. And when he arrived, he shared it with his people.\n\nBut the fire was not just heat — it was knowledge. With fire came cooking, warmth, and protection. The people gathered around it at night and told stories. The fire became the heart of the homestead.\n\nAnd so the elders declared: fire is a gift from the ancestors. It must never be wasted. It must be cared for. And it must be shared with those who have none.\n\nTo this day, when a new home is built, the first thing that enters it is fire — carried from the family's old home. And with it comes the whole history of the people."
        }
    ];

    try {
        await Article.insertMany(seedData);
        console.log(`📚 Seeded ${seedData.length} articles into the database.`);
    } catch (err) {
        console.error("Seed error:", err);
    }
}

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Login required." });
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

app.get("/", (req, res) => {
    res.json({ status: "Gĩkũyũ Archive backend is running 🔥" });
});

// --- CONTACT ---
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
        res.status(500).json({ success: false, message: "Server error." });
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

// --- AUTH ---
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
        const newUser = new User({ name, email: email.toLowerCase(), password: hashedPassword });
        await newUser.save();
        const token = jwt.sign(
            { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
            JWT_SECRET, { expiresIn: "7d" }
        );
        console.log("✅ New user signed up:", email);
        res.json({
            success: true, message: "Account created. Karibu!", token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required." });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "Invalid email or password." });
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(400).json({ success: false, message: "Invalid email or password." });
        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET, { expiresIn: "7d" }
        );
        console.log("✅ User logged in:", email);
        res.json({
            success: true, message: "Karibu tena!", token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// --- ARTICLES ---
app.get("/api/articles", async (req, res) => {
    try {
        const articles = await Article.find().sort({ date: -1 });
        const withCounts = await Promise.all(articles.map(async (article) => {
            const likeCount = await Like.countDocuments({ articleId: article._id });
            const commentCount = await Comment.countDocuments({ articleId: article._id });
            return {
                _id: article._id,
                title: article.title,
                slug: article.slug,
                category: article.category,
                image: article.image,
                excerpt: article.excerpt,
                author: article.author,
                date: article.date,
                likeCount,
                commentCount
            };
        }));
        res.json({ success: true, articles: withCounts });
    } catch (error) {
        console.error("Get articles error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get("/api/articles/:slug", async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Article not found." });

        const likeCount = await Like.countDocuments({ articleId: article._id });
        const commentCount = await Comment.countDocuments({ articleId: article._id });

        // Check if the current user (if token provided) has liked
        let userHasLiked = false;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const like = await Like.findOne({ userId: decoded.id, articleId: article._id });
                userHasLiked = !!like;
            } catch (e) { /* invalid token — ignore */ }
        }

        res.json({
            success: true,
            article: {
                _id: article._id,
                title: article.title,
                slug: article.slug,
                category: article.category,
                image: article.image,
                excerpt: article.excerpt,
                content: article.content,
                author: article.author,
                date: article.date,
                likeCount,
                commentCount,
                userHasLiked
            }
        });
    } catch (error) {
        console.error("Get article error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Toggle like
app.post("/api/articles/:slug/like", authenticateToken, async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Article not found." });

        const existing = await Like.findOne({ userId: req.user.id, articleId: article._id });
        let liked;
        if (existing) {
            await Like.deleteOne({ _id: existing._id });
            liked = false;
        } else {
            await Like.create({ userId: req.user.id, articleId: article._id });
            liked = true;
        }

        const likeCount = await Like.countDocuments({ articleId: article._id });
        res.json({ success: true, liked, likeCount });
    } catch (error) {
        console.error("Like error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Get comments
app.get("/api/articles/:slug/comments", async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Article not found." });
        const comments = await Comment.find({ articleId: article._id }).sort({ date: -1 });
        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Add comment
app.post("/api/articles/:slug/comments", authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Comment cannot be empty." });
        }
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) return res.status(404).json({ success: false, message: "Article not found." });

        const comment = await Comment.create({
            userId: req.user.id,
            userName: req.user.name,
            articleId: article._id,
            text: text.trim()
        });

        res.json({ success: true, message: "Comment posted.", comment });
    } catch (error) {
        console.error("Comment error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Gĩkũyũ Archive backend running on port ${PORT}`);
});
