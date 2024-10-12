const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { normalizeTag } = require("./tagUtils");
const axios = require("axios");
const db = new sqlite3.Database(path.join(__dirname, "../data/katas.db"));

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS katas (
      id TEXT PRIMARY KEY,
      name TEXT,
      rank INTEGER,
      tags TEXT,
      languages TEXT,
      solved BOOLEAN DEFAULT 0,
      satisfactionRating TEXT,
      completions INTEGER
    )`,
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

function insertKata(kata) {
  return new Promise((resolve, reject) => {
    const { id, name, rank, tags, languages, satisfactionRating, completions } =
      kata;
    const normalizedTags = tags.map(normalizeTag);
    db.run(
      `INSERT OR REPLACE INTO katas (id, name, rank, tags, normalized_tags, languages, solved, satisfactionRating, completions)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        name,
        rank,
        JSON.stringify(tags),
        JSON.stringify(normalizedTags),
        JSON.stringify(languages),
        satisfactionRating,
        completions,
      ],
      (err) => {
        if (err) {
          console.error(`Error inserting kata ${id}:`, err);
          reject(err);
        } else {
          console.log(`Successfully inserted/updated kata: ${name}`);
          resolve();
        }
      },
    );
  });
}

// Update the getRandomKatas function to use normalized tags for filtering
function getRandomKatas(count, rank, tagPreferences, language) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM katas WHERE rank = ? AND solved = 0 AND languages LIKE ?`;
    const params = [rank, `%${language}%`];

    if (tagPreferences.length > 0) {
      const normalizedTagPreferences = tagPreferences.map(normalizeTag);
      const tagConditions = normalizedTagPreferences
        .map(() => `normalized_tags LIKE ?`)
        .join(" OR ");
      query += ` AND (${tagConditions})`;
      params.push(...normalizedTagPreferences.map((tag) => `%${tag}%`));
    }

    query += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(count);

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else
        resolve(
          rows.map((row) => ({
            ...row,
            tags: JSON.parse(row.tags),
            languages: JSON.parse(row.languages),
          })),
        );
    });
  });
}

function markKataAsSolved(kataId) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE katas SET solved = 1 WHERE id = ?", [kataId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function updateKataDatabase(kataIds) {
  for (const id of kataIds) {
    try {
      const response = await axios.get(
        `https://www.codewars.com/api/v1/code-challenges/${id}`,
      );
      await insertKata(response.data);
    } catch (error) {
      console.error(`Error fetching kata ${id}:`, error.message);
    }
  }
}

async function checkCompletedKatas(username) {
  try {
    const response = await axios.get(
      `https://www.codewars.com/api/v1/users/${username}/code-challenges/completed`,
    );
    const completedKatas = response.data.data;

    for (const kata of completedKatas) {
      await markKataAsSolved(kata.id);
    }

    console.log(`Updated ${completedKatas.length} completed katas.`);
  } catch (error) {
    console.error("Error checking completed katas:", error.message);
  }
}

function countUnsolvedKatas(kyu) {
  return new Promise((resolve, reject) => {
    const query =
      "SELECT COUNT(*) as count FROM katas WHERE rank = ? AND solved = 0";
    db.get(query, [kyu], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

async function checkKyuProgress(currentKyu) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as total, SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solved
       FROM katas WHERE rank = ?`,
      [currentKyu],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          const progressPercentage = (row.solved / row.total) * 100;
          resolve({
            kyu: currentKyu,
            totalKatas: row.total,
            solvedKatas: row.solved,
            progressPercentage: progressPercentage,
          });
        }
      },
    );
  });
}

module.exports = {
  initializeDatabase,
  insertKata,
  getRandomKatas,
  markKataAsSolved,
  updateKataDatabase,
  checkCompletedKatas,
  countUnsolvedKatas,
  checkKyuProgress,
};
