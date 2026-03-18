const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const wind = document.getElementById("wind");
const message = document.getElementById("message");
const weatherIcon = document.getElementById("weatherIcon");

function getWeatherDescription(code) {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodes[code] || "Unknown weather conditions";
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";

  return "🌍";
}

function normalizeString(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findExactMatch(results, userInput) {
  const normalizedInput = normalizeString(userInput);

  return results.find((location) => {
    const normalizedName = normalizeString(location.name);
    return normalizedName === normalizedInput;
  });
}

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=10&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Error while fetching location data.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found.");
  }

  const exactMatch = findExactMatch(data.results, city);

  if (!exactMatch) {
    throw new Error("City not found. Try entering the full city name.");
  }

  return exactMatch;
}

async function getWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Error while fetching weather data.");
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error("Weather data is unavailable.");
  }

  return data.current;
}

function displayWeather(location, weather) {
  cityName.textContent = `${location.name}, ${location.country}`;
  temperature.textContent = `${Math.round(weather.temperature_2m)}°C`;
  description.textContent = getWeatherDescription(weather.weather_code);
  wind.textContent = `Wind: ${weather.wind_speed_10m} km/h`;
  weatherIcon.textContent = getWeatherIcon(weather.weather_code);
}

function resetWeatherCard() {
  cityName.textContent = "City";
  temperature.textContent = "--°C";
  description.textContent = "Weather description";
  wind.textContent = "Wind: -- km/h";
  weatherIcon.textContent = "⛅";
}

function saveLastCity(city) {
  localStorage.setItem("lastCity", city);
}

function getLastCity() {
  return localStorage.getItem("lastCity");
}

async function loadWeatherByCity(city) {
  message.textContent = "Loading...";

  try {
    const location = await getCoordinates(city);
    const weather = await getWeather(location.latitude, location.longitude);

    displayWeather(location, weather);
    message.textContent = "";
    saveLastCity(location.name);
  } catch (error) {
    message.textContent = error.message;
    resetWeatherCard();
  }
}

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (city === "") {
    message.textContent = "Please enter a city name.";
    resetWeatherCard();
    return;
  }

  await loadWeatherByCity(city);
  cityInput.value = "";
});

window.addEventListener("load", async function () {
  const lastCity = getLastCity();

  if (lastCity) {
    cityInput.value = lastCity;
    await loadWeatherByCity(lastCity);
  }
});