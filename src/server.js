const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Initialize SQLite database
const db = new sqlite3.Database('todo.db');

db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'", (err, row) => {
    if (!row) {
      db.run("CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, body TEXT, isComplete BOOLEAN)");
    }
  });
});

// Routes
app.get('/todos', (req, res) => {
  db.all("SELECT * FROM todos", [], (err, rows) => {
    if (err) {
      console.error('Error fetching todos:', err);
      res.status(500).json({ error: 'Error fetching todos' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/todos', (req, res) => {
  const { title, body } = req.body;
  console.log('Creating todo with title:', title);

  const stmt = db.prepare("INSERT INTO todos (title, body, isComplete) VALUES (?, ?, ?)");
  stmt.run(title, body, false, function(err) {
    if (err) {
      console.error('Error inserting todo:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, title, body, isComplete: false });
  });
  stmt.finalize();
});

app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, body, isComplete } = req.body;

  // Log data yang diterima
  console.log('Updating todo with ID:', id);
  console.log('New data:', { title, body, isComplete });

  // Konversi boolean ke integer untuk SQLite
  const isCompleteValue = isComplete ? 1 : 0;

  const stmt = db.prepare("UPDATE todos SET title = ?, body = ?, isComplete = ? WHERE id = ?");
  stmt.run(title, body, isCompleteValue, id, function(err) {
      if (err) {
          console.error('Error updating todo:', err);
          return res.status(500).json({ error: err.message });
      }

      // Setelah pembaruan, ambil data todo yang diperbarui dari database
      db.get("SELECT * FROM todos WHERE id = ?", [id], (err, row) => {
          if (err) {
              console.error('Error fetching updated todo:', err);
              return res.status(500).json({ error: err.message });
          }
          // Konversi nilai kembali ke boolean
          row.isComplete = row.isComplete === 1;

          // Log data yang dikirim kembali ke frontend
          console.log('Updated todo:', row);

          res.json(row);
      });
  });
  stmt.finalize();
});



app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;
  console.log('Deleting todo with ID:', id);

  const stmt = db.prepare("DELETE FROM todos WHERE id = ?");
  stmt.run(id, function(err) {
    if (err) {
      console.error('Error deleting todo:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(204).end();
  });
  stmt.finalize();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
