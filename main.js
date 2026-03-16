const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const wind = document.getElementById("wind");
const message = document.getElementById("message");

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const city = cityInput.value.trim();

  if (city === "") {
    message.textContent = "Wpisz nazwę miasta.";
    return;
  }

  message.textContent = "";
  cityName.textContent = city;
  temperature.textContent = "--°C";
  description.textContent = "Tutaj pojawi się opis pogody";
  wind.textContent = "Wiatr: -- km/h";
});