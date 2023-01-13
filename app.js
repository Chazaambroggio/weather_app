require('dotenv').config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require('ejs');

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extend:true}));

// Allows express to know in which folder to look for things
app.use(express.static('public'));


app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
})


async function getGoogleImage(cityName){
	
	const googleKey = process.env.GOOGLE_API_KEY;
	// Find Place search.
	let photoReferencePromise = new Promise((resolve, reject) => {
		const url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=" + cityName + "&inputtype=textquery&fields=name%2Cphotos%2Cplace_id&key=" + googleKey
		
		https.get(url, function(response) {
			
			response.on("data", function(data) {
				
				const city = JSON.parse(data)
				console.log(city.candidates[0])
				let photoReference = city.candidates[0].photos[0].photo_reference;
				
				resolve(photoReference);
			});
		});
	});

	let photoReference = await photoReferencePromise;
	let placePhotoRequest = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=350&maxheight=350&photo_reference=" + photoReference + "&key=" + googleKey;
	
	return placePhotoRequest
}


app.post("/searchWeather", function(req, res) {
	weatherList = [];
	
	const unit = "metric";
	const apiKey = process.env.OPEN_WEATHER_API_KEY;

	let weather = {
		city: req.body.cityNameInput,
		zipCode: req.body.zipCodeInput,
		countryCode: req.body.countryCodeInput
	};

	const url = "https://api.openweathermap.org/data/2.5/weather?q=" + weather.city + "," + weather.countryCode + "&zip=" + weather.zipCode +"&units=" + unit + "&appid=" + apiKey

	https.get(url, function(response){

		if (response.statusCode == 200) {

			response.on("data", async function(data){
				const weatherData = JSON.parse(data)

				weather.temperature = weatherData.main.temp
				weather.description = weatherData.weather[0].description
				weather.iconUrl = "http://openweathermap.org/img/wn/" + weatherData.weather[0].icon + "@2x.png"
				getGoogleImage(weather.city).then( googleImageUrl => {

					weather.cityImage = googleImageUrl;
					
					weatherList.push(weather);
					
					res.render("weather", {weathers: weatherList});
				});
		
			});

		} else {
			
			res.redirect('/');
		}
	})

});



app.listen(process.env.PORT || 3000, function() {
	console.log('Server running...');
})