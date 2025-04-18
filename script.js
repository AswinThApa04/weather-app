let tempChartInstance = null;
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const loader = document.getElementById("loader");
const themeToggle = document.getElementById("theme-toggle");
let isCelsius = true;
let currentData = null;

// Search Button Handler
searchBtn.addEventListener("click", () => {
  const cityName = cityInput.value.trim();
  if (cityName === "") {
    alert("Please enter a city name!");
    return;
  }
  getWeather(cityName);
});

// Fetch current weather by city
function getWeather(city) {
  loader.classList.remove("hidden");

  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${CONFIG.API_KEY}&q=${city}&aqi=yes`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      displayWeather(data);
      getForecast(city);
      loader.classList.add("hidden");
    })
    .catch(error => {
      console.error("Error fetching weather:", error);
      document.getElementById("weather-info").classList.add("hidden");
      document.getElementById("error-message").classList.remove("hidden");
      loader.classList.add("hidden");
    });
}

// Fetch weather by user location
function getWeatherByLocation(lat, lon) {
  loader.classList.remove("hidden");

  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${CONFIG.API_KEY}&q=${lat},${lon}&aqi=yes`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      displayWeather(data);
      getForecast(`${lat},${lon}`);
      loader.classList.add("hidden");
    })
    .catch(error => {
      console.error("Location weather error:", error);
      document.getElementById("error-message").classList.remove("hidden");
      loader.classList.add("hidden");
    });
}

// Geolocation on page load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByLocation(pos.coords.latitude, pos.coords.longitude),
      err => console.error("Geolocation denied:", err)
    );
  }
});

// Display weather data
function displayWeather(data) {
  const aqi = data.current.air_quality.pm2_5;
  document.getElementById("air-quality").textContent = `🌫️ Air Quality (PM2.5): ${aqi.toFixed(1)}`;
  let aqiColor = aqi <= 50 ? "green" : aqi <= 100 ? "yellow" : "red";
  document.getElementById("air-quality").style.color = aqiColor;

  currentData = data;

  document.getElementById("city-name").textContent = `${data.location.name}, ${data.location.country}`;
  document.getElementById("description").textContent = data.current.condition.text;
  document.getElementById("temperature").textContent = `🌡️ ${data.current.temp_c} °C`;
  document.getElementById("humidity").textContent = `💧 Humidity: ${data.current.humidity}%`;
  document.getElementById("weather-icon").src = data.current.condition.icon;

  // Add this line to show the map
  showMap(data.location.lat, data.location.lon);

  document.getElementById("weather-info").classList.remove("hidden");
  document.getElementById("error-message").classList.add("hidden");
  document.getElementById("toggle-temp").classList.remove("hidden");
}

// Update temp toggle
document.getElementById("toggle-temp").addEventListener("click", () => {
  if (!currentData) return;

  isCelsius = !isCelsius;
  const temp = isCelsius ? currentData.current.temp_c : currentData.current.temp_f;
  const unit = isCelsius ? "C" : "F";
  document.getElementById("temperature").textContent = `🌡️ ${temp} °${unit}`;
  document.getElementById("toggle-temp").textContent = isCelsius ? "Switch to °F" : "Switch to °C";
});

// Forecast API fetch
function getForecast(city) {
  const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${CONFIG.API_KEY}&q=${city}&days=10`;

  fetch(forecastUrl)
    .then(response => response.json())
    .then(data => {
      displayForecast(data.forecast.forecastday);
    })
    .catch(error => {
      console.error("Forecast error:", error);
    });
}

// Render forecast cards
function displayForecast(days) {
  const container = document.getElementById("forecast-container");
  const title = document.getElementById("forecast-title");

  container.innerHTML = "";
  title.classList.remove("hidden");
  container.classList.remove("hidden");

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h3>${day.date}</h3>
      <img src="${day.day.condition.icon}" alt="${day.day.condition.text}" />
      <p>${day.day.condition.text}</p>
      <p>🌡️ Max: ${day.day.maxtemp_c}°C</p>
      <p>❄️ Min: ${day.day.mintemp_c}°C</p>
      <p>💧 Humidity: ${day.day.avghumidity}%</p>
    `;
    container.appendChild(card);
  });
  renderTemperatureChart(days);
}
function renderTemperatureChart(forecastDays) {
  const ctx = document.getElementById("tempChart").getContext("2d");

  const labels = forecastDays.map(day => day.date);
  const maxTemps = forecastDays.map(day => day.day.maxtemp_c);
  const minTemps = forecastDays.map(day => day.day.mintemp_c);

  // Destroy the old chart instance if it exists
  if (tempChartInstance) {
    tempChartInstance.destroy();
  }

  // Create new chart
  tempChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: "Max Temp (°C)",
          data: maxTemps,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Min Temp (°C)",
          data: minTemps,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          labels: {
            color: 'white'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'white'
          }
        },
        y: {
          ticks: {
            color: 'white'
          }
        }
      }
    }
  });
}
let map;

function showMap(lat, lon) {
  // Initialize the map if it doesn't exist
  if (!map) {
    map = L.map('map', {
      center: [lat, lon],
      zoom: 12,
      zoomControl: true,
      preferCanvas: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add zoom controls
    L.control.zoom({
      position: 'topright'
    }).addTo(map);
  } else {
    // If map exists, just update the view
    map.setView([lat, lon], 12);
  }
  
  // Clear previous markers if any
  if (window.currentMarker) {
    map.removeLayer(window.currentMarker);
  }
  
  // Add new marker with a popup
  window.currentMarker = L.marker([lat, lon]).addTo(map)
    .bindPopup(`<b>${currentData.location.name}</b><br>${currentData.current.condition.text}`)
    .openPopup();
  
  // Force map to resize in case it was hidden initially
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}



// Theme Toggle (with localStorage)
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("weather-theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("weather-theme", isDark ? "dark" : "light");
});
