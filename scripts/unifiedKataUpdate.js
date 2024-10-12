const {
  initializeDatabase,
  insertKata,
  countUnsolvedKatas,
} = require("../src/database");
const { getKataDetails } = require("../src/apiService");
const { fetchNewKataIds } = require("../src/puppeteerScraper");
const { sendProgressionNotification } = require("../src/notificationService");
const config = require("../src/config");

async function unifiedKataUpdate() {
  try {
    await initializeDatabase();

    const unsolvedCount = await countUnsolvedKatas(config.currentKyu);
    console.log(
      `Current unsolved katas for kyu ${config.currentKyu}: ${unsolvedCount}`,
    );

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
    }

    if (unsolvedCount < config.MIN_UNSOLVED_KATAS) {
      console.log(`Fetching new katas for kyu ${config.currentKyu}...`);
      const newKataIds = await fetchNewKataIds(
        config.currentKyu,
        config.tagPreferences,
        config.preferredLanguage,
      );

      console.log(`Fetched ${newKataIds.length} new kata IDs`);

      for (const id of newKataIds) {
        const kataDetails = await getKataDetails(id);
        if (kataDetails) {
          await insertKata({
            id: kataDetails.id,
            name: kataDetails.name,
            rank: kataDetails.rank.id,
            tags: kataDetails.tags,
            languages: kataDetails.languages,
          });
          console.log(`Inserted kata: ${kataDetails.name}`);
        }
      }
    } else {
      console.log(
        "Sufficient unsolved katas available. No need to fetch new ones.",
      );
    }

    console.log("Kata update process completed successfully");
  } catch (error) {
    console.error("Error in unified kata update process:", error);
  }
}

unifiedKataUpdate();
