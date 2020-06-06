
window.onload = () => {
    getCountryData();
}

mapboxgl.accessToken = 'pk.eyJ1IjoieW9tbmEtcmFvdWYiLCJhIjoiY2s5MnY1MTJqMDNqMTNkdXJvbTEybm9jNiJ9.Ptr2DKynFUQVoaNYN-6uqA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
});

const getCountryData = () => {
    fetch("https://corona.lmao.ninja/v2/countries")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        //showDataOnMap(data);
        showDataInTable(data);
    })
}

const showDataInTable = (data) => {
    var html = '';
    data.forEach((country)=>{
        html += `
        <tr class="country-info">
            <td class="country-location loc">${country.country}</td>
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