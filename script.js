// Select DOM elements
const searchInput = document.getElementById('search-input');
const navLinks = document.getElementById('nav-links');
const searchResults = document.getElementById('search-results');
const clearBtn = document.getElementById('clear-search');
const contentArea = document.getElementById('content-area');

/**
 * Scrolls to a specific element ID in the content area
 * @param {string} id - The ID of the section to scroll to
 */
function scrollToId(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Clears the search input and resets the sidebar view
 */
function clearSearch() {
    searchInput.value = '';
    navLinks.style.display = 'block';
    searchResults.style.display = 'none';
    clearBtn.style.display = 'none';
}

// Event Listener for Typing in Search Bar
searchInput.addEventListener('keyup', (e) => {
    const query = e.target.value.toLowerCase();

    // UI Toggling
    if (query.length > 0) {
        navLinks.style.display = 'none';
        searchResults.style.display = 'block';
        clearBtn.style.display = 'block';
    } else {
        clearSearch();
        return;
    }

    // Clear previous results
    searchResults.innerHTML = '';

    // Get all text-containing elements in the content area 
    // You can add 'td' or 'th' here if you have tables
    const elements = contentArea.querySelectorAll('p, h1, h2, h3, h4, li, div');

    let matchCount = 0;

    elements.forEach(el => {
        // Check if element has text and matches query
        // We use el.childNodes to ensure we aren't finding text inside nested tags multiple times, 
        // but for a simple manual, checking innerText is usually sufficient and safer.
        if (el.innerText.toLowerCase().includes(query) && el.innerText.trim() !== "") {
            
            // Filter out huge container divs to avoid duplicate large hits
            if (el.tagName === 'DIV' && el.children.length > 0) return; 

            matchCount++;
            
            // create result item
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            
            // Find the parent section ID to know where to scroll (Context)
            const parentSection = el.closest('section');
            const sectionTitle = parentSection ? parentSection.querySelector('h1, h2, h3')?.innerText : 'General';

            // Create snippet (context around the word)
            const text = el.innerText;
            const index = text.toLowerCase().indexOf(query);
            // Grab 25 chars before and after
            const snippetStart = Math.max(0, index - 25);
            const snippetEnd = Math.min(text.length, index + query.length + 25);
            const snippet = "..." + text.substring(snippetStart, snippetEnd) + "...";

            resultDiv.innerHTML = `
                <div class="result-title">${sectionTitle || 'Unknown Section'}</div>
                <div class="result-snippet">${snippet}</div>
            `;

            // Add Click Event to Result
            resultDiv.onclick = () => {
                // Scroll to element
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Temporary Highlight
                el.classList.remove('highlight'); // Reset animation if already there
                void el.offsetWidth; // Trigger reflow to restart CSS animation
                el.classList.add('highlight');
                
                // Remove highlight after 2 seconds
                setTimeout(() => el.classList.remove('highlight'), 2000);
            };

            searchResults.appendChild(resultDiv);
        }
    });

    if (matchCount === 0) {
        searchResults.innerHTML = '<div class="result-item">No matches found.</div>';
    }
});

// Event Listener for Clear Button
clearBtn.addEventListener('click', clearSearch);