// --- DOM ELEMENTS ---
const searchInput = document.getElementById('search-input');
const navLinks = document.getElementById('nav-links');
const searchResults = document.getElementById('search-results');
const clearBtn = document.getElementById('clear-search');
const contentArea = document.getElementById('content-area');
const collapseAllBtn = document.getElementById('collapse-all-btn');

// --- STATE MANAGEMENT ---
let searchIndex = []; // Holds the pre-scanned text data
let searchTimeout = null; // For debouncing
let renderQueue = []; // For batch rendering
let isRendering = false; // Flag to check if render loop is running

// --- INITIALIZATION: BUILD THE INDEX ---
// We run this once on page load. It's much faster to search this array than the DOM.
window.addEventListener('DOMContentLoaded', () => {
    console.log("Building Search Index...");
    const elements = contentArea.querySelectorAll('p, h1, h2, h3, h4, li, div');
    
    elements.forEach(el => {
        // textContent is faster than innerText for indexing
        const rawText = el.textContent || "";
        
        // Skip empty elements or container divs with children
        if (!rawText.trim() || (el.tagName === 'DIV' && el.children.length > 0)) return;

        // Find the parent section title once and store it
        const parentSection = el.closest('section');
        const sectionTitle = parentSection 
            ? parentSection.querySelector('h1, h2, h3')?.innerText 
            : 'General';

        searchIndex.push({
            element: el, // Reference to the actual DOM element
            textLower: rawText.toLowerCase(), // Store lowercase for fast comparison
            originalText: rawText,
            sectionTitle: sectionTitle || 'Unknown Section'
        });
    });
    console.log(`Index built with ${searchIndex.length} items.`);
});

// --- SEARCH LOGIC ---

// 1. Debounce: Wait for user to stop typing for 300ms
searchInput.addEventListener('keyup', (e) => {
    clearTimeout(searchTimeout);
    
    const query = e.target.value.toLowerCase().trim();

    // UI Toggling
    if (query.length > 0) {
        navLinks.style.display = 'none';
        searchResults.style.display = 'block';
        clearBtn.style.display = 'block'; // Ensure 'Clear' button shows
        if (collapseAllBtn) collapseAllBtn.style.display = 'none'; // Hide collapse btn during search
    } else {
        clearSearch();
        return;
    }

    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300); 
});

// 2. Perform Search using the Index
function performSearch(query) {
    // Cancel any ongoing rendering from previous searches
    renderQueue = []; 
    searchResults.innerHTML = ''; 

    // Filter the index (Fast JS operation)
    const matches = searchIndex.filter(item => item.textLower.includes(query));

    if (matches.length === 0) {
        searchResults.innerHTML = '<div class="result-item">No matches found.</div>';
        return;
    }

    // Add matches to queue
    renderQueue = matches;
    
    // Start processing the queue if not already running
    if (!isRendering) {
        processRenderQueue(query);
    }
}

// 3. Batch Rendering (Queueing)
function processRenderQueue(query) {
    if (renderQueue.length === 0) {
        isRendering = false;
        return;
    }

    isRendering = true;

    // Process the next 20 items (Batch size)
    // Using a document fragment prevents browser reflow for every single item
    const fragment = document.createDocumentFragment();
    const batchSize = 20;
    const batch = renderQueue.splice(0, batchSize);

    batch.forEach(match => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';

        // Calculate snippet
        const index = match.textLower.indexOf(query);
        const snippetStart = Math.max(0, index - 25);
        const snippetEnd = Math.min(match.originalText.length, index + query.length + 25);
        const snippet = "..." + match.originalText.substring(snippetStart, snippetEnd) + "...";

        resultDiv.innerHTML = `
            <div class="result-title">${match.sectionTitle}</div>
            <div class="result-snippet">${snippet}</div>
        `;

        resultDiv.onclick = () => {
            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight Logic
            match.element.classList.remove('highlight');
            void match.element.offsetWidth; // Trigger reflow
            match.element.classList.add('highlight');
            setTimeout(() => match.element.classList.remove('highlight'), 2000);
        };

        fragment.appendChild(resultDiv);
    });

    // Append this batch to the DOM
    searchResults.appendChild(fragment);

    // Schedule the next batch for the next animation frame
    // This keeps the UI responsive (no freezing)
    requestAnimationFrame(() => processRenderQueue(query));
}

// --- UTILITIES ---

function clearSearch() {
    searchInput.value = '';
    navLinks.style.display = 'block';
    searchResults.style.display = 'none';
    clearBtn.style.display = 'none'; 
    if (collapseAllBtn) collapseAllBtn.style.display = 'inline'; // Bring back collapse btn
    
    // Clear queues
    renderQueue = [];
    searchResults.innerHTML = '';
}

function scrollToId(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Event Listener for Clear Button
if (clearBtn) clearBtn.addEventListener('click', clearSearch);


// --- COLLAPSIBLE SIDEBAR LOGIC (Preserved) ---
const groupHeaders = document.querySelectorAll('.nav-header');

groupHeaders.forEach(header => {
    header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        const content = header.nextElementSibling;
        if (content) {
            content.classList.toggle('collapsed');
        }
    });
});

// --- COLLAPSE ALL FUNCTION (Preserved) ---
if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
        const headers = document.querySelectorAll('.nav-header');
        const contents = document.querySelectorAll('.nav-content');

        headers.forEach(header => header.classList.add('collapsed'));
        contents.forEach(content => content.classList.add('collapsed'));
    });
}