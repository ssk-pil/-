const express = require('express');
const app = express();
const port = 3000;

// Маршрут для /static
app.get('/static', (req, res) => {
  res.json({
    header: "Hello",
    body: "Octagon NodeJS Test"
  });
});

// Маршрут для /dynamic
app.get('/dynamic', (req, res) => {
    // Получаем параметры a, b, c из строки запроса
    const { a, b, c } = req.query;

    // Проверяем, что все параметры переданы
    if (!a || !b || !c) {
        return res.status(400).json({ header: "Error" });
    }

    // Преобразуем строки в числа
    const numA = Number(a);
    const numB = Number(b);
    const numC = Number(c);

    // Проверяем, что все значения являются числами (не NaN)
    if (isNaN(numA) || isNaN(numB) || isNaN(numC)) {
        return res.status(400).json({ header: "Error" });
    }

    // Вычисляем результат: (a * b * c) / 3
    const result = (numA * numB * numC) / 3;

    res.json({
        header: "Calculated",
        body: String(result)
    });
});

// Обработка 404 ошибок
app.use((req, res) => {
    res.status(404).json({ header: "Error" });
});

// Обработка ошибок сервера
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ header: "Error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Тестируйте маршруты:`);
  console.log(`- http://localhost:${port}/static`);
  console.log(`- http://localhost:${port}/dynamic?a=1&b=2&c=3`);
});