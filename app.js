const { error } = require("console");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
const sqlite3 = require("sqlite3").verbose();

/* SQLite Setup*/
const dbPath = path.join(__dirname, "name-api-database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Failed to connect to database. " + err.message);
    process.exit(1);
  }
  console.log("Connected to SQLite database at " + dbPath);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS name_combinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name1 TEXT NOT NULL,
      name2 TEXT NOT NULL,
      names TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
});

app.get("/api/names", (req, res) => {
  //retrive all the names from the names_combinations table
  db.all(
    "SELECT * FROM name_combinations ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message }) 
        return;
    }

      //Send them back as a json array
      res.json(rows);
    }
  );
});

app.post("/api/names", (req, res) => {
    // extract the data from the req
    const name1 = "john"
    const name2 = "bob"
    const names = "['johnbob', 'bobjohn' ,'bohn']"
    // insert the new row into the database
    db.run(`INSERT INTO name_combinations (name1, name2, names) VALUES (?, ?, ?)`,
        [name1, name2, names],
        (err) => {
            if (err) res.status(500).json( {error: err.message})
        }
    )
})

app.get("/api/combine", (req, res) => {
  var result = {
    name1: "",
    name2: "",
    results: [],
  };

  //extract the query string params
  const name1 = req.query.name1;
  const name2 = req.query.name2;

  result.name1 = name1;
  result.name2 = name2;

  // compute combinations
  let suggestion1 = "";
  for (let i = 0; i < Math.floor(name1.length / 2); i++) {
    suggestion1 += name1[i];
  }
  for (let i = Math.floor(name2.length / 2); i < name2.length; i++) {
    suggestion1 += name2[i];
  }
  console.log(suggestion1);

  let suggestion2 = "";
  for (let i = 0; i < Math.floor(name2.length / 2); i++) {
    suggestion2 += name2[i];
  }
  for (let i = Math.floor(name1.length / 2); i < name1.length; i++) {
    suggestion2 += name1[i];
  }
  console.log(suggestion2);

  let suggestion3 = "";
  for (let i = 0; i < name1.length; i++) {
    if (
      name1[i] == "a" ||
      name1[i] == "e" ||
      name1[i] == "i" ||
      name1[i] == "o" ||
      name1[i] == "u"
    ) {
      suggestion3 += name2[i + 1] + name1[i];
    } else if (
      name2[i] == "A" ||
      name2[i] == "E" ||
      name2[i] == "I" ||
      name2[i] == "O" ||
      name2[i] == "U"
    ) {
      suggestion3 += name1[i + 1] + name2[i];
    } else {
      if (i >= 1) suggestion3 += name1[i - 1] + name2[i];
      else suggestion3 += name1[i] + name2[i + 1];
    }
  }
  console.log(suggestion3);

  let suggestion4 = "";
  name2index = 0;
  let i = name1.length - 1;
  if (name2index <= i) {
    for (i >= 0; i--; ) {
      suggestion4 += name1[i] + name2[name2index];
      name2index++;
    }
  } else {
    for (name2index >= name2.length; name2index++; ) {
      suggestion4 += name1[i] + name2[name2index];
    }
  }
  console.log(suggestion4);

  // create array of results
  result.results.push({
    id: 1,
    name: suggestion1,
    goodness: Math.floor(Math.random() * 10),
  });
  result.results.push({
    id: 2,
    name: suggestion2,
    goodness: Math.floor(Math.random() * 10),
  });
  result.results.push({
    id: 3,
    name: suggestion3,
    goodness: Math.floor(Math.random() * 10),
  });
  result.results.push({
    id: 4,
    name: suggestion4,
    goodness: Math.floor(Math.random() * 10),
  });

  // write results to a file
  const filePath = path.join(__dirname, "/logs/output.log");
  fs.appendFile(filePath, `${Date()}: ${JSON.stringify(result)}\n`, (err) => {
    if (err) console.log(err);
  });

  // send back response with data
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
