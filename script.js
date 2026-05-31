const STORAGE_KEY = "nateknowsball_posts";
const ADMIN_SESSION_KEY = "nateknowsball_admin_session";
const ADMIN_PASSWORD = "nateknowsball";

function loadPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse stored posts:", error);
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";

  if (post.imageData) {
    const img = document.createElement("img");
    img.src = post.imageData;
    img.alt = post.imageAlt || post.title;
    article.appendChild(img);
  }

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = post.category;

  const title = document.createElement("h3");
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = post.title;
  title.appendChild(link);

  const excerpt = document.createElement("p");
  excerpt.textContent = post.excerpt;

  article.appendChild(tag);
  article.appendChild(title);
  article.appendChild(excerpt);

  return article;
}

function renderDynamicPosts() {
  const container = document.getElementById("dynamic-posts");
  if (!container) return;

  container.innerHTML = "";
  const posts = loadPosts();
  if (!posts.length) {
    container.innerHTML = "";
    return;
  }

  posts.forEach(post => {
    container.appendChild(createPostCard(post));
  });
}

function initIndex() {
  document.addEventListener("DOMContentLoaded", renderDynamicPosts);
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setAdminState(isLoggedIn) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, isLoggedIn ? "true" : "false");
}

function authenticateAdmin() {
  const passwordInput = document.getElementById("admin-password");
  const status = document.getElementById("status-message");
  if (!passwordInput) return;

  if (passwordInput.value.trim() === ADMIN_PASSWORD) {
    setAdminState(true);
    passwordInput.value = "";
    showAdminArea();
    if (status) {
      status.textContent = "Editor unlocked.";
      status.className = "status-message status-success";
    }
  } else {
    if (status) {
      status.textContent = "Incorrect password. Try again.";
      status.className = "status-message status-error";
    }
  }
}

function logoutAdmin() {
  setAdminState(false);
  showLoginPanel();
}

function showLoginPanel() {
  document.getElementById("admin-area").classList.add("hidden");
  document.getElementById("published-posts").classList.add("hidden");
}

function showAdminArea() {
  document.getElementById("admin-area").classList.remove("hidden");
  document.getElementById("published-posts").classList.remove("hidden");
  renderAdminPosts();
}

function handleImagePreview(event) {
  const fileInput = event.target;
  const previewCard = document.getElementById("image-preview-card");
  const previewImage = document.getElementById("image-preview");

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      previewCard.classList.remove("hidden");
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    clearPreview();
  }
}

function clearPreview() {
  const fileInput = document.getElementById("post-image");
  const previewCard = document.getElementById("image-preview-card");
  const previewImage = document.getElementById("image-preview");

  if (fileInput) {
    fileInput.value = "";
  }
  if (previewImage) {
    previewImage.src = "";
  }
  if (previewCard) {
    previewCard.classList.add("hidden");
  }
}

function saveNewPost(event) {
  event.preventDefault();
  const title = document.getElementById("post-title").value.trim();
  const category = document.getElementById("post-category").value.trim();
  const excerpt = document.getElementById("post-excerpt").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const imageInput = document.getElementById("post-image");
  const imageAlt = document.getElementById("post-image-alt").value.trim();
  const status = document.getElementById("status-message");

  if (!title || !category || !excerpt || !content) {
    if (status) {
      status.textContent = "Please fill in all required fields.";
      status.className = "status-message status-error";
    }
    return;
  }

  const post = {
    id: Date.now(),
    title,
    category,
    excerpt,
    content,
    imageData: "",
    imageAlt,
    createdAt: new Date().toISOString(),
  };

  if (imageInput && imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      post.imageData = e.target.result;
      storePost(post, status);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    storePost(post, status);
  }
}

function storePost(post, status) {
  const posts = loadPosts();
  posts.unshift(post);
  savePosts(posts);
  renderAdminPosts();
  renderDynamicPosts();
  document.getElementById("admin-form").reset();
  clearPreview();

  if (status) {
    status.textContent = "Article published successfully.";
    status.className = "status-message status-success";
  }
}

function renderAdminPosts() {
  const publishedList = document.getElementById("published-list");
  if (!publishedList) return;

  const posts = loadPosts();
  publishedList.innerHTML = "";

  if (!posts.length) {
    publishedList.innerHTML = "<p>No posts published yet.</p>";
    return;
  }

  posts.forEach(post => {
    const item = document.createElement("div");
    item.className = "published-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(post.title)}</strong>
        <p>${escapeHtml(post.category)} • ${new Date(post.createdAt).toLocaleDateString()}</p>
      </div>
      <button type="button" class="button button-secondary" onclick="deletePost(${post.id})">Delete</button>
    `;
    publishedList.appendChild(item);
  });
}

function deletePost(postId) {
  const posts = loadPosts().filter(post => post.id !== postId);
  savePosts(posts);
  renderAdminPosts();
  renderDynamicPosts();
}

function escapeHtml(text) {
  return text.replace(/[&<>"]+/g, function (match) {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return escapeMap[match] || match;
  });
}

function initAdmin() {
  if (isAdminLoggedIn()) {
    showAdminArea();
  } else {
    showLoginPanel();
  }
}

if (typeof window !== "undefined") {
  window.initIndex = initIndex;
  window.initAdmin = initAdmin;
  window.authenticateAdmin = authenticateAdmin;
  window.logoutAdmin = logoutAdmin;
  window.handleImagePreview = handleImagePreview;
  window.clearPreview = clearPreview;
  window.saveNewPost = saveNewPost;
  window.deletePost = deletePost;
}
