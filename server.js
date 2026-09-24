const API_URL = "https://gikuyu-archive-backend.onrender.com";
const WHATSAPP_NUMBER = "254745300241";

window.buildImageUrl = function(imageField) {
    if (!imageField) return "images/story-1.jpg";
    if (imageField.startsWith("http://") || imageField.startsWith("https://")) return imageField;
    return "images/" + imageField;
};

// ================= CART =================
window.getCart = function() {
    try { var raw = localStorage.getItem("cart"); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
};

window.saveCart = function(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.updateCartBadge();
};

window.updateCartBadge = function() {
    var count = window.getCart().reduce(function(sum, item) { return sum + (item.qty || 1); }, 0);
    document.querySelectorAll(".cart-count").forEach(function(el) { el.textContent = count; });
    var navCart = document.getElementById("navCartLink");
    if (navCart) navCart.style.display = "inline-flex";
};

window.handleAddToCart = function(btn) {
    var id = btn.getAttribute("data-id");
    var name = btn.getAttribute("data-name");
    var price = btn.getAttribute("data-price");
    var image = btn.getAttribute("data-image");
    var qty = 1;
    var selector = document.querySelector('.qty-selector[data-id="' + id + '"]');
    if (selector) {
        var input = selector.querySelector(".qty-input");
        if (input) qty = parseInt(input.value) || 1;
    }
    var cart = window.getCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
        if (String(cart[i].id) === String(id)) { existing = cart[i]; break; }
    }
    if (existing) { existing.qty = (existing.qty || 1) + qty; }
    else { cart.push({ id: String(id), name: name, price: Number(price), image: image, qty: qty }); }
    window.saveCart(cart);
    var original = btn.textContent;
    btn.textContent = "Added " + qty + " ✓";
    btn.style.backgroundColor = "#4ade80";
    btn.style.color = "#0d1f16";
    setTimeout(function() {
        btn.textContent = original;
        btn.style.backgroundColor = "";
        btn.style.color = "";
        if (selector) { var inp = selector.querySelector(".qty-input"); if (inp) inp.value = 1; }
    }, 1500);
};

window.changeQty = function(id, delta) {
    var cart = window.getCart();
    var item = null;
    for (var i = 0; i < cart.length; i++) {
        if (String(cart[i].id) === String(id)) { item = cart[i]; break; }
    }
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) { cart = cart.filter(function(i) { return String(i.id) !== String(id); }); }
    window.saveCart(cart);
    window.renderCartPage();
};

window.removeFromCart = function(id) {
    var cart = window.getCart().filter(function(i) { return String(i.id) !== String(id); });
    window.saveCart(cart);
    window.renderCartPage();
};

window.clearCart = function() {
    if (!confirm("Clear your entire cart?")) return;
    localStorage.removeItem("cart");
    window.updateCartBadge();
    window.renderCartPage();
};

window.renderCartPage = function() {
    var container = document.getElementById("cartItems");
    var empty = document.getElementById("cartEmpty");
    var summary = document.getElementById("cartSummary");
    if (!container || !empty || !summary) return;
    var cart = window.getCart();
    if (cart.length === 0) {
        container.innerHTML = "";
        empty.style.display = "block";
        summary.style.display = "none";
        return;
    }
    empty.style.display = "none";
    summary.style.display = "block";
    var total = 0;
    var html = "";
    cart.forEach(function(item) {
        var lineTotal = item.price * item.qty;
        total += lineTotal;
        html += '<div class="cart-item">' +
            '<img src="' + window.buildImageUrl(item.image) + '" alt="' + item.name + '" class="cart-item-image">' +
            '<div class="cart-item-info"><h3>' + item.name + '</h3><p class="cart-item-price">KSh ' + item.price.toLocaleString() + ' each</p></div>' +
            '<div class="cart-item-qty"><button type="button" onclick="changeQty(\'' + item.id + '\', -1)">−</button><span>' + item.qty + '</span><button type="button" onclick="changeQty(\'' + item.id + '\', 1)">+</button></div>' +
            '<div class="cart-item-subtotal">KSh ' + lineTotal.toLocaleString() + '</div>' +
            '<button class="remove-item" type="button" onclick="removeFromCart(\'' + item.id + '\')">&times;</button>' +
        '</div>';
    });
    container.innerHTML = html;
    document.getElementById("cartTotal").textContent = "KSh " + total.toLocaleString();
};

window.checkoutWhatsApp = function() {
    var cart = window.getCart();
    if (cart.length === 0) return;
    var nameEl = document.getElementById("customerName");
    var locationEl = document.getElementById("customerLocation");
    var notesEl = document.getElementById("customerNotes");
    var name = nameEl ? nameEl.value.trim() : "";
    var location = locationEl ? locationEl.value.trim() : "";
    var notes = notesEl ? notesEl.value.trim() : "";
    if (!name || !location) { alert("Please fill in your name and delivery location."); return; }
    var total = 0;
    var lines = cart.map(function(item) {
        var lineTotal = item.price * item.qty;
        total += lineTotal;
        return "• " + item.name + " × " + item.qty + " — KSh " + lineTotal.toLocaleString();
    });
    var message = "Habari Gĩkũyũ Archive! 🛒\n\nI would like to place an order:\n\n" + lines.join("\n") + "\n\n*Total: KSh " + total.toLocaleString() + "*\n\n👤 Name: " + name + "\n📍 Location: " + location + (notes ? "\n📝 Notes: " + notes : "") + "\n\nAsante!";
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank");
};

// ================= PAGE INIT =================
document.addEventListener("DOMContentLoaded", function() {

    // Cart
    try {
        window.updateCartBadge();
        var shopLink = document.querySelector('nav ul li a[href="shop.html"]');
        if (shopLink && !document.getElementById("navCartLink")) {
            var cartLi = document.createElement("li");
            cartLi.innerHTML = '<a href="cart.html" class="cart-nav-link" id="navCartLink" style="display:none;"><span>🛒</span> Cart <span class="cart-count">0</span></a>';
            shopLink.parentElement.after(cartLi);
            window.updateCartBadge();
        }
    } catch (e) {}

    // Qty selectors
    document.querySelectorAll(".qty-selector").forEach(function(selector) {
        var minusBtn = selector.querySelector(".qty-minus");
        var plusBtn = selector.querySelector(".qty-plus");
        var input = selector.querySelector(".qty-input");
        if (minusBtn && input) minusBtn.addEventListener("click", function() { var v = parseInt(input.value) || 1; if (v > 1) input.value = v - 1; });
        if (plusBtn && input) plusBtn.addEventListener("click", function() { var v = parseInt(input.value) || 1; if (v < 99) input.value = v + 1; });
    });

    // Hamburger
    var hamburger = document.getElementById("hamburgerBtn");
    var mainNav = document.getElementById("mainNav");
    if (hamburger && mainNav) {
        hamburger.addEventListener("click", function() {
            hamburger.classList.toggle("open");
            mainNav.classList.toggle("open");
        });
        mainNav.querySelectorAll("a").forEach(function(link) {
            link.addEventListener("click", function() {
                hamburger.classList.remove("open");
                mainNav.classList.remove("open");
            });
        });
    }

    // Auth
    var token = localStorage.getItem("token");
    var user = null;
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}
    var authNavItem = document.getElementById("authNavItem");

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

    if (authNavItem && token && user && authNavItem.id === "authNavItem" && !document.getElementById("logoutBtn")) {
        authNavItem.innerHTML = '<a href="#" id="userGreeting" style="color:#c99f4b;">Hi, ' + user.name.split(" ")[0] + '</a> <a href="#" id="logoutBtn2" style="color:#c99f4b;">Logout</a>';
        document.getElementById("logoutBtn2").addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

    // Proverb
    var closeProverbBtn = document.getElementById("closeProverbBtn");
    if (closeProverbBtn) closeProverbBtn.addEventListener("click", function() { document.getElementById("proverbWidget").style.display = "none"; });

    // Newsletter
    var newsletterPopup = document.getElementById("newsletterPopup");
    var closeNewsletterBtn = document.getElementById("closeNewsletterBtn");
    if (newsletterPopup) {
        setTimeout(function() { newsletterPopup.classList.add("show"); }, 3000);
        setTimeout(function() { newsletterPopup.classList.remove("show"); }, 15000);
        if (closeNewsletterBtn) closeNewsletterBtn.addEventListener("click", function() { newsletterPopup.classList.remove("show"); });
    }

    // Contact
    var contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var status = document.getElementById("formStatus");
            var data = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                subject: document.getElementById("subject").value,
                message: document.getElementById("message").value
            };
            status.textContent = "Sending...";
            status.style.color = "#c99f4b";
            fetch(API_URL + "/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
                .then(function(r) { return r.json(); })
                .then(function(result) {
                    if (result.success) { status.textContent = "✅ " + result.message; status.style.color = "#4ade80"; contactForm.reset(); }
                    else { status.textContent = "❌ " + result.message; status.style.color = "#ef4444"; }
                }).catch(function() { status.textContent = "❌ Server unreachable."; status.style.color = "#ef4444"; });
        });
    }

    // Signup
    var signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var status = document.getElementById("signupStatus");
            var data = {
                name: document.getElementById("signupName").value,
                email: document.getElementById("signupEmail").value,
                password: document.getElementById("signupPassword").value
            };
            status.textContent = "Creating account...";
            status.style.color = "#c99f4b";
            fetch(API_URL + "/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
                .then(function(r) { return r.json(); })
                .then(function(result) {
                    if (result.success) {
                        localStorage.setItem("token", result.token);
                        localStorage.setItem("user", JSON.stringify(result.user));
                        status.textContent = "✅ " + result.message + " Redirecting...";
                        status.style.color = "#4ade80";
                        setTimeout(function() { window.location.href = "index.html"; }, 1200);
                    } else { status.textContent = "❌ " + result.message; status.style.color = "#ef4444"; }
                }).catch(function() { status.textContent = "❌ Server unreachable."; status.style.color = "#ef4444"; });
        });
    }

    // Login
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var status = document.getElementById("loginStatus");
            var data = {
                email: document.getElementById("loginEmail").value,
                password: document.getElementById("loginPassword").value
            };
            status.textContent = "Logging in...";
            status.style.color = "#c99f4b";
            fetch(API_URL + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
                .then(function(r) { return r.json(); })
                .then(function(result) {
                    if (result.success) {
                        localStorage.setItem("token", result.token);
                        localStorage.setItem("user", JSON.stringify(result.user));
                        status.textContent = "✅ " + result.message + " Redirecting...";
                        status.style.color = "#4ade80";
                        var dest = result.user.role === "admin" ? "admin.html" : "index.html";
                        setTimeout(function() { window.location.href = dest; }, 1200);
                    } else { status.textContent = "❌ " + result.message; status.style.color = "#ef4444"; }
                }).catch(function() { status.textContent = "❌ Server unreachable."; status.style.color = "#ef4444"; });
        });
    }

    // Stories
    var storyGrid = document.getElementById("storyGrid");
    if (storyGrid) loadArticles(storyGrid);
    var articleSection = document.getElementById("articleSection");
    if (articleSection) loadSingleArticle(articleSection);

    // Admin
    if (document.querySelector(".admin-container")) initAdminPanel();

    // Submit Story page
    if (document.getElementById("submitStoryForm")) initSubmitStory();

    // Forum page
    if (document.getElementById("forumPostsList")) initForumPage();

    // Single forum post page
    if (document.getElementById("forumPostSection")) initForumPostPage();

    // Videos page
    if (document.getElementById("videosGrid")) initVideosPage();

    // Rũracio gate
    initRuracioGate();
});

// ================= ARTICLES =================
async function loadArticles(container) {
    try {
        const response = await fetch(API_URL + "/api/articles");
        const data = await response.json();
        if (!data.success || data.articles.length === 0) {
            container.innerHTML = '<p style="color:#b0b0b0; text-align:center; grid-column: 1 / -1;">No stories yet.</p>';
            return;
        }
        container.innerHTML = data.articles.map(article => `
            <div class="story-card">
                <img src="${window.buildImageUrl(article.image)}" alt="${article.title}" class="card-image">
                <div class="story-card-content">
                    <h3>${article.title}</h3>
                    <p>${article.excerpt}</p>
                    <div class="story-stats"><span>❤️ ${article.likeCount}</span><span>💬 ${article.commentCount}</span></div>
                    <a href="article.html?slug=${article.slug}" class="read-more">Read Story &rarr;</a>
                </div>
            </div>
        `).join("");
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444; text-align:center; grid-column: 1 / -1;">Could not load stories.</p>';
    }
}

async function loadSingleArticle(container) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) { container.innerHTML = '<p style="color:#ef4444;">No article specified.</p>'; return; }
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(API_URL + "/api/articles/" + slug, { headers: token ? { "Authorization": "Bearer " + token } : {} });
        const data = await response.json();
        if (!data.success) { container.innerHTML = '<p style="color:#ef4444;">Article not found.</p>'; return; }
        const a = data.article;
        document.title = a.title + " | Gĩkũyũ Archive";
        container.innerHTML = `
            <div class="article-container">
                <a href="stories.html" class="back-link">&larr; Back to Stories</a>
                <div class="article-header">
                    <p class="article-category">${a.category}</p>
                    <h1>${a.title}</h1>
                    <p class="article-meta">By ${a.author} · ${new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <img src="${window.buildImageUrl(a.image)}" alt="${a.title}" class="article-hero-image">
                <div class="article-content">${a.content.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>
                <div class="article-actions">
                    <button class="like-btn ${a.userHasLiked ? 'liked' : ''}" id="likeBtn" data-slug="${a.slug}">
                        <span id="heartIcon">${a.userHasLiked ? '❤️' : '🤍'}</span>
                        <span id="likeCount">${a.likeCount}</span>
                    </button>
                </div>
                <div class="comments-section">
                    <h2>Comments (${a.commentCount})</h2>
                    <div id="commentFormBox" class="comment-form-box"></div>
                    <div id="commentsList" class="comments-list"><p style="color:#888;">Loading comments...</p></div>
                </div>
            </div>`;
        setupLikeButton(a.slug);
        setupCommentForm(a.slug);
        loadComments(a.slug);
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444;">Could not load article.</p>';
    }
}

function setupLikeButton(slug) {
    const likeBtn = document.getElementById("likeBtn");
    if (!likeBtn) return;
    likeBtn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) { alert("Please log in to like this story."); window.location.href = "login.html"; return; }
        try {
            const response = await fetch(API_URL + "/api/articles/" + slug + "/like", { method: "POST", headers: { "Authorization": "Bearer " + token } });
            const data = await response.json();
            if (data.success) {
                document.getElementById("heartIcon").textContent = data.liked ? "❤️" : "🤍";
                document.getElementById("likeCount").textContent = data.likeCount;
                likeBtn.classList.toggle("liked", data.liked);
            }
        } catch (error) {}
    });
}

function setupCommentForm(slug) {
    const box = document.getElementById("commentFormBox");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user) {
        box.innerHTML = '<p class="login-to-comment"><a href="login.html">Log in</a> to leave a comment.</p>';
        return;
    }
    box.innerHTML = '<form id="commentForm" class="comment-form"><textarea id="commentText" placeholder="Share your thoughts..." rows="3" required></textarea><button type="submit" class="btn-primary">Post Comment</button><p id="commentStatus" class="auth-status"></p></form>';
    document.getElementById("commentForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const text = document.getElementById("commentText").value;
        const status = document.getElementById("commentStatus");
        status.textContent = "Posting...";
        status.style.color = "#c99f4b";
        try {
            const response = await fetch(API_URL + "/api/articles/" + slug + "/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            if (data.success) {
                document.getElementById("commentText").value = "";
                status.textContent = "✅ Posted!";
                status.style.color = "#4ade80";
                loadComments(slug);
            } else { status.textContent = "❌ " + data.message; status.style.color = "#ef4444"; }
        } catch (error) { status.textContent = "❌ Could not post."; status.style.color = "#ef4444"; }
    });
}

async function loadComments(slug) {
    const list = document.getElementById("commentsList");
    if (!list) return;
    try {
        const response = await fetch(API_URL + "/api/articles/" + slug + "/comments");
        const data = await response.json();
        if (!data.success || data.comments.length === 0) { list.innerHTML = '<p style="color:#888;">No comments yet.</p>'; return; }
        list.innerHTML = data.comments.map(c => `
            <div class="comment-item">
                <div class="comment-header"><strong>${c.userName}</strong><span class="comment-date">${new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <p class="comment-text">${c.text}</p>
            </div>`).join("");
    } catch (error) { list.innerHTML = '<p style="color:#ef4444;">Could not load comments.</p>'; }
}

// ================= SUBMIT STORY =================
function initSubmitStory() {
    const submitForm = document.getElementById("submitStoryForm");
    const authCheck = document.getElementById("submitAuthCheck");
    const mySection = document.getElementById("mySubmissionsSection");
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
        if (authCheck) authCheck.style.display = "block";
        if (submitForm) submitForm.style.display = "none";
        return;
    }

    if (authCheck) authCheck.style.display = "none";
    if (submitForm) submitForm.style.display = "flex";
    if (mySection) mySection.style.display = "block";

    const fileInput = document.getElementById("submitImageFile");
    const statusEl = document.getElementById("submitImageStatus");
    const previewBox = document.getElementById("submitImagePreviewBox");
    const previewImg = document.getElementById("submitImagePreviewImg");
    const removeBtn = document.getElementById("submitRemoveImageBtn");

    if (fileInput) {
        fileInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImg.src = e.target.result;
                previewBox.style.display = "flex";
                statusEl.textContent = "Image ready. Will upload on submit.";
                statusEl.style.color = "#4ade80";
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", function () {
            fileInput.value = "";
            previewImg.src = "";
            previewBox.style.display = "none";
            statusEl.textContent = "No image selected.";
            statusEl.style.color = "#aaa";
        });
    }

    submitForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const status = document.getElementById("submitStatus");
        status.textContent = "Submitting...";
        status.style.color = "#c99f4b";

        const formData = new FormData();
        formData.append("title", document.getElementById("submitTitle").value);
        formData.append("category", document.getElementById("submitCategory").value);
        formData.append("excerpt", document.getElementById("submitExcerpt").value);
        formData.append("content", document.getElementById("submitContent").value);
        if (fileInput.files[0]) formData.append("file", fileInput.files[0]);

        try {
            const r = await fetch(API_URL + "/api/submissions", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token },
                body: formData
            });
            const d = await r.json();
            if (d.success) {
                status.textContent = "✅ " + d.message;
                status.style.color = "#4ade80";
                submitForm.reset();
                previewBox.style.display = "none";
                statusEl.textContent = "No image selected.";
                loadMySubmissions();
            } else {
                status.textContent = "❌ " + d.message;
                status.style.color = "#ef4444";
            }
        } catch (err) {
            status.textContent = "❌ Server error.";
            status.style.color = "#ef4444";
        }
    });

    async function loadMySubmissions() {
        const list = document.getElementById("mySubmissionsList");
        try {
            const r = await fetch(API_URL + "/api/submissions/mine", {
                headers: { "Authorization": "Bearer " + token }
            });
            const d = await r.json();
            if (!d.success || d.submissions.length === 0) {
                list.innerHTML = '<p style="color:#888;">No submissions yet.</p>';
                return;
            }
            list.innerHTML = d.submissions.map(s => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${s.title}</h4>
                        <p style="color:#888;font-size:0.85rem;">${new Date(s.date).toLocaleDateString()} · Status: <strong style="color:${s.status === 'published' ? '#4ade80' : s.status === 'rejected' ? '#ef4444' : '#c99f4b'};">${s.status}</strong></p>
                    </div>
                </div>`).join("");
        } catch (e) {}
    }

    loadMySubmissions();
}

// ================= FORUM PAGE =================
function initForumPage() {
    const list = document.getElementById("forumPostsList");
    if (!list) return;

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const authCheck = document.getElementById("forumAuthCheck");
    const newPostBox = document.getElementById("newPostBox");

    if (token && user) {
        if (authCheck) authCheck.style.display = "none";
        if (newPostBox) newPostBox.style.display = "block";
        setupNewPostForm(token);
    } else {
        if (authCheck) authCheck.style.display = "flex";
        if (newPostBox) newPostBox.style.display = "none";
    }

    loadForumPosts(list);
}

async function loadForumPosts(container) {
    try {
        const r = await fetch(API_URL + "/api/forum/posts");
        const d = await r.json();
        if (!d.success || d.posts.length === 0) {
            container.innerHTML = '<p style="color:#888; text-align:center;">No discussions yet. Be the first to start one.</p>';
            return;
        }
        container.innerHTML = d.posts.map(p => `
            <a href="forum-post.html?id=${p._id}" class="forum-post-card">
                ${p.image ? `<img src="${window.buildImageUrl(p.image)}" alt="${p.title}" class="forum-post-image">` : ''}
                <div class="forum-post-body">
                    <p class="forum-post-category">${p.category}</p>
                    <h3>${p.title}</h3>
                    <p class="forum-post-preview">${p.content.substring(0, 160)}${p.content.length > 160 ? "..." : ""}</p>
                    <div class="forum-post-meta">
                        <span>By ${p.userName}</span>
                        <span>${new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>❤️ ${p.likeCount}</span>
                        <span>💬 ${p.commentCount}</span>
                    </div>
                </div>
            </a>
        `).join("");
    } catch (e) {
        container.innerHTML = '<p style="color:#ef4444; text-align:center;">Could not load discussions.</p>';
    }
}

function setupNewPostForm(token) {
    const form = document.getElementById("newPostForm");
    if (!form) return;
    const fileInput = document.getElementById("postImageFile");
    const statusEl = document.getElementById("postImageStatus");
    const previewBox = document.getElementById("postImagePreviewBox");
    const previewImg = document.getElementById("postImagePreviewImg");
    const removeBtn = document.getElementById("postRemoveImageBtn");

    if (fileInput) {
        fileInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImg.src = e.target.result;
                previewBox.style.display = "flex";
                statusEl.textContent = "Image ready. Will upload on post.";
                statusEl.style.color = "#4ade80";
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener("click", function () {
            fileInput.value = "";
            previewImg.src = "";
            previewBox.style.display = "none";
            statusEl.textContent = "No image selected.";
            statusEl.style.color = "#aaa";
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const status = document.getElementById("postStatus");
        status.textContent = "Posting...";
        status.style.color = "#c99f4b";

        const formData = new FormData();
        formData.append("title", document.getElementById("postTitle").value);
        formData.append("category", document.getElementById("postCategory").value);
        formData.append("content", document.getElementById("postContent").value);
        if (fileInput.files[0]) formData.append("file", fileInput.files[0]);

        try {
            const r = await fetch(API_URL + "/api/forum/posts", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token },
                body: formData
            });
            const d = await r.json();
            if (d.success) {
                status.textContent = "✅ Posted!";
                status.style.color = "#4ade80";
                form.reset();
                previewBox.style.display = "none";
                statusEl.textContent = "No image selected.";
                loadForumPosts(document.getElementById("forumPostsList"));
            } else {
                status.textContent = "❌ " + d.message;
                status.style.color = "#ef4444";
            }
        } catch (err) {
            status.textContent = "❌ Server error.";
            status.style.color = "#ef4444";
        }
    });
}

// ================= SINGLE FORUM POST =================
function initForumPostPage() {
    const section = document.getElementById("forumPostSection");
    if (!section) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) { section.innerHTML = '<p style="color:#ef4444; text-align:center;">No discussion specified.</p>'; return; }
    loadForumPost(section, id);
}

async function loadForumPost(container, id) {
    const token = localStorage.getItem("token");
    try {
        const r = await fetch(API_URL + "/api/forum/posts/" + id, {
            headers: token ? { "Authorization": "Bearer " + token } : {}
        });
        const d = await r.json();
        if (!d.success) { container.innerHTML = '<p style="color:#ef4444; text-align:center;">Discussion not found.</p>'; return; }

        const p = d.post;
        document.title = p.title + " | Gĩkũyũ Archive";

        container.innerHTML = `
            <div class="forum-post-container">
                <a href="forum.html" class="back-link">&larr; Back to Forum</a>
                <div class="forum-post-header">
                    <p class="article-category">${p.category}</p>
                    <h1>${p.title}</h1>
                    <p class="article-meta">By ${p.userName} · ${new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                ${p.image ? `<img src="${window.buildImageUrl(p.image)}" alt="${p.title}" class="article-hero-image">` : ''}
                <div class="article-content">${p.content.split("\n\n").map(par => `<p>${par}</p>`).join("")}</div>
                <div class="article-actions">
                    <button class="like-btn ${p.userHasLiked ? 'liked' : ''}" id="forumLikeBtn">
                        <span id="forumHeartIcon">${p.userHasLiked ? '❤️' : '🤍'}</span>
                        <span id="forumLikeCount">${p.likeCount}</span>
                    </button>
                </div>
                <div class="comments-section">
                    <h2>Replies (${p.commentCount})</h2>
                    <div id="forumCommentFormBox" class="comment-form-box"></div>
                    <div id="forumCommentsList" class="comments-list"><p style="color:#888;">Loading replies...</p></div>
                </div>
            </div>
        `;

        setupForumLike(p._id);
        setupForumCommentForm(p._id);
        loadForumComments(p._id);
    } catch (e) {
        container.innerHTML = '<p style="color:#ef4444; text-align:center;">Could not load discussion.</p>';
    }
}

function setupForumLike(postId) {
    const btn = document.getElementById("forumLikeBtn");
    if (!btn) return;
    btn.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) { alert("Please log in to like."); window.location.href = "login.html"; return; }
        try {
            const r = await fetch(API_URL + "/api/forum/posts/" + postId + "/like", {
                method: "POST", headers: { "Authorization": "Bearer " + token }
            });
            const d = await r.json();
            if (d.success) {
                document.getElementById("forumHeartIcon").textContent = d.liked ? "❤️" : "🤍";
                document.getElementById("forumLikeCount").textContent = d.likeCount;
                btn.classList.toggle("liked", d.liked);
            }
        } catch (e) {}
    });
}

function setupForumCommentForm(postId) {
    const box = document.getElementById("forumCommentFormBox");
    if (!box) return;
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user) {
        box.innerHTML = '<p class="login-to-comment"><a href="login.html">Log in</a> to reply.</p>';
        return;
    }
    box.innerHTML = '<form id="forumCommentForm" class="comment-form"><textarea id="forumCommentText" placeholder="Write a reply..." rows="3" required></textarea><button type="submit" class="btn-primary">Post Reply</button><p id="forumCommentStatus" class="auth-status"></p></form>';
    document.getElementById("forumCommentForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const text = document.getElementById("forumCommentText").value;
        const status = document.getElementById("forumCommentStatus");
        status.textContent = "Posting...";
        status.style.color = "#c99f4b";
        try {
            const r = await fetch(API_URL + "/api/forum/posts/" + postId + "/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ text })
            });
            const d = await r.json();
            if (d.success) {
                document.getElementById("forumCommentText").value = "";
                status.textContent = "✅ Posted!";
                status.style.color = "#4ade80";
                loadForumComments(postId);
            } else { status.textContent = "❌ " + d.message; status.style.color = "#ef4444"; }
        } catch (e) { status.textContent = "❌ Could not post."; status.style.color = "#ef4444"; }
    });
}

async function loadForumComments(postId) {
    const list = document.getElementById("forumCommentsList");
    if (!list) return;
    try {
        const r = await fetch(API_URL + "/api/forum/posts/" + postId + "/comments");
        const d = await r.json();
        if (!d.success || d.comments.length === 0) { list.innerHTML = '<p style="color:#888;">No replies yet.</p>'; return; }
        list.innerHTML = d.comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <strong>${c.userName}</strong>
                    <span class="comment-date">${new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p class="comment-text">${c.text}</p>
            </div>`).join("");
    } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Could not load replies.</p>'; }
}

// ================= VIDEOS + GATED CONTENT =================
function initVideosPage() {
    const grid = document.getElementById("videosGrid");
    if (!grid) return;

    const token = localStorage.getItem("token");

    fetch(API_URL + "/api/videos", {
        headers: token ? { "Authorization": "Bearer " + token } : {}
    })
        .then(r => r.json())
        .then(d => {
            if (!d.success || d.videos.length === 0) {
                grid.innerHTML = '<p style="color:#888; text-align:center;">No videos yet.</p>';
                return;
            }
            grid.innerHTML = d.videos.map(v => renderVideoCard(v)).join("");
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:#ef4444; text-align:center;">Could not load videos.</p>';
        });
}

function renderVideoCard(v) {
    if (v.locked) {
        return `
            <div class="video-card gated">
                <div class="video-wrapper locked-overlay">
                    <div class="video-lock-icon">🔒</div>
                    <p class="video-lock-text">Members Only</p>
                </div>
                <div class="video-info">
                    <p class="video-category">${v.category}</p>
                    <h3>${v.title}</h3>
                    <p>${v.description}</p>
                    <div class="video-locked-actions">
                        <a href="signup.html" class="btn-primary btn-tiny">Register Free</a>
                        <a href="login.html" class="clear-cart-btn btn-tiny">Log In</a>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="video-card">
            <div class="video-wrapper">
                <iframe
                    src="https://www.youtube.com/embed/${v.youtubeId}"
                    title="${v.title}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
            <div class="video-info">
                <p class="video-category">${v.category}${v.gated ? " · 👑 Members" : ""}</p>
                <h3>${v.title}</h3>
                <p>${v.description}</p>
            </div>
        </div>
    `;
}

// Rũracio gate
function initRuracioGate() {
    const gated = document.getElementById("gatedRuracio");
    const lock = document.getElementById("ruracioLock");
    if (!gated || !lock) return;

    const token = localStorage.getItem("token");
    if (token) {
        gated.style.display = "block";
        lock.style.display = "none";
    } else {
        gated.style.display = "none";
        lock.style.display = "flex";
    }
}

// ================= ADMIN PANEL =================
async function initAdminPanel() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
        alert("Login required. Redirecting...");
        window.location.href = "login.html";
        return;
    }
    if (user.role !== "admin") {
        alert("Admin access only. Redirecting...");
        window.location.href = "index.html";
        return;
    }

    const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };

    document.querySelectorAll(".tab-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
        });
    });

    const imageFileInput = document.getElementById("articleImageFile");
    const imageHidden = document.getElementById("articleImage");
    const imageStatus = document.getElementById("imageUploadStatus");
    const imagePreviewBox = document.getElementById("imagePreviewBox");
    const imagePreviewImg = document.getElementById("imagePreviewImg");
    const removeImageBtn = document.getElementById("removeImageBtn");

    function resetImageUpload() {
        if (imageFileInput) imageFileInput.value = "";
        if (imageHidden) imageHidden.value = "";
        if (imageStatus) { imageStatus.textContent = "No image selected."; imageStatus.style.color = "#aaa"; }
        if (imagePreviewBox) imagePreviewBox.style.display = "none";
        if (imagePreviewImg) imagePreviewImg.src = "";
    }

    if (imageFileInput) {
        imageFileInput.addEventListener("change", async function() {
            const file = this.files[0];
            if (!file) return;
            imageStatus.textContent = "Uploading...";
            imageStatus.style.color = "#c99f4b";
            const formData = new FormData();
            formData.append("file", file);
            try {
                const r = await fetch(API_URL + "/api/admin/upload", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + token },
                    body: formData
                });
                const d = await r.json();
                if (d.success) {
                    imageHidden.value = d.url;
                    imagePreviewImg.src = d.url;
                    imagePreviewBox.style.display = "block";
                    imageStatus.textContent = "✅ Image uploaded successfully.";
                    imageStatus.style.color = "#4ade80";
                } else {
                    imageStatus.textContent = "❌ " + d.message;
                    imageStatus.style.color = "#ef4444";
                }
            } catch (e) {
                imageStatus.textContent = "❌ Upload failed.";
                imageStatus.style.color = "#ef4444";
            }
        });
    }

    if (removeImageBtn) removeImageBtn.addEventListener("click", resetImageUpload);

    async function loadStats() {
        try {
            const r = await fetch(API_URL + "/api/admin/stats", { headers });
            const d = await r.json();
            if (d.success) {
                document.getElementById("statArticles").textContent = d.stats.articleCount;
                document.getElementById("statPending").textContent = d.stats.pendingCount;
                document.getElementById("statUsers").textContent = d.stats.userCount;
                document.getElementById("statMessages").textContent = d.stats.messageCount;
                document.getElementById("statComments").textContent = d.stats.commentCount;
                document.getElementById("statLikes").textContent = d.stats.likeCount;
            }
        } catch (e) {}
    }

    async function loadArticlesAdmin() {
        const list = document.getElementById("articlesList");
        try {
            const r = await fetch(API_URL + "/api/admin/articles", { headers });
            const d = await r.json();
            if (!d.success || d.articles.length === 0) { list.innerHTML = '<p style="color:#888;">No articles yet.</p>'; return; }
            list.innerHTML = d.articles.map(a => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${a.title}</h4>
                        <p>${a.category} · ${new Date(a.date).toLocaleDateString()} · ❤️ ${a.likeCount} (base: ${a.baseLikes || 0}) · <strong style="color:${a.status === 'published' ? '#4ade80' : a.status === 'pending' ? '#c99f4b' : '#ef4444'};">${a.status}</strong></p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-primary btn-tiny" onclick="adjustLikes('${a._id}', ${a.baseLikes || 0})">Adjust Likes</button>
                        <button class="btn-primary btn-tiny" onclick="editArticle('${a._id}')">Edit</button>
                        <button class="clear-cart-btn btn-tiny" onclick="deleteArticle('${a._id}')">Delete</button>
                    </div>
                </div>`).join("");
            window._allArticles = d.articles;
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading articles.</p>'; }
    }

    async function loadSubmissions() {
        const list = document.getElementById("submissionsList");
        try {
            const r = await fetch(API_URL + "/api/admin/submissions", { headers });
            const d = await r.json();
            if (!d.success || d.submissions.length === 0) { list.innerHTML = '<p style="color:#888;">No pending submissions.</p>'; return; }
            list.innerHTML = d.submissions.map(s => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${s.title}</h4>
                        <p style="color:#888;font-size:0.85rem;">By ${s.submitterName || "unknown"} · ${new Date(s.date).toLocaleString()} · ${s.category}</p>
                        <p style="color:#ccc;margin-top:8px;">${s.excerpt}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-primary btn-tiny" onclick="approveSubmission('${s._id}')">Approve</button>
                        <button class="clear-cart-btn btn-tiny" onclick="rejectSubmission('${s._id}')">Reject</button>
                        <button class="clear-cart-btn btn-tiny" onclick="deleteSubmission('${s._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading submissions.</p>'; }
    }

    async function loadMessages() {
        const list = document.getElementById("messagesList");
        try {
            const r = await fetch(API_URL + "/api/admin/messages", { headers });
            const d = await r.json();
            if (!d.success || d.messages.length === 0) { list.innerHTML = '<p style="color:#888;">No messages yet.</p>'; return; }
            list.innerHTML = d.messages.map(m => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${m.name} — <span style="color:#c99f4b;font-size:0.9rem;">${m.subject}</span></h4>
                        <p style="color:#888;font-size:0.85rem;">${m.email} · ${new Date(m.date).toLocaleString()}</p>
                        <p style="color:#ccc;margin-top:8px;">${m.message}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="clear-cart-btn btn-tiny" onclick="deleteMessage('${m._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading messages.</p>'; }
    }

    async function loadUsers() {
        const list = document.getElementById("usersList");
        try {
            const r = await fetch(API_URL + "/api/admin/users", { headers });
            const d = await r.json();
            if (!d.success || d.users.length === 0) { list.innerHTML = '<p style="color:#888;">No users yet.</p>'; return; }
            list.innerHTML = d.users.map(u => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${u.name}</h4>
                        <p style="color:#888;font-size:0.85rem;">${u.email} · Joined ${new Date(u.date).toLocaleDateString()}</p>
                    </div>
                    <div class="admin-item-actions">
                        <select class="role-select" onchange="changeRole('${u._id}', this.value)">
                            <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                            <option value="contributor" ${u.role === "contributor" ? "selected" : ""}>Contributor</option>
                            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                        </select>
                        <button class="clear-cart-btn btn-tiny" onclick="deleteUser('${u._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading users.</p>'; }
    }

    async function loadCommentsAdmin() {
        const list = document.getElementById("commentsList");
        try {
            const r = await fetch(API_URL + "/api/admin/comments", { headers });
            const d = await r.json();
            if (!d.success || d.comments.length === 0) { list.innerHTML = '<p style="color:#888;">No comments yet.</p>'; return; }
            list.innerHTML = d.comments.map(c => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${c.userName}</h4>
                        <p style="color:#888;font-size:0.85rem;">On "${c.articleId ? c.articleId.title : "deleted article"}" · ${new Date(c.date).toLocaleDateString()}</p>
                        <p style="color:#ccc;margin-top:8px;">${c.text}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="clear-cart-btn btn-tiny" onclick="deleteComment('${c._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading comments.</p>'; }
    }

    async function loadForumAdmin() {
        const list = document.getElementById("forumAdminList");
        if (!list) return;
        try {
            const r = await fetch(API_URL + "/api/admin/forum/posts", { headers });
            const d = await r.json();
            if (!d.success || d.posts.length === 0) { list.innerHTML = '<p style="color:#888;">No forum posts.</p>'; return; }
            list.innerHTML = d.posts.map(p => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${p.title}</h4>
                        <p style="color:#888;font-size:0.85rem;">By ${p.userName} · ${new Date(p.date).toLocaleDateString()} · ${p.category}</p>
                        <p style="color:#ccc;margin-top:8px;">${p.content.substring(0, 200)}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="clear-cart-btn btn-tiny" onclick="deleteForumPost('${p._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading forum.</p>'; }
    }

    async function loadVideosAdmin() {
        const list = document.getElementById("videosAdminList");
        if (!list) return;
        try {
            const r = await fetch(API_URL + "/api/admin/videos", { headers });
            const d = await r.json();
            if (!d.success || d.videos.length === 0) { list.innerHTML = '<p style="color:#888;">No videos yet.</p>'; return; }
            list.innerHTML = d.videos.map(v => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${v.title} ${v.gated ? "🔒" : ""}</h4>
                        <p style="color:#888;font-size:0.85rem;">${v.category} · Order: ${v.order} · YouTube ID: ${v.youtubeId}</p>
                        <p style="color:#ccc;margin-top:8px;">${v.description || "No description"}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="clear-cart-btn btn-tiny" onclick="deleteVideo('${v._id}')">Delete</button>
                    </div>
                </div>`).join("");
        } catch (e) { list.innerHTML = '<p style="color:#ef4444;">Error loading videos.</p>'; }
    }

    const newBtn = document.getElementById("newArticleBtn");
    const formBox = document.getElementById("articleFormBox");
    const cancelBtn = document.getElementById("cancelArticleBtn");
    const articleForm = document.getElementById("articleForm");

    if (newBtn) newBtn.addEventListener("click", function() {
        document.getElementById("articleId").value = "";
        document.getElementById("articleFormTitle").textContent = "Create Article";
        articleForm.reset();
        document.getElementById("articleAuthor").value = "Gĩkũyũ Archive";
        document.getElementById("articleBaseLikes").value = 0;
        resetImageUpload();
        formBox.style.display = "block";
        formBox.scrollIntoView({ behavior: "smooth" });
    });

    if (cancelBtn) cancelBtn.addEventListener("click", function() {
        formBox.style.display = "none";
        articleForm.reset();
        resetImageUpload();
    });

    if (articleForm) articleForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const status = document.getElementById("articleStatus");
        const id = document.getElementById("articleId").value;
        const payload = {
            title: document.getElementById("articleTitle").value,
            slug: document.getElementById("articleSlug").value,
            category: document.getElementById("articleCategory").value,
            image: imageHidden.value || "story-1.jpg",
            author: document.getElementById("articleAuthor").value,
            excerpt: document.getElementById("articleExcerpt").value,
            content: document.getElementById("articleContent").value,
            baseLikes: parseInt(document.getElementById("articleBaseLikes").value) || 0
        };
        status.textContent = "Saving...";
        status.style.color = "#c99f4b";
        try {
            const url = id ? API_URL + "/api/admin/articles/" + id : API_URL + "/api/admin/articles";
            const method = id ? "PUT" : "POST";
            const r = await fetch(url, { method, headers, body: JSON.stringify(payload) });
            const d = await r.json();
            if (d.success) {
                status.textContent = "✅ " + d.message;
                status.style.color = "#4ade80";
                setTimeout(function() {
                    formBox.style.display = "none";
                    articleForm.reset();
                    resetImageUpload();
                    loadArticlesAdmin();
                    loadStats();
                }, 1000);
            } else { status.textContent = "❌ " + d.message; status.style.color = "#ef4444"; }
        } catch (e) { status.textContent = "❌ Server error."; status.style.color = "#ef4444"; }
    });

    // New video form
    const newVideoBtn = document.getElementById("newVideoBtn");
    const videoFormBox = document.getElementById("videoFormBox");
    const cancelVideoBtn = document.getElementById("cancelVideoBtn");
    const videoForm = document.getElementById("videoForm");

    if (newVideoBtn) newVideoBtn.addEventListener("click", function() {
        videoForm.reset();
        videoFormBox.style.display = "block";
        videoFormBox.scrollIntoView({ behavior: "smooth" });
    });

    if (cancelVideoBtn) cancelVideoBtn.addEventListener("click", function() {
        videoFormBox.style.display = "none";
        videoForm.reset();
    });

    if (videoForm) videoForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const status = document.getElementById("videoStatus");
        const payload = {
            title: document.getElementById("videoTitle").value,
            youtubeId: document.getElementById("videoYoutubeId").value,
            description: document.getElementById("videoDescription").value,
            category: document.getElementById("videoCategory").value,
            gated: document.getElementById("videoGated").checked,
            order: parseInt(document.getElementById("videoOrder").value) || 0
        };
        status.textContent = "Saving...";
        status.style.color = "#c99f4b";
        try {
            const r = await fetch(API_URL + "/api/admin/videos", { method: "POST", headers, body: JSON.stringify(payload) });
            const d = await r.json();
            if (d.success) {
                status.textContent = "✅ Video added!";
                status.style.color = "#4ade80";
                setTimeout(function() {
                    videoFormBox.style.display = "none";
                    videoForm.reset();
                    loadVideosAdmin();
                    loadStats();
                }, 1000);
            } else { status.textContent = "❌ " + d.message; status.style.color = "#ef4444"; }
        } catch (e) { status.textContent = "❌ Server error."; status.style.color = "#ef4444"; }
    });

    window.editArticle = function(id) {
        const a = (window._allArticles || []).find(x => x._id === id);
        if (!a) return;
        fetch(API_URL + "/api/articles/" + a.slug).then(r => r.json()).then(d => {
            if (!d.success) return;
            const full = d.article;
            document.getElementById("articleId").value = full._id;
            document.getElementById("articleFormTitle").textContent = "Edit Article";
            document.getElementById("articleTitle").value = full.title;
            document.getElementById("articleSlug").value = full.slug;
            document.getElementById("articleCategory").value = full.category;
            document.getElementById("articleAuthor").value = full.author;
            document.getElementById("articleBaseLikes").value = full.baseLikes || 0;
            document.getElementById("articleExcerpt").value = full.excerpt;
            document.getElementById("articleContent").value = full.content;
            imageHidden.value = full.image || "";
            if (full.image) {
                imagePreviewImg.src = window.buildImageUrl(full.image);
                imagePreviewBox.style.display = "block";
                imageStatus.textContent = "Current image. Upload a new one to replace.";
                imageStatus.style.color = "#aaa";
            } else { resetImageUpload(); }
            formBox.style.display = "block";
            formBox.scrollIntoView({ behavior: "smooth" });
        });
    };

    window.deleteArticle = async function(id) {
        if (!confirm("Delete this article?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/articles/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadArticlesAdmin(); loadStats(); }
        } catch (e) {}
    };

    window.deleteVideo = async function(id) {
        if (!confirm("Delete this video?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/videos/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadVideosAdmin(); loadStats(); }
        } catch (e) {}
    };

    window.approveSubmission = async function(id) {
        if (!confirm("Publish this submission?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/submissions/" + id + "/approve", { method: "PUT", headers });
            const d = await r.json();
            if (d.success) { loadSubmissions(); loadArticlesAdmin(); loadStats(); }
        } catch (e) {}
    };

    window.rejectSubmission = async function(id) {
        if (!confirm("Reject this submission?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/submissions/" + id + "/reject", { method: "PUT", headers });
            const d = await r.json();
            if (d.success) { loadSubmissions(); loadStats(); }
        } catch (e) {}
    };

    window.deleteSubmission = async function(id) {
        if (!confirm("Delete this submission permanently?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/articles/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadSubmissions(); loadStats(); }
        } catch (e) {}
    };

    window.deleteForumPost = async function(id) {
        if (!confirm("Delete this forum post? All replies will also be removed.")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/forum/posts/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadForumAdmin(); loadStats(); }
        } catch (e) {}
    };

    window.deleteMessage = async function(id) {
        if (!confirm("Delete this message?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/messages/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadMessages(); loadStats(); }
        } catch (e) {}
    };

    window.deleteUser = async function(id) {
        if (!confirm("Delete this user?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/users/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadUsers(); loadStats(); }
        } catch (e) {}
    };

    window.deleteComment = async function(id) {
        if (!confirm("Delete this comment?")) return;
        try {
            const r = await fetch(API_URL + "/api/admin/comments/" + id, { method: "DELETE", headers });
            const d = await r.json();
            if (d.success) { loadCommentsAdmin(); loadStats(); }
        } catch (e) {}
    };

    window.changeRole = async function(id, role) {
        try {
            const r = await fetch(API_URL + "/api/admin/users/" + id + "/role", { method: "PUT", headers, body: JSON.stringify({ role }) });
            const d = await r.json();
            if (!d.success) alert(d.message);
        } catch (e) {}
    };

    window.adjustLikes = async function(id, currentBase) {
        const input = prompt("Set base likes:", currentBase);
        if (input === null) return;
        const num = parseInt(input);
        if (isNaN(num) || num < 0) { alert("Invalid number."); return; }
        try {
            const r = await fetch(API_URL + "/api/admin/articles/" + id + "/likes", {
                method: "PUT", headers,
                body: JSON.stringify({ baseLikes: num })
            });
            const d = await r.json();
            if (d.success) {
                alert("Likes updated. Total: " + d.totalLikes);
                loadArticlesAdmin();
                loadStats();
            } else { alert(d.message); }
        } catch (e) { alert("Server error."); }
    };

    loadStats();
    loadArticlesAdmin();
    loadSubmissions();
    loadMessages();
    loadUsers();
    loadCommentsAdmin();
    loadForumAdmin();
    loadVideosAdmin();
}
