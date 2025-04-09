// Wait for the HTML document to be fully loaded before running any JavaScript
// This prevents errors from trying to access elements that don't exist yet
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('aboutModal');
    const aboutLink = document.getElementById('aboutLink');
    const closeBtn = modal.querySelector('.close');

    // Open modal when About is clicked
    aboutLink.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    // Get references to the form element using its class name
    const form = document.querySelector('.search-form');
    // Get the reset button from within the form
    const resetButton = form.querySelector('button[type="reset"]');
    
    // Add ISBN input validation
    const isbnInput = form.querySelector('#isbn');
    isbnInput.addEventListener('input', (e) => {
        const isbn = e.target.value.trim();
        if (isbn && !isValidISBN(isbn)) {
            isbnInput.setCustomValidity('Please enter a valid ISBN (10 or 13 digits)');
            isbnInput.reportValidity();
        } else {
            isbnInput.setCustomValidity('');
        }
    });

    // Add an event listener for when the form is reset (reset button clicked)
    form.addEventListener('reset', (e) => {
        // Log to console for debugging
        console.log('Form reset triggered');
        // Find the results div if it exists
        const resultsDiv = document.getElementById('results');
        // If we found the results div, clear its contents
        if (resultsDiv) resultsDiv.innerHTML = '';
    });

    // Add an event listener for when the form is submitted
    // Using async because we'll make API calls
    form.addEventListener('submit', async (e) => {
        // Prevent the default form submission behavior
        // This stops the page from reloading
        e.preventDefault();
        
        // Get all the form field values and remove extra spaces
        const isbn = form.isbn.value.trim();
        const title = form.title.value.trim();
        const author = form.author.value.trim();
        const language = form.language.value;

        // Validate ISBN if provided
        if (isbn && !isValidISBN(isbn)) {
            alert('Please enter a valid ISBN (10 or 13 digits)');
            return;
        }

        // Build the search query based on user input
        let searchQuery = '';
        if (isbn) {
            // If ISBN is provided, search for exact ISBN
            // Quotes around ISBN for exact match
            searchQuery = `"${isbn}" textbook pdf`;
        } else if (title || author) {
            // If title or author is provided, combine them
            searchQuery = `${title} ${author} textbook pdf`;
        }

        // Only search if we have something to search for
        if (searchQuery) {
            // Add language to query if it's not English
            if (language !== 'english') {
                searchQuery += ` ${language}`;
            }
            // Call the search function and wait for results
            await searchForTextbook(searchQuery);
            
            // Scroll to results
            const resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Alert the user if no search terms provided
            alert("Please enter either ISBN or Title/Author!");
        }
    });
});

// Function to validate ISBN
function isValidISBN(isbn) {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check if it's a valid ISBN-10 or ISBN-13
    return /^(\d{10}|\d{13})$/.test(cleanISBN);
}

// Function to perform the textbook search
// Takes a query string as parameter
async function searchForTextbook(query) {
    // Google Custom Search API credentials
    // Replace these with your actual API key and search engine ID
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const searchEngineId = import.meta.env.VITE_SEARCH_ENGINE_ID;
    
    // Create or get the results container
    let resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        // If results div doesn't exist, create it
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'results';
        // Add it to the search container
        document.querySelector('.search-container').appendChild(resultsDiv);
    }

    // Show loading message while waiting for results
    resultsDiv.innerHTML = "<h2>Search Results</h2><p>Searching for textbooks...</p>";
    
    // Construct the API URL with the search query
    // encodeURIComponent ensures the query is properly formatted for a URL
    const url = `https://www.googleapis.com/customsearch/v1?q=${query}+filetype:pdf&key=${apiKey}&cx=${searchEngineId}`;
    // The "+filetype:pdf" reinforces the filter  
    try {
        // Fetch data from Google's API
        const response = await fetch(url);
        // Convert the response to JSON format
        const data = await response.json();
        
        // Display the results
        displayResults(data.items);
    } catch (error) {
        // Log any errors to console for debugging
        console.error("Error fetching results:", error);
        // Show error message to user
        resultsDiv.innerHTML = "<h2>Search Results</h2><p>An error occurred while searching. Please try again.</p>";
    }
}

// Function to display the search results
// Takes an array of result items from the Google API
function displayResults(results) {
    // Get the results container
    const resultsDiv = document.getElementById('results');
    
    // Start with the results title
    resultsDiv.innerHTML = "<h2>Search Results</h2>";
  
    // If no results found, show a message and exit
    if (!results || results.length === 0) {
        resultsDiv.innerHTML += "<p>No results found. Try a different search.</p>";
        return;
    }
  
    // Create a container for all results
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
  
    // Loop through each result and create its HTML
    results.forEach((item) => {
        // Create a div for this result
        const resultElement = document.createElement('div');
        resultElement.className = "result-item";
        
        // Add the title, description, and link
        resultElement.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.snippet || ''}</p>
            <a href="${item.link}" target="_blank" class="download-link">View Resource</a>
        `;
        
        // Add this result to the container
        resultsContainer.appendChild(resultElement);
    });
    
    // Add all results to the page
    resultsDiv.appendChild(resultsContainer);
}
