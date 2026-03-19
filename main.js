const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const wind = document.getElementById("wind");
const message = document.getElementById("message");
const weatherIcon = document.getElementById("weatherIcon");

function getWeatherDescription(code) { //when the code (from API) is 0, it will return "Clear sky", when the code is 1, it will return "Mainly clear", and so on. If the code is not found in the weatherCodes object, it will return "Unknown weather conditions".
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

  return weatherCodes[code] || "Unknown weather conditions"; //fallback in case the code is not found in the weatherCodes object
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
    .normalize("NFD") //normalize the string to decompose accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, ""); //remove diacritical marks using a regular expression that targets the Unicode range for combining diacritical marks
}

function findExactMatch(results, userInput) { //compares the normalized user input with the normalized location names from the API results to find an exact match
  const normalizedInput = normalizeString(userInput);

  return results.find((item) => {
    const normalizedName = normalizeString(item.name);
    return normalizedName === normalizedInput; //if it finds a match, it returns the location object; if not, it returns undefined
  });
}

//function which takes a city name as input, constructs the appropriate API URL, and fetches the geographical coordinates for that city
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`; //encodeURIComponent is used to ensure that the city name is properly formatted

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

//function which fetches the curren weather data for the given latitude and longitude
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

  return data.current; //returns the current weather data, which includes temperature, weather code, and wind speed
}

//show the weather result in UI
function displayWeather(location, weather) {
  cityName.textContent = `${location.name}, ${location.country}`;
  temperature.textContent = `${Math.round(weather.temperature_2m)}°C`;
  description.textContent = getWeatherDescription(weather.weather_code);
  wind.textContent = `Wind: ${weather.wind_speed_10m} km/h`;
  weatherIcon.textContent = getWeatherIcon(weather.weather_code);
}

//resets the weather card to its default state
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

//combine the process of fetching the coordinates and weather data, updating the UI, and handling errors into a single function that can be called when the user submits a city name or when the page loads with a previously searched city
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

//event listener for the form submission, which prevents the default form behavior, retrieves the city name from the input field, and calls the loadWeatherByCity function to fetch and display the weather data for that city
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

//event listener for the DOMContentLoaded event, which checks if there is a previously searched city stored in localStorage and, if so, automatically loads the weather data for that city when the page is loaded
document.addEventListener("DOMContentLoaded", async function () {
  const lastCity = getLastCity();

  if (lastCity) {
    cityInput.value = lastCity;
    await loadWeatherByCity(lastCity);
  }
});

