
window.onload = () => {
    getWorldWideData();
    getCountryData();
    getHistoricalData();
    loadMap();
    getNews();
    AOS.init();
}

 
let currentMarkers = [];
let CountriesCoordinates = {};
let countriesData ;
let tableData = [];
let sortDirection = false;
var map;

const loadMap = () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoieW9tbmEtcmFvdWYiLCJhIjoiY2s5MnY1MTJqMDNqMTNkdXJvbTEybm9jNiJ9.Ptr2DKynFUQVoaNYN-6uqA';
    map = new mapboxgl.Map({
       container: 'map',
       style: 'mapbox://styles/mapbox/light-v10',
       center: [0, 20],
       zoom: 2,
   });
   
   map.addControl(new mapboxgl.NavigationControl());   
}
 
function ipLookUp (countryData) {
    fetch('https://www.iplocate.io/api/lookup/')
    .then( response => response.json() )
    .then(data => {
        let country = data.country;
        if (country === 'United States') {
            FlyToCountry('USA', countryData);
        } else {
            FlyToCountry(country, countryData);
        }
        console.log('User\'s Location Data is ', data);
        console.log('User\'s Country', data.country);
    });
}



const getCountryData = () => {
    fetch("https://corona.lmao.ninja/v2/countries")
    .then( response => response.json())
    .then((data)=>{
        countriesData = data;
        updateDate(data.updated);
        showDataInTable(data);
        Search(data);
        ipLookUp(data);
        addMarkers(data);
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

let worldwideData = [];

const getWorldWideData = () => {
    fetch('https://corona.lmao.ninja/v2/all')
    .then(response => response.json())
    .then( data =>{
        let worldData = {...data};
        worldData.country = 'WorldWide';
        let modifiedWorldData = [worldData];
        worldwideData = modifiedWorldData;
        let PieChartData = [worldData.active, worldData.recovered, worldData.deaths];
        buildPieChart(PieChartData);
       // showDataInCountryStatsContainer(worldData.country , modifiedWorldData);
    });
}

const getNews = () => {
    fetch("https://newsapi.org/v2/everything?q=COVID&from=2020-07-28&apiKey=c361ee82ad48460287bf148b5aee5809&sortBy=popularity")
    .then(response =>  response.json())
    .then( data => {
        console.log(data["articles"]);
        showNewsInNewsContainer(data);
    })
    .catch(error => console.log('error', error));
}


const changeMapData = (metric) => {
    let MapDataColors = {
        'Active': '#4BA1FD',
        'Deaths': '#F64759',
        "Recovered": '#07BEB5'
    }
    console.log(metric);
    removeCurrentMarkers();
    addMarkers(countriesData,metric);
}

const Search = (data) => {
    new autoComplete({
       data: {
        src: async () => {
            document
				.querySelector("#autoComplete")
                .setAttribute("placeholder", "Loading...");
                const data = await countriesData;
                document.querySelector("#autoComplete").setAttribute("placeholder", "country");
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
		//document.querySelector(".location").innerHTML = selection;
		// Clear Input
		document.querySelector("#autoComplete").value = "";
		// Change placeholder with the selected value
		document
			.querySelector("#autoComplete")
            .setAttribute("placeholder", selection);
        
        // Console log autoComplete data feedback
        //console.log(feedback); 
        FlyToCountry(selection, data);
    },
    });
}

const FlyToCountry = (selection ,data) => {
    if(selection){
        map.flyTo({
            center: CountriesCoordinates[selection],
            zoom: 5,
            bearing: 0,
            speed: 1,  
            curve: 1,  
            easing: function(t) {
            return t;
            },
            essential: true
        });
        showDataInCountryStatsContainer(selection, data);
        addPopups(data, CountriesCoordinates[selection], selection);
    }   
}

const lang = 'en-US'
const voiceIndex = 1
  
const speak = async (text) => {
if (!speechSynthesis) { return }
const message = new SpeechSynthesisUtterance(text)
message.voice = await chooseVoice()
speechSynthesis.speak(message)
}
  
const getVoices = () => {
return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices()
    if (voices.length) {
    resolve(voices)
    return
    }
    speechSynthesis.onvoiceschanged = () => {
    voices = speechSynthesis.getVoices();
    resolve(voices)
    }
})
}

const chooseVoice = async () => {
const voices = (await getVoices()).filter((voice) => voice.lang == lang)

return new Promise((resolve) => {
    resolve(voices[voiceIndex])
})
}

   


const showDataInCountryStatsContainer = (selection , data) => {
   
    let html = '';
    if(selection){
        data.forEach( country => {
            if(country.country === selection) {
                
                if (country.country === 'WorldWide') {
                    speak(
                        `This app is here to help you learn about Corona virus,
                        Total cases in  ${country.country} are ${country.cases},
                        new cases in  ${country.country} are ${(country.todayCases !== null) || (country.todayCases !== undefined)  ? (country.todayCases) : 'not specified' },
                        Recovered cases in  ${country.country} are ${country.recovered},
                        Deaths in  ${country.country} are ${country.deaths}, may their souls rest in peace
                        `);
                } else {
                    speak(
                        `Total cases in  ${country.country} are ${country.cases},
                        new cases in  ${country.country} are ${(country.todayCases !== null) || (country.todayCases !== undefined)  ? (country.todayCases) : 'not specified' },
                        Recovered cases in  ${country.country} are ${country.recovered},
                        Deaths in  ${country.country} are ${country.deaths}, may their souls rest in peace
                    `);
                } 
        
                html = `
                <div class="card country-tests-card">
                    <div class="card-body country-stats">
                        <div class="ml-2">
                            <h6 class="card-title country mb-2">${country.country}</h6>
                            <div class=" text-muted font-weight-bold tests">Tests: ${numeral(country.tests).format('0.0a')} Total</div>
                        </div>
                    </div>
                </div>

                <div class="card Totalcases-card">
                    <div class="card-body country-stats">
                        <div>
                            <h6 class="card-title">Coronavirus Cases</h6>
                            <h3 class="card-subtitle  cases-number  active">${numeral(country.todayCases).format('+0,0')}</h3>
                            <div class=" text-muted font-weight-bold  total mt-3">${numeral(country.cases).format('0.0a')} Total</div>
                        </div>
                    </div>
                </div>

                <div class="card recovered-card">
                    <div class="card-body country-stats">
                        <div>
                            <h6 class="card-title">Recovered</h6>
                            <h3 class="card-subtitle   cases-number  recovered ">${numeral(country.todayRecovered).format('+0,0')}</h3>
                            <div class=" text-muted font-weight-bold  recovered mt-3">${numeral(country.recovered).format('0.0a')} Total</div>
                        </div>
                    </div>
                </div>

                <div class="card deaths-card">
                    <div class="card-body country-stats">
                        <div>
                            <h6 class="card-title">Deaths</h6>
                            <h3 class="card-subtitle  cases-number death">${numeral(country.todayDeaths).format('+0,0')}</h3>
                            <div class=" text-muted font-weight-bold  death mt-3">${numeral(country.deaths).format('0.0a')} Total</div>
                        </div>
                    </div>
                </div>
                
                `    
            }
        });
    }

    document.querySelector(".location").innerHTML = selection;
    document.querySelector('.country-stats-container').innerHTML = html;
    document.querySelector(".loader").style.display = 'none';
    document.getElementsByTagName("main")[0].style.visibility = 'visible';
}

const setColors = (country, metric) => {
    let colorsRecovered = ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"];
    let colorsActive =  ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"];
    let colorsDeaths = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
    let casesType = {
        "Active": {
            color: colorsActive,
            metricValue : country.active
        },
        "Recovered": {
            color: colorsRecovered,
            metricValue : country.recovered
        },
        "Deaths": {
            color: colorsDeaths,
            metricValue : country.deaths
        }
    }
    console.log(metric);
    console.log(casesType[metric].color);
    console.log(casesType[metric].metricValue);
   if ( casesType[metric].metricValue < 1000 ) {
        return casesType[metric].color[0] ;
    }
    if ( casesType[metric].metricValue >= 1000 && casesType[metric].metricValue < 10000) {
        return casesType[metric].color[1] ;
    }
    if ( casesType[metric].metricValue >= 10000 && casesType[metric].metricValue < 50000) {
        return casesType[metric].color[2] ;
    }
    if (casesType[metric].metricValue >= 50000 && casesType[metric].metricValue < 100000) {
        return casesType[metric].color[3] ;
    }
    if (casesType[metric].metricValue >= 100000 ) {
        return casesType[metric].color[4] ;
    }
     
}

const addMarkers = (data, metric='Active') => {
    data.map((country) => {
        let countryCenter = {
            lng: country.countryInfo.long,
            lat: country.countryInfo.lat,
        }   
       let marker =  new mapboxgl.Marker({
            color: setColors(country, metric),
        })
        .setLngLat(countryCenter)
        .addTo(map);

        currentMarkers.push(marker);

        marker.getElement().addEventListener('click', function (e) {
            marker.setPopup(addPopups(data, countryCenter, country.country)).addTo(map);
        });

        if (!Object.entries(CountriesCoordinates).includes(countryCenter)){
            CountriesCoordinates[country.country] = countryCenter;
        }
    }); 

    console.log(CountriesCoordinates);
} 

const removeCurrentMarkers = () => {
    if (currentMarkers!==null) {
        for (let i = currentMarkers.length - 1; i >= 0; i--) {
          currentMarkers[i].remove();
        }
    }
    currentMarkers = [];
    console.log(currentMarkers.length);
}

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
                                <p>Tests: </p>
                                <p>${country.tests} </p>
                            </div>
                        </div>  
                    </div>
                    <div class="country-info-cases"> 
                        <div class="country-info-stats-cases">
                            <p>Cases:</p>
                            <p class="active">${country.cases}</p>
                        </div>
                        <div class="country-info-stats-recovered">
                            <p>Recovered:</p>
                            <p class="recovered"> ${country.recovered} </p>
                        </div>
                        <div class="country-info-stats-deaths">
                            <p>Deaths:</p>
                            <p class="death">${country.deaths}</p>
                        </div>
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

const  updateDate = (dateTimestamp) => {
    let date = moment(dateTimestamp).format("[Last Updated] MMMM DD, YYYY");
    document.querySelector('.date').textContent = date;
}

const showDataInTable = (data) => {
    let html = '';
    let worldCountriesData = [];
    if (data[0]['country'] !== "WorldWide" && data[data.length - 1]['country'] !== "WorldWide") {
        worldCountriesData = worldwideData.concat(data);
    } else {
        worldCountriesData = data;
    }
    tableData = worldCountriesData;
    console.log(tableData);
    worldCountriesData.forEach((country)=>{
        html += `
        <tr class="country-info">
            <td class="loc">${country.country}</td>
            <td class="cases">${country.cases}</td>
            <td class="today-cases">${numeral(country.todayCases).format('+0,0')}</td>
        </tr>
        `
    })
    document.querySelector('.country-info-container').innerHTML = html;
}


const sortColumn = (columnCasesType) => {
    const dataType = typeof tableData[0][columnCasesType];
    sortDirection = !sortDirection;

    switch(dataType) {
        case 'number':
            sortColumnData(sortDirection, columnCasesType);
            break;
    }

    showDataInTable(tableData);
} 


const sortColumnData = (sort, columnCasesType) => {
    tableData = tableData.sort((a, b) => sort ? a[columnCasesType] - b[columnCasesType] : b[columnCasesType] - a[columnCasesType]);
}

const buildChartData = data => {
    let ActiveCasesData = [];
    let RecoveredCasesData = [];
    let DeathCasesData = [];
    let chartData = {
        Active: ActiveCasesData,
        Recovered: RecoveredCasesData,
        Deaths: DeathCasesData
    };
    
   let lastDataPoint;

    for (let date in data.cases) {
        if(lastDataPoint) {
            let newActiveDataPoint = {
                x: date,
                y: data.cases[date]  - lastDataPoint
            }
            ActiveCasesData.push(newActiveDataPoint);
        }
        lastDataPoint = data.cases[date];
        
    }

    for (let date in data.recovered) {
        let newRecoveredDataPoint = {
            x: date,
            y: data.recovered[date]
        }
        RecoveredCasesData.push(newRecoveredDataPoint);
    }
   
    for (let date in data.deaths) {
        let newDeathDataPoint = {
            x: date,
            y: data.deaths[date]
        }
        DeathCasesData.push(newDeathDataPoint);
    }

    return chartData;
}


const buildPieChart = PieChartData => {
    let ctx_PChart = document.getElementById('myChart-pieChart').getContext('2d');
    let myPieChart = new Chart(ctx_PChart, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: PieChartData,
                backgroundColor: ["#FFB21A", "#07BEB5", "#F64759"],
            }],
            labels: [
                'Active',
                'Recovered',
                'Deaths'
            ],
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            title: {
                display: true,
                text: 'ActiveCases, Recovered, and Deaths worldWide'
            }
        } 
    });
}

const buildChart = chartData => {
    let timeFormat = 'MM/DD/YY';
    let ctx_LChart = document.getElementById('myChart-linearChart').getContext('2d');
    let chart = new Chart(ctx_LChart, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Total Cases',
                data: chartData.Active,
                lineTension: .7,
                borderColor: '#6baed6',
                backgroundColor: '#6baed6',
                fill: false,
            },
            {
                label: 'Recovered',
                data: chartData.Recovered,
                lineTension: .7,
                borderColor: '#74c476',
                backgroundColor: '#74c476',
                fill: false,
            },
            {
                label: 'Deaths',
                data: chartData.Deaths,
                lineTension: .7,
                borderColor: '#fb6a4a',
                backgroundColor: '#fb6a4a',
                fill: false,
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            title: {
                display: true,
                text: 'ActiveCases, Recovered, and Deaths globally in the last 120 days'
            },
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
                }],
                yAxes: [{
                    gridLines: {
                        display:false
                    },
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

    let glide = new Glide('.news', {
        type: 'carousel',
        //autoplay: 2000,
        perView: 7,
        draggable: true,
        focusAt: 'center',
        gap: 40,
        breakpoints: {
            1440: {
                perView: 4.5
            },
            1024: {
                perView: 3.5
            },
            768: {
                perView: 2.5
            },
            426: {
                perView: 1.7
            },
            376: {
                perView: 1.5
            }
        }
    });

    let html = '';
    let articles = data["articles"]
    articles.map( (article) => {
        console.log(article)
        html += `
        <li class="glide__slide">
            <div class="news-card">
                <div class="news-cover"> <img src="${article.urlToImage}" alt="news-cover-image"> </div>
                <div class="news-info">
                <p class="news-source">${article.source.name}</p>
                <p class="news-card-title">${(article.title)}</p>         
                <div  class="news-link">  <a href="${article.url}"> Read more <i class="fa fa-chevron-right"></i> </a>  </div>
                <p class="posting-time">${(article.publishedAt).substring(0, 10)}</p>
                </div>
            </div> 
        </li>
        `
    })

    document.querySelector('.glide__slides').innerHTML = html;
    glide.mount();

}


