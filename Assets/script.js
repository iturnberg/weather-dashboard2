document.addEventListener('DOMContentLoaded', function () {
    addPreviousSearchButtons();
    const cityInput = document.getElementById('cityInput');

    // Function to get latitude and longitude for a city
    async function getLatLong(cityName) {
        const apiKey = '11d55f8a330c648b984ad16fd539b704';
        const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (response.ok && data.length > 0) {
                // Extract latitude and longitude from the first result
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                return { latitude, longitude };
            } else {
                throw new Error(data.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error('Error:', error.message);
            return null;
        }
    }

    // Function to fetch forecast using latitude and longitude
    async function getForecast(latitude, longitude) {
        const apiKey = '11d55f8a330c648b984ad16fd539b704';
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error('Error:', error.message);
            return null;
        }
    }

    // Function to convert temperature from Kelvin to Fahrenheit
    function kelvinToFahrenheit(kelvin) {
        return ((kelvin - 273.15) * 9 / 5 + 32).toFixed(2);
    }

    // Function to fetch and display the 5-day forecast
    async function fetchAndLogForecast(cityName) {
        const { latitude, longitude } = await getLatLong(cityName);
        if (!latitude || !longitude) {
            console.error('Failed to fetch coordinates for the city.');
            return;
        }

        const forecastData = await getForecast(latitude, longitude);
        if (!forecastData) {
            console.error('Failed to fetch forecast data.');
            return;
        }

        // Filter the forecast data to get one data point per day
        const dailyForecasts = forecastData.list.filter((forecast, index, arr) => {
            // Check if it's the first item, or if the date changes compared to the previous item
            return index === 0 || forecast.dt_txt.split(' ')[0] !== arr[index - 1].dt_txt.split(' ')[0];
        });

        // Display forecast data
        const forecastBoxes = document.querySelectorAll('.forecastBox');
        for (let i = 0; i < forecastBoxes.length; i++) {
            const box = forecastBoxes[i];
            const dateElement = box.querySelector('.date');
            const tempElement = box.querySelector('.temp');
            const windElement = box.querySelector('.wind');
            const humidityElement = box.querySelector('.humidity');

            const forecast = dailyForecasts[i]; // Adjust index to match forecast data

            dateElement.textContent = forecast.dt_txt.split(' ')[0]; // Set date
            tempElement.textContent = `Temperature: ${kelvinToFahrenheit(forecast.main.temp)} °F`; // Convert and set temperature
            windElement.textContent = `Wind Speed: ${forecast.wind.speed} mph`; // Set wind speed
            humidityElement.textContent = `Humidity: ${forecast.main.humidity}%`; // Set humidity
        }

        // Save searched city name to local storage
        saveToLocalStorage(cityName);

        // Create and append button for previous search
        const pastResultsDiv = document.querySelector('.pastResults');
        const existingButtons = pastResultsDiv.querySelectorAll('button');

        let buttonExists = false;
        existingButtons.forEach(button => {
            if (button.textContent.trim() === cityName) {
                buttonExists = true;
                return;
            }
        });

        if (!buttonExists) {
            const button = document.createElement('button');
            button.textContent = cityName;
            button.classList.add('btn', 'btn-secondary', 'my-1');
            button.addEventListener('click', async () => {
                await fetchAndLogForecast(cityName);
            });
            pastResultsDiv.appendChild(button);
        }
    }

    // Function to save searched city name to local storage
    function saveToLocalStorage(cityName) {
        let savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];
        savedCities.push(cityName);
        localStorage.setItem('savedCities', JSON.stringify(savedCities));
    }

    // Pull the list from local storage to add buttons back to the webpage
    function addPreviousSearchButtons() {
        const pastResultsDiv = document.querySelector('.pastResults');
        const savedSearches = JSON.parse(localStorage.getItem('savedCities'));

        if (savedSearches) {
            savedSearches.forEach(cityName => {
                // Check if a button with the same city name already exists
                if (!pastResultsDiv.querySelector(`button[data-city="${cityName}"]`)) {
                    const button = document.createElement('button');
                    button.textContent = cityName;
                    button.classList.add('btn', 'btn-secondary', 'my-1');
                    button.setAttribute('data-city', cityName); // Add a data attribute to identify the city
                    button.addEventListener('click', async () => {
                        await fetchAndLogForecast(cityName);
                    });
                    pastResultsDiv.appendChild(button);
                }
            });
        }
    }

    // Event listener for the form submission
    document.querySelector('form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent form submission
        const cityNameValue = cityInput.value.trim();
        if (cityNameValue === '') {
            console.error('Please enter a city name.');
            return;
        }

        await fetchAndLogForecast(cityNameValue);
    });
});
