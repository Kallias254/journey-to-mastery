const { Octokit } = require("@octokit/rest");
const config = require("./config");

const octokit = new Octokit({ auth: config.githubToken });

async function updateGithubRepo(newCompletedKatas) {
  try {
    // Fetch current completed katas file
    const { data: fileData } = await octokit.repos.getContent({
      owner: config.githubUsername,
      repo: config.githubRepo,
      path: "completed-katas.json",
    });

    // Parse existing data
    let completedKatas = JSON.parse(
      Buffer.from(fileData.content, "base64").toString(),
    );

    // Add new completed katas
    const updatedKatas = newCompletedKatas.map((kata) => ({
      id: kata.id,
      name: kata.name,
      rank: kata.rank.name,
      tags: kata.tags,
      languages: kata.languages, // Store all supported languages
      completedLanguage: config.preferredLanguage, // Language in which the kata was completed
      completedAt: new Date().toISOString(),
      url: kata.url,
    }));

    completedKatas = [...completedKatas, ...updatedKatas];

    // Update file in GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: config.githubUsername,
      repo: config.githubRepo,
      path: "completed-katas.json",
      message: `Completed ${newCompletedKatas.length} new kata${newCompletedKatas.length > 1 ? "s" : ""}: ${newCompletedKatas.map((k) => k.name).join(", ")}`,
      content: Buffer.from(JSON.stringify(completedKatas, null, 2)).toString(
        "base64",
      ),
      sha: fileData.sha,
    });

    console.log("GitHub repo updated with new completed katas");
  } catch (error) {
    console.error("Error updating GitHub repo:", error.message);
  }
}

module.exports = {
  updateGithubRepo,
};
