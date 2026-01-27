const express = require('express');
const app = express();

const { PORT } = require('../config/env');

app.get('/', (req, res) => {
  res.send('Incident-Hub backend funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
