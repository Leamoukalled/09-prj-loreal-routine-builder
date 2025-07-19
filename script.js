/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");
}

// Products array will be loaded from products.json
let products = [];

// Load products and render on page start
loadProducts().then((loadedProducts) => {
  products = loadedProducts;
  renderProductsGrid(products);
  renderSelectedProducts();
});

// Helper function to save selected product IDs to localStorage
function saveSelectedProducts() {
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify(selectedProductIds)
  );
}

// Helper function to load selected product IDs from localStorage
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProductIds");
  if (saved) {
    try {
      selectedProductIds = JSON.parse(saved);
    } catch {
      selectedProductIds = [];
    }
  }
}

// Store selected product IDs
let selectedProductIds = [];
loadSelectedProducts(); // Load on page start

// Render products grid
function renderProductsGrid(productsToShow) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  productsToShow.forEach((product) => {
    // Create product card
    const card = document.createElement("div");
    card.className = "product-card";
    // If selected, add 'selected' class
    if (selectedProductIds.includes(product.id)) {
      card.classList.add("selected");
    }

    // Track description visibility for each card
    let descriptionVisible = false;

    // Card content with image and info
    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-img">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-brand">${product.brand}</p>
        <span class="product-category">${product.category}</span>
        <button class="desc-toggle-btn" aria-expanded="false">Show Description</button>
        <div class="product-desc" style="display:none;" aria-live="polite">${
          product.description || ""
        }</div>
      </div>
    `;

    // Click to select/unselect
    card.onclick = (e) => {
      // If clicking on the description button, do not select/unselect
      if (e.target.classList.contains("desc-toggle-btn")) return;
      if (selectedProductIds.includes(product.id)) {
        // Unselect
        selectedProductIds = selectedProductIds.filter(
          (id) => id !== product.id
        );
      } else {
        // Select
        selectedProductIds.push(product.id);
        // Add animation
        card.classList.add("just-selected");
        setTimeout(() => card.classList.remove("just-selected"), 400);
      }
      saveSelectedProducts();
      // Re-render grid and selected products
      renderProductsGrid(productsToShow);
      renderSelectedProducts();
    };

    // Description toggle button logic
    const descBtn = card.querySelector(".desc-toggle-btn");
    const descDiv = card.querySelector(".product-desc");
    descBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent card select
      descriptionVisible = !descriptionVisible;
      descDiv.style.display = descriptionVisible ? "block" : "none";
      descBtn.textContent = descriptionVisible
        ? "Hide Description"
        : "Show Description";
      descBtn.setAttribute("aria-expanded", descriptionVisible);
    };

    container.appendChild(card);
  });
}

// Render selected products list with remove and clear buttons
function renderSelectedProducts() {
  const list = document.getElementById("selectedProductsList");
  list.innerHTML = "";
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );
  selectedProducts.forEach((product) => {
    // Create a container for each selected product
    const item = document.createElement("div");
    item.className = "selected-product-item";
    item.innerHTML = `
      <span>${product.name}</span>
      <button class="remove-selected-btn" title="Remove ${product.name}">&times;</button>
    `;
    // Remove button functionality
    item.querySelector(".remove-selected-btn").onclick = () => {
      selectedProductIds = selectedProductIds.filter((id) => id !== product.id);
      saveSelectedProducts();
      renderProductsGrid(products);
      renderSelectedProducts();
    };
    list.appendChild(item);
  });

  // Add "Clear All" button if there are any selections
  if (selectedProductIds.length > 0) {
    const clearBtn = document.createElement("button");
    clearBtn.className = "clear-selected-btn";
    clearBtn.textContent = "Clear All";
    clearBtn.onclick = () => {
      selectedProductIds = [];
      saveSelectedProducts();
      renderProductsGrid(products);
      renderSelectedProducts();
    };
    list.appendChild(clearBtn);
  }
}

// Filter products by category
document
  .getElementById("categoryFilter")
  .addEventListener("change", function () {
    const category = this.value;
    const filtered = products.filter((p) => p.category === category);
    renderProductsGrid(filtered);
  });

// Initial render (show all products or empty)
// Initial render is now handled after products are loaded

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

// Store the full chat history for OpenAI
let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful beauty advisor. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, and related beauty topics.",
  },
];

// This function displays a message in the chat window
function addChatMessage(sender, text) {
  const chatWindow = document.getElementById("chatWindow");
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "chat-msg user" : "chat-msg ai";
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// This function sends selected products to your Cloudflare Worker and shows the routine
async function generateRoutineFromSelected() {
  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );
  if (selectedProducts.length === 0) {
    addChatMessage(
      "ai",
      "Please select at least one product to generate a routine."
    );
    return;
  }

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    content:
      `Here are my selected products:\n` +
      selectedProducts
        .map(
          (p) =>
            `Name: ${p.name}\nBrand: ${p.brand}\nCategory: ${p.category}\nDescription: ${p.description}`
        )
        .join("\n\n") +
      `\n\nPlease suggest a routine using these products.`,
  });

  addChatMessage("user", "Generate a routine for my selected products.");

  try {
    // Send the full chat history to your Cloudflare Worker
    const response = await fetch(WORKER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatHistory,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      addChatMessage("ai", data.choices[0].message.content);
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      addChatMessage(
        "ai",
        "Sorry, I couldn't generate a routine. Please try again."
      );
    }
  } catch (error) {
    addChatMessage(
      "ai",
      "There was an error connecting to the server. Please try again."
    );
  }
}

// Listen for Generate Routine button click
document
  .getElementById("generateRoutine")
  .addEventListener("click", generateRoutineFromSelected);

// Handle follow-up questions in the chatbox
document
  .getElementById("chatForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const userInput = document.getElementById("userInput").value.trim();
    if (!userInput) return;

    addChatMessage("user", userInput);

    chatHistory.push({
      role: "user",
      content: userInput,
    });

    try {
      // Send the full chat history to your Cloudflare Worker
      const response = await fetch(WORKER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: chatHistory,
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        addChatMessage("ai", data.choices[0].message.content);
        chatHistory.push({
          role: "assistant",
          content: data.choices[0].message.content,
        });
      } else {
        addChatMessage(
          "ai",
          "Sorry, I couldn't answer your question. Please try again."
        );
      }
    } catch (error) {
      addChatMessage(
        "ai",
        "There was an error connecting to the server. Please try again."
      );
    }

    document.getElementById("chatForm").reset();
  });

// Replace this with your actual Cloudflare Worker endpoint URL
const WORKER_API_URL = "https://your-worker-subdomain.workers.dev";
// ...existing code...
