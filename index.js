const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Привет Октагон!');
});

app.listen(port, () => {
  console.log(`Пример приложения работает на порту ${port}`);
});
