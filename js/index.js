const DISEASE_API = 'https://disease.sh/v3/covid-19';
const DATA_BASE = new URL('data/', window.location.href).href;

window.onload = () => {
  bootstrapApp();
};

let currentMarkers = [];
let CountriesCoordinates = {};
let countriesData = [];
let tableData = [];
let sortDirection = false;
let worldwideData = [];
let map;
let appReady = false;

const setLoaderProgress = (label, percent) => {
  const status = document.getElementById('loader-status');
  const bar = document.getElementById('loader-bar');
  if (status) status.textContent = label;
  if (bar) bar.style.width = `${percent}%`;
};

const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  const main = document.getElementsByTagName('main')[0];
  setLoaderProgress('Ready', 100);
  if (loader) {
    loader.classList.add('is-done');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 320);
  }
  if (main) {
    main.classList.add('is-ready');
  }
};

const bootstrapApp = async () => {
  try {
    setLoaderProgress('Fetching worldwide totals…', 20);
    const worldwidePromise = getWorldWideData();
    setLoaderProgress('Loading country statistics…', 40);
    const countriesPromise = getCountryData();
    setLoaderProgress('Building historical charts…', 60);
    const historicalPromise = getHistoricalData();

    await Promise.all([worldwidePromise, countriesPromise, historicalPromise]);

    setLoaderProgress('Rendering dashboard…', 85);
    showDataInTable(countriesData);
    showDataInCountryStatsContainer('WorldWide', worldwideData);
    hideLoader();
    appReady = true;
    setLoaderProgress('Loading map…', 92);
    await loadMap();
    addMarkers(countriesData);
    ipLookUp(countriesData);
    getNews();
  } catch (error) {
    console.error('Failed to bootstrap app', error);
    setLoaderProgress('Something went wrong. Showing available data…', 100);
    hideLoader();
    getNews();
  }
};

const loadMap = () =>
  new Promise((resolve, reject) => {
    try {
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [0, 20],
        zoom: 2,
      });

      map.addControl(new maplibregl.NavigationControl());

      map.on('load', () => {
        map.resize();
        resolve(map);
      });

      map.on('error', (event) => {
        console.warn('Map error', event && event.error);
      });
    } catch (error) {
      reject(error);
    }
  });

function ipLookUp(countryData) {
  fetch('https://www.iplocate.io/api/lookup/')
    .then((response) => response.json())
    .then((data) => {
      let country = data.country;
      if (country === 'United States') {
        FlyToCountry('USA', countryData);
      } else {
        FlyToCountry(country, countryData);
      }
    })
    .catch((error) => {
      console.warn('IP lookup unavailable', error);
    });
}

const fetchJson = async (urls) => {
  let lastError;
  for (let i = 0; i < urls.length; i += 1) {
    try {
      const response = await fetch(urls[i]);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${urls[i]}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Failed to load data');
};

const getCountryData = () =>
  fetchJson([
    `${DISEASE_API}/countries`,
    `${DATA_BASE}countries.json`,
  ]).then((data) => {
    countriesData = data;
    const updated = data[0] && data[0].updated;
    if (updated) updateDate(updated);
    Search(data);
    return data;
  });

const getHistoricalData = () =>
  fetchJson([
    `${DISEASE_API}/historical/all?lastdays=120`,
    `${DATA_BASE}historical.json`,
  ]).then((data) => {
    const chartData = buildChartData(data);
    buildChart(chartData);
    return data;
  });

const getWorldWideData = () =>
  fetchJson([`${DISEASE_API}/all`, `${DATA_BASE}all.json`]).then((data) => {
    const worldData = { ...data, country: 'WorldWide' };
    worldwideData = [worldData];
    const PieChartData = [
      worldData.active,
      worldData.recovered,
      worldData.deaths,
    ];
    buildPieChart(PieChartData);
    if (worldData.updated) updateDate(worldData.updated);
    return worldData;
  });

const getNews = () => {
  fetchJson([`${DATA_BASE}news.json`])
    .then((data) => {
      if (data && data.articles && data.articles.length) {
        showNewsInNewsContainer(data);
      }
    })
    .catch((error) => console.warn('News unavailable', error));
};

const changeMapData = (metric) => {
  if (!countriesData || !countriesData.length) return;
  document.querySelectorAll('.metric-btn').forEach((button) => {
    const onclick = button.getAttribute('onclick') || '';
    button.classList.toggle('is-active', onclick.indexOf(`'${metric}'`) !== -1);
  });
  removeCurrentMarkers();
  addMarkers(countriesData, metric);
};

const Search = (data) => {
  const hideEmptyResults = () => {
    const list = document.querySelector('#autoComplete_list');
    if (!list) return;
    const hasItems = list.querySelectorAll('li').length > 0;
    list.hidden = !hasItems;
    list.style.display = hasItems ? '' : 'none';
  };

  new autoComplete({
    data: {
      src: async () => {
        document
          .querySelector('#autoComplete')
          .setAttribute('placeholder', 'Loading...');
        const source = await countriesData;
        document
          .querySelector('#autoComplete')
          .setAttribute('placeholder', 'Search country');
        return source;
      },
      key: ['country'],
      cache: false,
    },
    sort: (a, b) => {
      if (a.match < b.match) return -1;
      if (a.match > b.match) return 1;
      return 0;
    },
    placeHolder: 'Search country',
    selector: '#autoComplete',
    threshold: 1,
    debounce: 100,
    searchEngine: 'loose',
    highlight: true,
    maxResults: 5,
    resultsList: {
      render: true,
      container: (source) => {
        source.setAttribute('id', 'autoComplete_list');
        source.hidden = true;
        source.style.display = 'none';
      },
      destination: document.querySelector('#autoComplete'),
      position: 'afterend',
      element: 'ul',
    },
    resultItem: {
      content: (item, source) => {
        source.innerHTML = item.match;
      },
      element: 'li',
    },
    noResults: () => {
      const list = document.querySelector('#autoComplete_list');
      if (!list) return;
      list.innerHTML = '';
      const result = document.createElement('li');
      result.setAttribute('class', 'no_result');
      result.setAttribute('tabindex', '1');
      result.innerHTML = 'No Results';
      list.appendChild(result);
      hideEmptyResults();
    },
    onSelection: (feedback) => {
      const selection = feedback.selection.value.country;
      document.querySelector('#autoComplete').value = '';
      document
        .querySelector('#autoComplete')
        .setAttribute('placeholder', selection);
      const list = document.querySelector('#autoComplete_list');
      if (list) {
        list.innerHTML = '';
        list.hidden = true;
        list.style.display = 'none';
      }
      FlyToCountry(selection, data);
    },
  });

  const input = document.querySelector('#autoComplete');
  if (input) {
    input.addEventListener('input', () => {
      requestAnimationFrame(hideEmptyResults);
    });
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const list = document.querySelector('#autoComplete_list');
        if (list && !list.querySelectorAll('li').length) {
          list.hidden = true;
          list.style.display = 'none';
        }
      }, 150);
    });
  }

  const listObserverTarget = document.querySelector('.search-container');
  if (listObserverTarget) {
    const observer = new MutationObserver(hideEmptyResults);
    observer.observe(listObserverTarget, {
      childList: true,
      subtree: true,
    });
  }
};

const FlyToCountry = (selection, data) => {
  if (!selection || !map) return;

  const coordinates = CountriesCoordinates[selection];
  if (coordinates) {
    map.flyTo({
      center: coordinates,
      zoom: 5,
      bearing: 0,
      speed: 1,
      curve: 1,
      easing: function (t) {
        return t;
      },
      essential: true,
    });
  }

  const source =
    selection === 'WorldWide' ? worldwideData : data || countriesData;
  showDataInCountryStatsContainer(selection, source);

  if (coordinates) {
    addPopups(source, coordinates, selection);
  }
};

const showDataInCountryStatsContainer = (selection, data) => {
  let html = '';
  if (selection && Array.isArray(data)) {
    data.forEach((country) => {
      if (country.country === selection) {
        html = `
                <article class="kpi-card tests">
                    <p class="kpi-label">${country.country}</p>
                    <p class="kpi-value">${numeral(country.tests).format('0.0a')}</p>
                    <p class="kpi-sub">Tests reported</p>
                </article>

                <article class="kpi-card cases">
                    <p class="kpi-label">Cases</p>
                    <p class="kpi-value">${numeral(country.todayCases).format('+0,0')}</p>
                    <p class="kpi-sub">${numeral(country.cases).format('0.0a')} total</p>
                </article>

                <article class="kpi-card recovered">
                    <p class="kpi-label">Recovered</p>
                    <p class="kpi-value">${numeral(country.todayRecovered).format('+0,0')}</p>
                    <p class="kpi-sub">${numeral(country.recovered).format('0.0a')} total</p>
                </article>

                <article class="kpi-card deaths">
                    <p class="kpi-label">Deaths</p>
                    <p class="kpi-value">${numeral(country.todayDeaths).format('+0,0')}</p>
                    <p class="kpi-sub">${numeral(country.deaths).format('0.0a')} total</p>
                </article>
                `;
      }
    });
  }

  const locationEl = document.querySelector('.location');
  const statsEl = document.querySelector('.country-stats-container');
  if (locationEl) locationEl.innerHTML = selection;
  if (statsEl) statsEl.innerHTML = html;
  if (!appReady) hideLoader();
};

const setColors = (country, metric) => {
  let colorsRecovered = ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'];
  let colorsActive = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
  let colorsDeaths = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
  let casesType = {
    Active: {
      color: colorsActive,
      metricValue: country.active,
    },
    Recovered: {
      color: colorsRecovered,
      metricValue: country.recovered,
    },
    Deaths: {
      color: colorsDeaths,
      metricValue: country.deaths,
    },
  };

  const selected = casesType[metric] || casesType.Active;

  if (selected.metricValue < 1000) {
    return selected.color[0];
  }
  if (selected.metricValue >= 1000 && selected.metricValue < 10000) {
    return selected.color[1];
  }
  if (selected.metricValue >= 10000 && selected.metricValue < 50000) {
    return selected.color[2];
  }
  if (selected.metricValue >= 50000 && selected.metricValue < 100000) {
    return selected.color[3];
  }
  return selected.color[4];
};

const addMarkers = (data, metric = 'Active') => {
  if (!map || !Array.isArray(data)) return;

  data.forEach((country) => {
    if (!country.countryInfo) return;

    let countryCenter = {
      lng: country.countryInfo.long,
      lat: country.countryInfo.lat,
    };

    let marker = new maplibregl.Marker({
      color: setColors(country, metric),
    })
      .setLngLat(countryCenter)
      .addTo(map);

    currentMarkers.push(marker);

    marker.getElement().addEventListener('click', function () {
      marker
        .setPopup(addPopups(data, countryCenter, country.country))
        .addTo(map);
    });

    CountriesCoordinates[country.country] = countryCenter;
  });
};

const removeCurrentMarkers = () => {
  if (currentMarkers !== null) {
    for (let i = currentMarkers.length - 1; i >= 0; i--) {
      currentMarkers[i].remove();
    }
  }
  currentMarkers = [];
};

const addPopups = (data, countryCenter, selection) => {
  let html = '';
  let popUp = new maplibregl.Popup({
    closeOnClick: true,
    maxWidth: '420px',
    offset: 18,
  });
  data.forEach((country) => {
    if (country.country === selection) {
      html = `
                <div class="country-info-window">
                    <div class="popup-identity">
                        <img class="popup-flag" src="${country.countryInfo.flag}" alt="">
                        <p class="selected-country-name">${country.country}</p>
                    </div>
                    <div class="popup-metrics">
                        <div class="popup-metric">
                            <span class="popup-metric-label">Tests</span>
                            <span class="popup-metric-value">${numeral(country.tests).format('0.0a')}</span>
                        </div>
                        <div class="popup-metric">
                            <span class="popup-metric-label">Cases</span>
                            <span class="popup-metric-value active">${numeral(country.cases).format('0.0a')}</span>
                        </div>
                        <div class="popup-metric">
                            <span class="popup-metric-label">Recovered</span>
                            <span class="popup-metric-value recovered">${numeral(country.recovered).format('0.0a')}</span>
                        </div>
                        <div class="popup-metric">
                            <span class="popup-metric-label">Deaths</span>
                            <span class="popup-metric-value death">${numeral(country.deaths).format('0.0a')}</span>
                        </div>
                    </div>
                </div>
            `;
    }
  });

  popUp.setLngLat(countryCenter).setHTML(html).addTo(map);

  return popUp;
};

const updateDate = (dateTimestamp) => {
  const dateEl = document.querySelector('.date');
  if (!dateEl || !dateTimestamp) return;
  dateEl.textContent = moment(dateTimestamp).format('[Updated] MMM D, YYYY');
};

const showDataInTable = (data) => {
  let html = '';
  let worldCountriesData = [];
  if (
    !data.length ||
    (data[0]['country'] !== 'WorldWide' &&
      data[data.length - 1]['country'] !== 'WorldWide')
  ) {
    worldCountriesData = worldwideData.concat(data);
  } else {
    worldCountriesData = data;
  }
  tableData = worldCountriesData;
  worldCountriesData.forEach((country) => {
    html += `
        <tr class="country-info">
            <td class="loc">${country.country}</td>
            <td class="cases">${country.cases}</td>
            <td class="today-cases">${numeral(country.todayCases).format('+0,0')}</td>
        </tr>
        `;
  });
  const tableBody = document.querySelector('.country-info-container');
  if (tableBody) tableBody.innerHTML = html;
};

const sortColumn = (columnCasesType) => {
  if (!tableData.length) return;
  const dataType = typeof tableData[0][columnCasesType];
  sortDirection = !sortDirection;

  switch (dataType) {
    case 'number':
      sortColumnData(sortDirection, columnCasesType);
      break;
  }

  showDataInTable(tableData);
};

const sortColumnData = (sort, columnCasesType) => {
  tableData = tableData.sort((a, b) =>
    sort
      ? a[columnCasesType] - b[columnCasesType]
      : b[columnCasesType] - a[columnCasesType],
  );
};

const buildChartData = (data) => {
  let ActiveCasesData = [];
  let RecoveredCasesData = [];
  let DeathCasesData = [];
  let chartData = {
    Active: ActiveCasesData,
    Recovered: RecoveredCasesData,
    Deaths: DeathCasesData,
  };

  let lastDataPoint;

  for (let date in data.cases) {
    if (lastDataPoint) {
      let newActiveDataPoint = {
        x: date,
        y: data.cases[date] - lastDataPoint,
      };
      ActiveCasesData.push(newActiveDataPoint);
    }
    lastDataPoint = data.cases[date];
  }

  for (let date in data.recovered) {
    let newRecoveredDataPoint = {
      x: date,
      y: data.recovered[date],
    };
    RecoveredCasesData.push(newRecoveredDataPoint);
  }

  for (let date in data.deaths) {
    let newDeathDataPoint = {
      x: date,
      y: data.deaths[date],
    };
    DeathCasesData.push(newDeathDataPoint);
  }

  return chartData;
};

const buildPieChart = (PieChartData) => {
  let ctx_PChart = document.getElementById('myChart-pieChart').getContext('2d');
  new Chart(ctx_PChart, {
    type: 'doughnut',
    data: {
      datasets: [
        {
          data: PieChartData,
          backgroundColor: ['#2F6FED', '#0F8A7A', '#C23B4A'],
          borderWidth: 0,
        },
      ],
      labels: ['Active', 'Recovered', 'Deaths'],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      cutoutPercentage: 62,
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontColor: '#5B6B7C',
          padding: 16,
        },
      },
      title: {
        display: false,
      },
    },
  });
};

const buildChart = (chartData) => {
  let timeFormat = 'MM/DD/YY';
  let ctx_LChart = document
    .getElementById('myChart-linearChart')
    .getContext('2d');
  new Chart(ctx_LChart, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'New cases',
          data: chartData.Active,
          lineTension: 0.35,
          borderColor: '#2F6FED',
          backgroundColor: '#2F6FED',
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Recovered',
          data: chartData.Recovered,
          lineTension: 0.35,
          borderColor: '#0F8A7A',
          backgroundColor: '#0F8A7A',
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Deaths',
          data: chartData.Deaths,
          lineTension: 0.35,
          borderColor: '#C23B4A',
          backgroundColor: '#C23B4A',
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      legend: {
        labels: {
          boxWidth: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontColor: '#5B6B7C',
          padding: 16,
        },
      },
      title: {
        display: false,
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        xAxes: [
          {
            type: 'time',
            time: {
              format: timeFormat,
              tooltipFormat: 'll',
            },
            gridLines: {
              display: false,
            },
            ticks: {
              fontColor: '#5B6B7C',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: '#E8EEF4',
              zeroLineColor: '#E8EEF4',
              drawBorder: false,
            },
            ticks: {
              fontColor: '#5B6B7C',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              callback: function (value) {
                return numeral(value).format('0.0a');
              },
            },
          },
        ],
      },
    },
  });
};

const showNewsInNewsContainer = (data) => {
  let html = '';
  let articles = data['articles'] || [];
  articles.forEach((article) => {
    const image =
      article.urlToImage ||
      'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800';
    const title = article.title || 'COVID-19 update';
    const source = (article.source && article.source.name) || 'News';
    const url = article.url || '#';
    const published = (article.publishedAt || '').substring(0, 10);

    html += `
        <li class="glide__slide">
            <div class="news-card">
                <div class="news-cover"> <img src="${image}" alt="news-cover-image" onerror="this.src='https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800'"> </div>
                <div class="news-info">
                <p class="news-source">${source}</p>
                <p class="news-card-title">${title}</p>
                <div  class="news-link">  <a href="${url}" target="_blank" rel="noopener noreferrer"> Read more <i class="fa fa-chevron-right"></i> </a>  </div>
                <p class="posting-time">${published}</p>
                </div>
            </div>
        </li>
        `;
  });

  document.querySelector('.glide__slides').innerHTML = html;

  const glide = new Glide('.news', {
    type: 'carousel',
    perView: 4,
    draggable: true,
    focusAt: 0,
    gap: 18,
    peek: {
      before: 0,
      after: 24,
    },
    breakpoints: {
      1200: {
        perView: 2.4,
        gap: 16,
      },
      900: {
        perView: 1.6,
        gap: 14,
      },
      640: {
        perView: 1.15,
        gap: 12,
        peek: {
          before: 0,
          after: 36,
        },
      },
    },
  });

  glide.mount();
};

window.changeMapData = changeMapData;
window.sortColumn = sortColumn;
