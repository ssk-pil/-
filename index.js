const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ПОДКЛЮЧЕНИЕ К БД через Sequelize (с использованием mysql2) =====
const sequelize = new Sequelize('ChatBotTests', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',          // Используем mysql2 под капотом
    dialectModule: require('mysql2'), // Явно указываем mysql2
    logging: false,            // Отключаем логи SQL запросов
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Проверка подключения
sequelize.authenticate()
    .then(() => {
        console.log('✅ Подключено к БД ChatBotTests через mysql2 + Sequelize');
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к БД:', err);
    });

// ===== ОПРЕДЕЛЕНИЕ МОДЕЛИ =====
const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'desc', // Экранируем зарезервированное слово
        validate: {
            notEmpty: true
        }
    }
}, {
    tableName: 'Items',
    timestamps: false, // Отключаем createdAt/updatedAt
    freezeTableName: true
});

// Синхронизация модели с БД
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Таблица Items синхронизирована');
    })
    .catch(err => {
        console.error('❌ Ошибка синхронизации:', err);
    });

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ РАБОТЫ С mysql2 НАПРЯМУЮ (опционально) =====
// Для прямых запросов через mysql2, если нужны специфические операции
const mysql2 = require('mysql2');
const pool = mysql2.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ChatBotTests',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// ===== РОУТЫ =====

// 4a. GET - getAllItems (через Sequelize)
app.get('/getAllItems', async (req, res) => {
    try {
        const items = await Item.findAll({
            raw: true // Возвращаем чистые объекты
        });
        res.json(items);
    } catch (error) {
        console.error('Ошибка getAllItems:', error);
        res.json(null);
    }
});

// 4b. POST - addItem (через Sequelize)
app.post('/addItem', async (req, res) => {
    try {
        const { name, desc } = req.query;
        
        // Валидация параметров
        if (!name || !desc || name.trim() === '' || desc.trim() === '') {
            res.json(null);
            return;
        }

        const newItem = await Item.create({
            name: name.trim(),
            desc: desc.trim()
        });

        // Возвращаем объект без метаданных Sequelize
        res.json(newItem.toJSON());
    } catch (error) {
        console.error('Ошибка addItem:', error);
        res.json(null);
    }
});

// 4c. POST - deleteItem (через Sequelize)
app.post('/deleteItem', async (req, res) => {
    try {
        const { id } = req.query;
        
        // Проверка валидности id
        if (!id || isNaN(Number(id))) {
            res.json(null);
            return;
        }

        // Находим запись
        const item = await Item.findByPk(Number(id));
        
        if (!item) {
            res.json({}); // Пустой объект, если не найден
            return;
        }

        // Сохраняем данные перед удалением
        const deletedItem = item.toJSON();
        
        // Удаляем
        await item.destroy();
        
        res.json(deletedItem);
    } catch (error) {
        console.error('Ошибка deleteItem:', error);
        res.json(null);
    }
});

// 4d. POST - updateItem (через Sequelize)
app.post('/updateItem', async (req, res) => {
    try {


const { id, name, desc } = req.query;
        
        // Проверка валидности параметров
        if (!id || isNaN(Number(id)) || !name || !desc || 
            name.trim() === '' || desc.trim() === '') {
            res.json(null);
            return;
        }

        // Находим запись
        const item = await Item.findByPk(Number(id));
        
        if (!item) {
            res.json({}); // Пустой объект, если не найден
            return;
        }

        // Обновляем поля
        item.name = name.trim();
        item.desc = desc.trim();
        await item.save();

        res.json(item.toJSON());
    } catch (error) {
        console.error('Ошибка updateItem:', error);
        res.json(null);
    }
});

// ===== ДОПОЛНИТЕЛЬНЫЙ РОУТ (демонстрация прямого использования mysql2) =====
// Показывает, как можно использовать mysql2 напрямую даже с Sequelize
app.get('/raw-query', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Items');
        res.json(rows);
    } catch (error) {
        console.error('Ошибка raw-query:', error);
        res.json(null);
    }
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log('📦 Используются: Sequelize + mysql2');
});