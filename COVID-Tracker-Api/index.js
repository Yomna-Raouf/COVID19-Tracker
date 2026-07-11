require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs');
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const DISEASE_API = 'https://disease.sh/v3/covid-19';
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const mockDir = path.join(__dirname, 'mock');
const frontendDir = path.join(__dirname, '..');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

const readMock = (filename) =>
  JSON.parse(fs.readFileSync(path.join(mockDir, filename), 'utf8'));

const fetchWithFallback = async (url, mockFile) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn(`Live fetch failed for ${url}. Using mock: ${mockFile}`);
    console.warn(error.message);
    return readMock(mockFile);
  }
};

app.get('/api/countries', async (req, res) => {
  const data = await fetchWithFallback(
    `${DISEASE_API}/countries`,
    'countries.json'
  );
  res.json(data);
});

app.get('/api/all', async (req, res) => {
  const data = await fetchWithFallback(`${DISEASE_API}/all`, 'all.json');
  res.json(data);
});

app.get('/api/historical', async (req, res) => {
  const data = await fetchWithFallback(
    `${DISEASE_API}/historical/all?lastdays=120`,
    'historical.json'
  );
  res.json(data);
});

app.get('/api/news', async (req, res) => {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY missing. Using mock news.');
    return res.json(readMock('news.json'));
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().slice(0, 10);
  const newsUrl =
    `https://newsapi.org/v2/everything?q="COVID-19"%20OR%20coronavirus` +
    `&from=${from}&sortBy=publishedAt&pageSize=20&language=en` +
    `&apiKey=${NEWS_API_KEY}`;

  try {
    const response = await axios.get(newsUrl, { timeout: 10000 });
    const relevant = (response.data.articles || []).filter((article) => {
      if (!article || !article.title || !article.url) return false;
      const text = `${article.title} ${article.description || ''}`;
      return /covid|coronavirus|sars-cov|pandemic/i.test(text);
    });

    if (relevant.length < 4) {
      console.warn('Not enough relevant news articles. Using mock news.');
      return res.json(readMock('news.json'));
    }

    res.json({ ...response.data, articles: relevant.slice(0, 12) });
  } catch (error) {
    console.warn('News API failed. Using mock news.');
    console.warn(error.message);
    res.json(readMock('news.json'));
  }
});

app.use(express.static(frontendDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`COVID Tracker running at http://localhost:${port}`);
});
