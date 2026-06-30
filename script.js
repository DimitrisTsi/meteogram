// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const ctx = document.getElementById('meteogramChart').getContext('2d');

let meteogramChart;

// WMO Weather Codes (Simplified)
const weatherCodes = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    61: "Slight rain", 63: "Moderate rain", 80: "Slight rain showers",
    95: "Thunderstorm"
};

// Initialize default chart
function initChart(labels, tempData, precipData, windData) {
    if (meteogramChart) meteogramChart.destroy();

    meteogramChart = new Chart(ctx, {
        type: 'bar', // Base type is bar for precipitation
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    yAxisID: 'y_temp',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                },
                {
                    type: 'bar',
                    label: 'Precipitation (mm)',
                    data: precipData,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    yAxisID: 'y_precip',
                },
                {
                    type: 'line',
                    label: 'Wind Speed (km/h)',
                    data: windData,
                    borderColor: '#a5f3fc',
                    backgroundColor: 'transparent',
                    yAxisID: 'y_wind',
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
                },
                y_temp: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Temp (°C)', color: '#f97316' },
                    ticks: { color: '#f97316' }
                },
                y_precip: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Precip (mm)', color: '#38bdf8' },
                    ticks: { color: '#38bdf8' },
                    grid: { drawOnChartArea: false } // only show grid for temp
                },
                y_wind: {
                    type: 'linear',
                    position: 'right',
                    display: false, // Hidden, but maintains data structure
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0' }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0'
                }
            }
        }
    });
}

// Fetch Coordinates and Weather
async function getWeather(city) {
    try {
        // 1. Get Coordinates
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("City not found. Try another search.");
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Get Weather Data
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&timezone=auto&forecast_days=2`);
        const weatherData = await weatherRes.json();

        displayWeather(name, country, weatherData);

    } catch (error) {
        console.error("Error fetching weather:", error);
        alert("An error occurred. Please try again.");
    }
}

// Display Data
function displayWeather(name, country, data) {
    const current = data.hourly;
    const currentIndex = new Date().getHours(); // Approximate current hour index
    
    // Update Current Weather UI
    const currentTemp = current.temperature_2m[currentIndex];
    const currentWind = current.windspeed_10m[currentIndex];
    const currentCode = current.weathercode[currentIndex];
    const description = weatherCodes[currentCode] || "Variable conditions";

    currentWeatherDiv.innerHTML = `
        <div>
            <h2>${name}, ${country}</h2>
            <p style="color:#94a3b8; margin-top:5px;">${description}</p>
        </div>
        <div class="temp">${currentTemp}°C</div>
        <div class="details">
            <p>Wind: ${currentWind} km/h</p>
            <p>Updated: Just now</p>
        </div>
    `;

    // Prepare Chart Data (Next 24 hours)
    const labels = [];
    const tempData = [];
    const precipData = [];
    const windData = [];

    for (let i = 0; i < 24; i++) {
        const index = currentIndex + i;
        const date = new Date(data.hourly.time[index]);
        
        // Format label to "HH:00"
        labels.push(date.getHours().toString().padStart(2, '0') + ":00");
        tempData.push(current.temperature_2m[index]);
        precipData.push(current.precipitation[index]);
        windData.push(current.windspeed_10m[index]);
    }

    // Render Chart
    initChart(labels, tempData, precipData, windData);
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    }
});

// Load default city on startup
window.onload = () => {
    getWeather("London");
};
