
window.onload = () => {
    getCountryData();
    getHistoricalData();
    addLegend();
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
        showDataOnMap(data);
        showDataInTable(data);
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


const setColors = country => {
  //  ,,,,,,,'#a50f15','#67000d'
    if (country.cases < 1000 ) {
        return '#fff5f0';
    }
    if (country.cases >= 1000 && country.cases < 10000) {
        return '#fee0d2';
    }
    if (country.cases >= 10000 && country.cases < 50000) {
        return '#fcbba1';
    }
    if (country.cases >= 50000 && country.cases < 200000) {
        return '#fc9272';
    }
    if (country.cases >= 200000 && country.cases < 500000) {
        return '#fb6a4a';
    }
    if (country.cases >= 500000 && country.cases < 1000000) {
        return '#ef3b2c';
    }
    if (country.cases > 1000000) {
        return '#cb181d';
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

const addMarkers = (countryCenter, country) => {
    new mapboxgl.Marker({
        color: setColors(country),
    })
    .setLngLat(countryCenter)
    .addTo(map);
} 

const showDataOnMap = (data) => {

  data.map((country) => {
    let countryCenter = {
        lng: country.countryInfo.long,
        lat: country.countryInfo.lat,
    }

    addMarkers(countryCenter, country);     
  });
       
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