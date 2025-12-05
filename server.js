const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database('./menu.db');

app.use(express.json());
app.use(express.static(__dirname));

// Инициализация базы данных
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ru TEXT, name_en TEXT, image TEXT, sort INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name_ru TEXT, name_en TEXT,
        description_ru TEXT, description_en TEXT,
        price REAL, image TEXT, sort INTEGER DEFAULT 0
    )`);
});

// === API ДЛЯ МЕНЮ (Чтение) ===

// Получить все категории
app.get('/api/categories', (req, res) => {
    db.all("SELECT * FROM categories ORDER BY sort ASC, id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// Получить товары конкретной категории
app.get('/api/items', (req, res) => {
    const catId = req.query.category_id;
    if (!catId) return res.json([]);
    db.all("SELECT * FROM items WHERE category_id = ? ORDER BY sort ASC, id DESC", [catId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// === API ДЛЯ АДМИНКИ (Запись/Удаление) ===

// Добавить категорию
app.post('/api/admin/categories', (req, res) => {
    const {name_ru, name_en, image} = req.body;
    db.run(`INSERT INTO categories (name_ru, name_en, image) VALUES (?, ?, ?)`,
        [name_ru, name_en, image],
        function(err) {
            if (err) return res.status(500).json({error: err.message});
            res.json({id: this.lastID, success: true});
        }
    );
});

// Удалить категорию (и товары в ней)
app.delete('/api/admin/categories/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM items WHERE category_id = ?", [id]);
    db.run("DELETE FROM categories WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// Добавить товар
app.post('/api/admin/items', (req, res) => {
    const {category_id, name_ru, name_en, description_ru, description_en, price, image} = req.body;
    db.run(`INSERT INTO items (category_id, name_ru, name_en, description_ru, description_en, price, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [category_id, name_ru, name_en, description_ru, description_en, price, image],
        function(err) {
            if (err) return res.status(500).json({error: err.message});
            res.json({success: true});
        }
    );
});

// Удалить товар
app.delete('/api/admin/items/:id', (req, res) => {
    db.run("DELETE FROM items WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('Admin panel: http://localhost:3000/admin.html');
});