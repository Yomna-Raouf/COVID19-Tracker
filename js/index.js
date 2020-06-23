
window.onload = () => {
    getWorldWideData();
    getCountryData();
    getHistoricalData();
    addLegend();
    getNews();
}

let reflectTotalCasesBtn = document.querySelector('.TotalCases');
let reflectRecoveredBtn = document.querySelector('.Recovered');
let reflectDeathsBtn = document.querySelector('.deaths');
 
mapboxgl.accessToken = 'pk.eyJ1IjoieW9tbmEtcmFvdWYiLCJhIjoiY2s5MnY1MTJqMDNqMTNkdXJvbTEybm9jNiJ9.Ptr2DKynFUQVoaNYN-6uqA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [0, 20],
    zoom: 2,
});



const getCountryData = () => {
    fetch("https://corona.lmao.ninja/v2/countries")
    .then( response => response.json())
    .then((data)=>{
        showDataInTable(data);
        Search(data);
        reflectTotalCasesBtn.addEventListener('click', () => {
            console.log('reflectTotalCasesBtn');
            addMarkers(data, "Active");
        });
        reflectDeathsBtn.addEventListener('click', () => {
            console.log('reflectDeathsBtn');
            addMarkers(data, "Deaths");
        });
        reflectRecoveredBtn.addEventListener('click', () => {
            console.log('reflectRecoveredBtn');
            addMarkers(data, "Recovered");
        });
        addMarkers(data, "Active");
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
        worldData.country = 'WorldWide';
        let modifiedWorldData = [worldData];
        let PieChartData = [worldData.active, worldData.recovered, worldData.deaths];
        buildPieChart(PieChartData);
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
    showDataInCountryStatsContainer(selection, data);
    addPopups(data, countryCoordinates, selection);
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
                        `This app is here to help you learn about COVID19,
                        Total cases in  ${country.country} are ${country.cases},
                        Today cases in  ${country.country} are ${(country.todayCases !== null) || (country.todayCases !== undefined)  ? (country.todayCases) : 'not specified' },
                        Recovered cases in  ${country.country} are ${country.recovered},
                        Deaths in  ${country.country} are ${country.deaths}, may their souls rest in peace
                        `);
                } else {
                    speak(
                        `Total cases in  ${country.country} are ${country.cases},
                        Today cases in  ${country.country} are ${(country.todayCases !== null) || (country.todayCases !== undefined)  ? (country.todayCases) : 'not specified' },
                        Recovered cases in  ${country.country} are ${country.recovered},
                        Deaths in  ${country.country} are ${country.deaths}, may their souls rest in peace
                    `);
                }
        
                   

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
                console.log(country);
            }
        });
    }

    document.querySelector('.country-stats-container').innerHTML = html;
}

const setColors = (country, metric) => {
    let colorsRecovered = ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"];
    let colorsActive =  ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"];
    let colorsDeaths = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"];
    let obj = {
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
    console.log(obj[metric].color);
    console.log(obj[metric].metricValue);
   if ( obj[metric].metricValue < 1000 ) {
        return obj[metric].color[0] ;
    }
    if ( obj[metric].metricValue >= 1000 && obj[metric].metricValue < 10000) {
        return obj[metric].color[1] ;
    }
    if ( obj[metric].metricValue >= 10000 && obj[metric].metricValue < 50000) {
        return obj[metric].color[2] ;
    }
    if (obj[metric].metricValue >= 50000 && obj[metric].metricValue < 100000) {
        return obj[metric].color[3] ;
    }
    if (obj[metric].metricValue >= 100000 ) {
        return obj[metric].color[4] ;
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


const addMarkers = (data, metric) => {
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
    let ActiveCasesData = [];
    let RecoveredCasesData = [];
    let DeathCasesData = [];
    let chartData = {
        Active: ActiveCasesData,
        Recovered: RecoveredCasesData,
        Deaths: DeathCasesData
    };
    for (let date in data.cases) {
        let newActiveDataPoint = {
            x: date,
            y: data.cases[date]
        }
        ActiveCasesData.push(newActiveDataPoint);
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
        type: 'pie',
        data: {
            datasets: [{
                data: PieChartData,
                backgroundColor: ["#6baed6", "#74c476", "#fb6a4a"],
            }],

            labels: [
                'Active',
                'Recovered',
                'Deaths'
            ],

        },
        options: {
            mainAspectRatio: false,
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
            mainAspectRatio: false,
            responsive: true,
            title: {
                display: true,
                text: 'ActiveCases, Recovered, and Deaths worldWide in the last 120 days'
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
                    //scaleLabel: {
                     //   display:     true,
                   //     labelString: 'Date'
                 //   }
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

    let glide = new Glide('.news', {
        type: 'carousel',
        autoplay: 2000,
        perView: 5,
        draggable: true,
        focusAt: 'center',
        gap: 40,
        breakpoints: {
            1200: {
                perView: 3
            },
            800: {
                perView: 2
            }
        }
    });

    let html = '';
    let articles = data["articles"]
    articles.forEach( (article) => {
        console.log(article)
        html += `
        <il class="glide__slide">
            <div class="news-card">
                <div class="news-cover"> <img src="${article.urlToImage}" alt=""> </div>
                <div class="news-info">
                <p class="news-source">${article.source.name}</p>
                <p class="news-card-title">${(article.title).substring(0, 45)} ...</p>         
                <div  class="news-link"> <a href="${article.url}"> Read more <i class="fa fa-chevron-right"></i> </a></div>
                <p class="posting-time">${(article.publishedAt).substring(0, 10)}</p>
                </div>
            </div> 
        </il>
        `
    })

    document.querySelector('.glide__slides').innerHTML = html;
    glide.mount();

}


