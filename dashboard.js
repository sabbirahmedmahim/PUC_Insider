import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAInkx3PZugoMUAG1CmMaqXtUJ-BffpTzk",
  authDomain: "puc-insider.firebaseapp.com",
  projectId: "puc-insider",
  storageBucket: "puc-insider.appspot.com",
  messagingSenderId: "730819202755",
  appId: "1:730819202755:web:5fc6f02b5a744279421c76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allFaculties = [];
let selectedFacultyId = null;

const searchInput = document.getElementById('searchInput');
const dropdownList = document.getElementById('dropdownList');
const searchSection = document.getElementById('searchSection');
const facultySection = document.getElementById('facultySection');
const facultyNameDisplay = document.getElementById('facultyNameDisplay');
const reviewsContainer = document.getElementById('reviewsContainer');
const reviewForm = document.getElementById('reviewForm');
const themeToggle = document.getElementById('themeToggle');
const weatherBtn = document.getElementById('weatherBtn');
const sortSelect = document.getElementById('sortReviews');

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html"; 
  } else {
    document.getElementById('userDisplay').textContent = user.email.split('@')[0];
    fetchFaculties();
    loadWeather(); 
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = "index.html");
});

themeToggle.addEventListener('click', () => {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.body.removeAttribute('data-theme');
    themeToggle.textContent = "☼ Light Mode";
  } else {
    document.body.setAttribute('data-theme', 'light');
    themeToggle.textContent = "☾ Dark Mode";
  }
});

async function loadWeather() {
  const tempEl = document.getElementById('weatherTemp');
  const descEl = document.getElementById('weatherDesc');
  const windEl = document.getElementById('weatherWind');

  weatherBtn.disabled = true;
  descEl.textContent = "Fetching weather...";

  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=22.3569&longitude=91.7832&current_weather=true');
    if (!response.ok) throw new Error("Failed");
    
    const data = await response.json();
    const current = data.current_weather;

    tempEl.textContent = `${current.temperature}°C`;
    windEl.textContent = `Wind: ${current.windspeed} km/h`;

    const code = current.weathercode;
    let desc = "☁️ Cloudy";
    if (code === 0) desc = "☀️ Clear Sky";
    else if (code >= 1 && code <= 3) desc = "⛅ Partly Cloudy";
    else if (code >= 45 && code <= 48) desc = "🌫️ Foggy";
    else if (code >= 51 && code <= 67) desc = "🌧️ Rainy";
    else if (code >= 80 && code <= 82) desc = "🌦️ Rain Showers";
    else if (code >= 95) desc = "⛈️ Thunderstorm";

    descEl.textContent = desc;
  } catch (error) {
    descEl.textContent = "Could not load weather.";
    tempEl.textContent = "--°C";
  } finally {
    weatherBtn.disabled = false;
  }
}

weatherBtn.addEventListener('click', loadWeather);

async function fetchFaculties() {
  try {
    const querySnapshot = await getDocs(collection(db, "faculty"));
    allFaculties = [];
    querySnapshot.forEach((doc) => allFaculties.push({ id: doc.id, ...doc.data() }));
  } catch (error) {}
}

searchInput.addEventListener('input', function() {
  const queryText = this.value.toLowerCase().trim();
  if (queryText.length === 0) {
    dropdownList.classList.add('hidden');
    return;
  }
  
  const filtered = allFaculties.filter(fac => fac.name.toLowerCase().includes(queryText));
  dropdownList.innerHTML = '';
  
  if (filtered.length > 0) {
    filtered.forEach(fac => {
      const li = document.createElement('li');
      li.textContent = fac.name;
      li.addEventListener('click', () => {
        selectedFacultyId = fac.id;
        facultyNameDisplay.textContent = fac.name;
        searchSection.classList.add('hidden');
        facultySection.classList.remove('hidden');
        dropdownList.classList.add('hidden');
        searchInput.value = '';
        
        sortSelect.value = "newest"; 
        loadReviews();
      });
      dropdownList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = "No faculty found";
    li.style.color = "var(--text-muted)";
    li.style.cursor = "default";
    dropdownList.appendChild(li);
  }
  dropdownList.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    dropdownList.classList.add('hidden');
  }
});

async function loadReviews() {
  if (!selectedFacultyId) return;

  reviewsContainer.innerHTML = "<p style='font-size: 13px; color: var(--text-muted);'>Loading reviews...</p>";
  try {
    const q = query(collection(db, "reviews"), where("facultyId", "==", selectedFacultyId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      reviewsContainer.innerHTML = "<p style='font-size: 13px; color: var(--text-muted);'>No reviews yet. Be the first!</p>";
      return;
    }

    let reviewsList = [];
    querySnapshot.forEach((docSnap) => {
      reviewsList.push({ id: docSnap.id, ...docSnap.data() });
    });

    const sortValue = sortSelect.value;
    if (sortValue === "highest") {
      reviewsList.sort((a, b) => b.rating - a.rating);
    } else {
      reviewsList.sort((a, b) => {
        let timeA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        let timeB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
    }

    reviewsContainer.innerHTML = "";
    reviewsList.forEach((review) => {
      let stars = "★".repeat(review.rating);

     
      reviewsContainer.innerHTML += `
        <div class="review-card">
          <div>
            <strong>Rating: ${stars} (${review.rating}/5)</strong>
            <p style="margin-top: 5px;">${review.comment}</p>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

sortSelect.addEventListener('change', loadReviews);

reviewForm.addEventListener('submit', async function(e) {
  e.preventDefault(); 
  
  if (!selectedFacultyId) {
    alert("CRITICAL ERROR: Please select a faculty teacher first before posting a review.");
    return;
  }
  
  const comment = document.getElementById('reviewComment').value.trim();
  const ratingInput = document.querySelector('input[name="rating"]:checked');
  
  if (!ratingInput) return alert("Select a rating");

  try {
    await addDoc(collection(db, "reviews"), {
      facultyId: selectedFacultyId,
      userEmail: auth.currentUser.email,
      rating: parseInt(ratingInput.value),
      comment: comment,
      createdAt: new Date()
    });
    
    alert("Review posted successfully!");
    reviewForm.reset(); 
    
    sortSelect.value = "newest";
    loadReviews();
    
  } catch (error) {
    alert("Error posting review.");
  }
});

document.getElementById('backBtn').addEventListener('click', () => {
  searchSection.classList.remove('hidden');
  facultySection.classList.add('hidden');
  selectedFacultyId = null; 
  reviewForm.reset();
});
