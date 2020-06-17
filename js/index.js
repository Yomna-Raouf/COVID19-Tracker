
window.onload = () => {
    getWorldWideData();
    getCountryData();
    getHistoricalData();
    addLegend();
    getNews();
}


mapboxgl.accessToken = 'pk.eyJ1IjoieW9tbmEtcmFvdWYiLCJhIjoiY2s5MnY1MTJqMDNqMTNkdXJvbTEybm9jNiJ9.Ptr2DKynFUQVoaNYN-6uqA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 20],
    zoom: 2,
});

const getCountryData = () => {
    fetch("https://corona.lmao.ninja/v2/countries")
    .then( response => response.json())
    .then((data)=>{
        addMarkers(data)
        //showDataOnMap(data);
        showDataInTable(data);
        Search(data);
    })
}

const getHistoricalData = () => {
    fetch('https://corona.lmao.ninja/v2/historical/all?lastdays=120')
    .then( response => response.json())
    .then (data => {
        let chartData = buildChartData(data);
        buildChart(chartData);
    })
}

const getWorldWideData = () => {
    fetch('https://corona.lmao.ninja/v2/all')
    .then(response => response.json())
    .then( data =>{
        let worldData = {...data};
        worldData.country = 'WorldWide'
        let modifiedWorldData = [worldData]
        showDataInCountryStatsContainer(worldData.country , modifiedWorldData);
    });
}

const getNews = () => {
    fetch("https://newsapi.org/v2/everything?q=COVID&from=2020-06-16&apiKey=c361ee82ad48460287bf148b5aee5809&sortBy=popularity")
    .then(response =>  response.json())
    .then( data => {
        console.log(data["articles"]);
        showNewsInNewsContainer(data);
    })
    .catch(error => console.log('error', error));
}

const Search = (data) => {

    document.querySelector("#autoComplete").addEventListener("autoComplete", event => {
        console.log(event);
    });

    new autoComplete({
       data: {
        src: async () => {
            document
				.querySelector("#autoComplete")
                .setAttribute("placeholder", "Loading...");
                const source = await fetch('https://corona.lmao.ninja/v2/countries');
                const data = await source.json();
                document
				.querySelector("#autoComplete")
                .setAttribute("placeholder", "country");
                return data;   
            },
            key: ["country"],
            cache:false
       },
       sort: (a, b) => {
            if (a.match < b.match) return -1;
            if (a.match > b.match) return 1;
            return 0;
	    },
       placeHolder: 'country',
       selector: "#autoComplete",   
       threshold:0,
       debounce: 0,
       searchEngine: 'loose',
       highlight: true,
       maxResults: 5,
       resultsList: {                       // Rendered results list object      | (Optional)
        render: true,
        container: source => {
            source.setAttribute("id", "autoComplete_list");
        },
        destination: document.querySelector("#autoComplete"),
        position: "afterend",
        element: "ul"
        },
       resultItem: {                          // Rendered result item            | (Optional)
        content: (data, source) => {
            source.innerHTML = data.match;
        },
        element: "li"
    },
    noResults: () => {                     // Action script on noResults      | (Optional)
        const result = document.createElement("li");
        result.setAttribute("class", "no_result");
        result.setAttribute("tabindex", "1");
        result.innerHTML = "No Results";
        document.querySelector("#autoComplete_list").appendChild(result);
    },
    onSelection: (feedback) => {             // Action script onSelection event | (Optional)
        const selection = feedback.selection.value.country;
		// Render selected choice to selection div
		document.querySelector(".location").innerHTML = selection;
		// Clear Input
		document.querySelector("#autoComplete").value = "";
		// Change placeholder with the selected value
		document
			.querySelector("#autoComplete")
            .setAttribute("placeholder", selection);
        
        // Console log autoComplete data feedback
        console.log(feedback); 
        FlyToCountry(selection, data);
    },
    });
}

const FlyToCountry = (selection ,data) => {
    let countryCoordinates = [];
    if(selection){
        data.forEach( country => {
            if(country.country === selection ) {
                countryCoordinates =  [
                    country.countryInfo.long,
                    country.countryInfo.lat
                ]
            }
        });
    }

    map.flyTo({
        center: countryCoordinates,
        zoom: 5,
        bearing: 0,
        speed: 1,  
        curve: 1,  
        easing: function(t) {
        return t;
        },
        essential: true
    });

    addPopups(data, countryCoordinates, selection);
}


const showDataInCountryStatsContainer = (selection , data) => {
   
    let html = '';
    if(selection){
        data.forEach( country => {
            if(country.country === selection) {
                html = `
                <div class="country-stats">
                    <p>Tests</p>
                    <p class="tests">${country.tests}</p>
                </div>
                <div class="country-stats">
                    <p>Total Cases</p>
                    <p class="cases-number total">${country.cases}</p>
                    <p>Today Cases</p>
                    <p class="cases-number today-cases">${country.todayCases}</p>
                </div>
                <div class="country-stats">
                    <p>Recovered</p>
                    <p class="cases-number recovered">${country.recovered}</p>
                    <p>Active</p>
                    <p class="cases-number active">${country.active}</p>
                </div>
                <div class="country-stats">
                    <p>Deaths</p>
                    <p class="cases-number death">${country.deaths}</p>
                    <p> Today Deaths</p>
                    <p class="cases-number new-deaths">${country.todayDeaths}</p>
                </div>
                `    
            }
        });
    }

    document.querySelector('.country-stats-container').innerHTML = html;
}



const setColors = country => {
    if (country.cases < 1000 ) {
        return '#fff5f0';
    }
    if (country.cases >= 1000 && country.cases < 10000) {
        return '#fee0d2';
    }
    if (country.cases >= 10000 && country.cases < 25000) {
        return '#fcbba1';
    }
    if (country.cases >= 25000 && country.cases < 50000) {
        return '#fc9272';
    }
    if (country.cases >= 50000 && country.cases < 100000) {
        return '#fb6a4a';
    }
    if (country.cases >= 100000 && country.cases < 200000) {
        return '#ef3b2c';
    }
    if (country.cases >= 200000 && country.cases < 500000) {
        return '#cb181d';
    }
    if (country.cases >= 500000 && country.cases < 1000000) {
        return '#a50f15';
    }
    if (country.cases >= 1000000) {
        return '#67000d';
    }
    
}

const addLegend = () => {
    const layers = ['0-1000', '1000-10000', '10000-50000', '50000-200000', '200000-500000', '5000000-1000000', '1000000+'];
    const colors = ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d'];

    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i];
        let color = colors[i];
        let item = document.createElement('div');
        let key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;
      
        let value = document.createElement('span');
        value.innerHTML = layer;
        item.appendChild(key);
        item.appendChild(value);
        document.querySelector('.legend').appendChild(item);
    }
}

const addMarkers = (data) => {
    data.map((country) => {
        let countryCenter = {
            lng: country.countryInfo.long,
            lat: country.countryInfo.lat,
        }   
        
       let marker =  new mapboxgl.Marker({
            color: setColors(country),
        })
        .setLngLat(countryCenter)
        .addTo(map);

        marker.getElement().addEventListener('click', function (e) {
            marker.setPopup(addPopups(data, countryCenter, country.country)).addTo(map);
        });
    }); 
} 

//const showDataOnMap = (data) => {
  //  data.map((country) => {
    //  let countryCenter = {
      //    lng: country.countryInfo.long,
    //  lat: country.countryInfo.lat,
      //  }
  
      //addMarkers(data, countryCenter, country);     
    //});    
//}

const addPopups = (data, countryCenter, selection) => {
    let html = '';
    let popUp = new mapboxgl.Popup({ closeOnClick: true });
    data.map(country => {
        if (country.country === selection ) {
        html =  `
        <div class="country-info-window">
                <div class="country-info-info">
                    <div class="flag">
                        <img src=" ${country.countryInfo.flag}" alt="country Flag">
                    </div>
                    <div class="country-name-tests">
                        <div class="selected-country-name">
                           <p> ${country.country} </p>
                        </div>
                        <div class="country-tests">
                            <p>Tests: ${country.tests} </p>
                        </div>
                    </div>  
                </div>    
                <div class="country-info-stats-cases">
                    <div class="circle">
                        <i class='fas fa-chevron-right'></i>
                    </div> 
                        <p>Cases: ${country.cases}</p>
                </div>
                <div class="country-info-stats-recovered">
                    <div class="circle">
                        <i class='fas fa-chevron-right'></i>
                    </div>
                        <p>Recovered: ${country.recovered}</p>
                </div>
                <div class="country-info-stats-deaths">
                <div class="circle">
                    <i class='fas fa-chevron-right'></i>
                </div>
                    <p>Deaths: ${country.deaths}</p>
            </div>
        </div>
    `
    }
    });

    
    popUp.setLngLat(countryCenter)
    .setHTML(html)
    .addTo(map);

    return popUp;
}



const showDataInTable = (data) => {
    let html = '';
    data.forEach((country)=>{
        html += `
        <tr class="country-info">
            <td class="loc">${country.country}</td>
            <td>${country.cases}</td>
            <td>${country.casesPerOneMillion}</td>
            <td>${country.recovered}</td>
            <td>${country.deaths}</td>
            <td>${country.todayCases}</td>
        </tr>
        `
    })
    document.querySelector('.country-info-container').innerHTML = html;
}

const buildChartData = data => {
    let chartData = [];
    for (let date in data.cases) {
        let newDataPoint = {
            x: date,
            y: data.cases[date]
        }

        chartData.push(newDataPoint);
    }
    return chartData;
}

const buildChart = chartData => {
    let timeFormat = 'MM/DD/YY';
    let ctx = document.getElementById('myChart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Total Cases',
                data: chartData,
                lineTension: .7,
               // backgroundColor: '#1d2c4d',
                borderColor: '#1d2c4d',
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        format: timeFormat,
                        tooltipFormat: 'll'
                    },
                    scaleLabel: {
                        display:     true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function(value, index, values) {
                            return numeral(value).format('0,0');
                        }
                    }
                }]
            }
        }
    });
}

const showNewsInNewsContainer = data => {
    let html = '';
    let articles = data["articles"]
    articles.forEach( (article) => {
        console.log(article)
        html += `
        <div class="news-card">
          <div class="news-info">
          <p class="news-source">${article.source.name}</p>
          <p class="news-card-title">${article.title}</p>
          <p class="news-description">${article.description}</p> 
          <div  class="news-link"> <a href="${article.url}"> Read more >> </a></div>
          <p class="posting-time">${article.publishedAt}</p>
          </div>
          <div class="news-cover"> <img src="${article.urlToImage}" alt=""> </div>
        </div> 
        `
    })

    document.querySelector('.news-cards-container').innerHTML = html;
}


