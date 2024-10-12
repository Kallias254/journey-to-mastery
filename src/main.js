const {
  initializeDatabase,
  getRandomKatas,
  checkCompletedKatas,
  updateKataDatabase,
  countUnsolvedKatas,
  checkKyuProgress,
} = require("./database");
const { getKataDetails, getCompletedKatas } = require("./apiService");
const {
  sendTelegramNotification,
  sendEmailNotification,
  sendProgressionNotification,
} = require("./notificationService");
const { updateGithubRepo } = require("./githubService");
const { fetchNewKataIds } = require("./puppeteerScraper");
const config = require("./config");

async function main() {
  try {
    await initializeDatabase();

    // Check and update completed katas
    await checkCompletedKatas(config.codewarsUsername);
    const completedKatas = await getCompletedKatas();

    if (completedKatas && completedKatas.length > 0) {
      await updateGithubRepo(completedKatas);
      console.log("Updated GitHub with completed katas");
    } else {
      await sendTelegramNotification("No katas completed today. Keep pushing!");
    }

    // Check progress
    const progress = await checkKyuProgress(config.currentKyu);
    if (progress.progressPercentage > 80) {
      await sendTelegramNotification(
        `Great progress! You've solved ${progress.solvedKatas} out of ${progress.totalKatas} katas in kyu ${progress.kyu}. Consider moving to the next kyu level!`,
      );
    }

    // Check unsolved kata count
    const unsolvedCount = await countUnsolvedKatas(config.currentKyu);

    if (unsolvedCount === 0) {
      if (config.currentKyu > 1) {
        const newKyu = config.currentKyu - 1;
        await sendProgressionNotification(
          `Great job! You've completed all kyu ${config.currentKyu} katas. Consider moving to kyu ${newKyu}. Update your preferences in the config file to progress.`,
        );
      } else {
        await sendProgressionNotification(
          "Congratulations! You've mastered kyu 1 katas. Consider revisiting challenging katas or exploring kata creation on Codewars.",
        );
      }
    } else if (unsolvedCount < config.MIN_UNSOLVED_KATAS) {
      console.log(
        `Less than ${config.MIN_UNSOLVED_KATAS} unsolved katas. Fetching new ones...`,
      );
      const kyuLevels = [
        config.currentKyu,
        Math.min(8, config.currentKyu + 1),
        Math.max(1, config.currentKyu - 1),
      ];
      const newKataInfo = await fetchNewKataIds(
        kyuLevels,
        config.tagPreferences || [],
        config.preferredLanguage,
      );
      if (newKataInfo.length > 0) {
        for (const kataInfo of newKataInfo) {
          const fullKataDetails = await getKataDetails(kataInfo.id);
          if (fullKataDetails) {
            await updateKataDatabase({
              ...fullKataDetails,
              satisfactionRating: kataInfo.satisfactionRating,
              completions: kataInfo.completions,
            });
          }
        }
        console.log(`Added ${newKataInfo.length} new katas to the database.`);
      } else {
        console.log(
          "No new katas found. Consider adjusting your preferences or kyu level.",
        );
      }
    }

    // Select and notify about upcoming katas
    let selectedKatas = await getRandomKatas(
      config.katasPerDay,
      config.currentKyu,
      config.tagPreferences || [],
      config.preferredLanguage,
    );

    if (selectedKatas.length > 0) {
      const kataDetails = await Promise.all(
        selectedKatas.map((kata) => getKataDetails(kata.id)),
      );
      const telegramMessage = formatTelegramMessage(kataDetails);
      const emailContent = formatEmailContent(kataDetails);
      await sendTelegramNotification(telegramMessage);
      await sendEmailNotification("Your Daily Codewars Katas", emailContent);
    } else {
      await sendTelegramNotification(
        "No new katas available today. Great job on your progress!",
      );
    }

    console.log("Daily operations completed successfully");
  } catch (error) {
    console.error("Error in main operation:", error);
    await sendTelegramNotification(
      "An error occurred during daily kata selection. Please check the logs.",
    );
  }
}

function formatTelegramMessage(katas) {
  return `Today's Codewars Katas:\n\n${katas
    .map(
      (kata) =>
        `- ${kata.name} (${kata.rank.name})\n  Tags: ${kata.tags.join(", ")}\n  Satisfaction: ${kata.satisfactionRating}\n  Completions: ${kata.completions}`,
    )
    .join("\n\n")}`;
}

function formatEmailContent(katas) {
  return `
    <h1>Your Daily Codewars Katas</h1>
    ${katas
      .map(
        (kata) => `
      <h2>${kata.name} (${kata.rank.name})</h2>
      <p>Tags: ${kata.tags.join(", ")}</p>
      <p>Satisfaction Rating: ${kata.satisfactionRating}</p>
      <p>Total Completions: ${kata.completions}</p>
      <p>${kata.description}</p>
      <a href="${kata.url}">Solve on Codewars</a>
    `,
      )
      .join("<hr>")}
  `;
}

main();
