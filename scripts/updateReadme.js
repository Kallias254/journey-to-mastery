const fs = require("fs").promises;
const axios = require("axios");
const path = require("path");

async function getCodewarsStats(username) {
  const response = await axios.get(
    `https://www.codewars.com/api/v1/users/${username}`,
  );
  return response.data;
}

async function getRecentKatas(username) {
  const response = await axios.get(
    `https://www.codewars.com/api/v1/users/${username}/code-challenges/completed`,
  );
  return response.data.data.slice(0, 5); // Get the 5 most recent katas
}

async function updateReadme() {
  const username = process.env.CODEWARS_USERNAME; //TODO: Add to gh secrets
  const stats = await getCodewarsStats(username);
  const recentKatas = await getRecentKatas(username);

  const readmePath = path.join(__dirname, "..", "README.md");
  let readme = await fs.readFile(readmePath, "utf8");

  // Update stats
  readme = readme.replace(
    /Total Katas Completed: \d+/,
    `Total Katas Completed: ${stats.codeChallenges.totalCompleted}`,
  );
  readme = readme.replace(
    /Current Rank: .+/,
    `Current Rank: ${stats.ranks.overall.name}`,
  );
  readme = readme.replace(/Honor Points: \d+/, `Honor Points: ${stats.honor}`);

  // Update recent katas
  let recentKatasList = recentKatas
    .map(
      (kata) =>
        `- [${kata.name}](${kata.completedLanguages[0]}) - Completed on ${new Date(kata.completedAt).toLocaleDateString()}`,
    )
    .join("\n");

  readme = readme.replace(
    /1\. \[Dynamic List of Recent Katas\]/,
    recentKatasList,
  );

  await fs.writeFile(readmePath, readme);
}

updateReadme().catch(console.error);
