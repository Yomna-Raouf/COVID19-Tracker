const express = require('express');
const app = express();
const axios = require('axios');
const port = 3001;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});


app.get('/', (req, res) => {
    axios.get('https://corona.lmao.ninja/v2/countries')
    .then ((response) => {
        res.send(response.data);
    });
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));