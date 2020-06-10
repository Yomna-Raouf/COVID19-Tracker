
window.onload = () => {
    getCountryData();
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
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        showDataOnMap(data);
        showDataInTable(data);
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