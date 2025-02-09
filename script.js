const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes?q=";
const OPEN_LIBRARY_API = "https://openlibrary.org/api/volumes/brief/json/";
const API_KEY = "API_KEY";
//light and dark mode toggles
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
}

// Searching books
async function searchBooks() {
    const query = document.getElementById("search").value.trim();
    const genre = document.getElementById("genre").value;
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "Loading...";

    try {
        let url = `${GOOGLE_BOOKS_API}${encodeURIComponent(query)}&key=${API_KEY}`;
        if (genre) {
            url += `+subject:${genre}`;
        }

        const googleBooksResponse = await fetch(url);
        const data = await googleBooksResponse.json();

        if (data.items) {
            const bookPromises = data.items.map(book => fetchOpenLibraryData(book.id));
            const openLibraryData = await Promise.all(bookPromises);
            displayResults(data.items, openLibraryData);
        } else {
            resultsDiv.innerHTML = "No books found.";
        }
    } catch (error) {
        resultsDiv.innerHTML = "Error fetching books.";
    }
}

// searchvalue
function handleSearchKey(event) {
    if (event.key === 'Enter') {
        searchBooks();
    }
}

// Display Results
function displayResults(books, openLibraryData) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    books.forEach((book, index) => {
        const title = book.volumeInfo.title || "Unknown Title";
        const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author";
        const cover = book.volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/150";
        const openLibraryCover = openLibraryData[index]?.cover || cover;

        const bookElement = document.createElement("div");
        bookElement.classList.add("book");
        bookElement.innerHTML = `
            <img src="${openLibraryCover}" alt="Book Cover">
            <h3>${title}</h3>
            <p>${author}</p>
            <button onclick="addToLibrary('${title}', '${openLibraryCover}')">Add to Library</button>
            <div class="rating">${generateRatingStars(title)}</div>
        `;
        resultsDiv.appendChild(bookElement);
    });
}

// Fetch
async function fetchOpenLibraryData(bookId) {
    try {
        const response = await fetch(`${OPEN_LIBRARY_API}${bookId}.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Open Library data:", error);
        return null;
    }
}

//rating star
function generateRatingStars(title) {
    const savedRating = localStorage.getItem(`${title}_rating`) || 0;
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="star" data-title="${title}" data-rating="${i}" onclick="rateBook(this)">${i <= savedRating ? "★" : "☆"}</span>`;
    }
    return starsHTML;
}
//ratings
function rateBook(starElement) {
    const title = starElement.getAttribute("data-title");
    const rating = starElement.getAttribute("data-rating");
    localStorage.setItem(`${title}_rating`, rating);
    document.querySelectorAll(`.star[data-title='${title}']`).forEach(star => {
        star.innerHTML = star.getAttribute("data-rating") <= rating ? "★" : "☆";
    });
}

// AddLibrary
function addToLibrary(title, cover) {
    const libraryDiv = document.getElementById("library");
    const bookElement = document.createElement("div");
    bookElement.classList.add("book");
    bookElement.innerHTML = `
        <img src="${cover}" alt="Book Cover">
        <h3>${title}</h3>
        <button onclick="removeFromLibrary(this)">Remove</button>
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        <input type="range" min="0" max="100" value="0" oninput="updateProgress(this)">
        <div class="rating">${generateRatingStars(title)}</div>
    `;
    libraryDiv.appendChild(bookElement);
    saveLibrary();
}

// RemoveLibrary
function removeFromLibrary(element) {
    element.parentElement.remove();
    saveLibrary();
}

//Reading Progress
function updateProgress(slider) {
    const progressBar = slider.previousElementSibling.firstElementChild;
    progressBar.style.width = `${slider.value}%`;
    const bookTitle = slider.closest(".book").querySelector("h3").textContent;
    localStorage.setItem(`${bookTitle}_progress`, slider.value);
}

// Save Library
function saveLibrary() {
    const libraryDiv = document.getElementById("library");
    const books = [];
    libraryDiv.querySelectorAll(".book").forEach(bookElement => {
        const title = bookElement.querySelector("h3").innerText;
        const cover = bookElement.querySelector("img").src;
        const progress = bookElement.querySelector("input").value;
        books.push({ title, cover, progress });
    });
    localStorage.setItem("library", JSON.stringify(books));
}

//Library
function loadLibrary() {
    const libraryDiv = document.getElementById("library");
    const books = JSON.parse(localStorage.getItem("library") || "[]");
    books.forEach(book => {
        const bookElement = document.createElement("div");
        bookElement.classList.add("book");
        bookElement.innerHTML = `
            <img src="${book.cover}" alt="Book Cover">
            <h3>${book.title}</h3>
            <button onclick="removeFromLibrary(this)">Remove</button>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${book.progress}%;"></div>
            </div>
            <input type="range" min="0" max="100" value="${book.progress}" oninput="updateProgress(this)">
            <div class="rating">${generateRatingStars(book.title)}</div>
        `;
        libraryDiv.appendChild(bookElement);
    });
}

window.onload = loadLibrary;
