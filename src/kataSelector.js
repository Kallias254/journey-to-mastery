const config = require("./config");
const { getRandomKatas } = require("./database");

async function selectKataForDay() {
  const katas = await getRandomKatas(
    config.katasPerDay * 2, // Get more katas than needed to allow for filtering
    config.currentKyu,
    config.tagPreferences,
    config.preferredLanguage,
  );

  // Sort katas by satisfaction rating and completion count
  const sortedKatas = katas.sort((a, b) => {
    const aSatisfaction = parseFloat(a.satisfactionRating.split("%")[0]);
    const bSatisfaction = parseFloat(b.satisfactionRating.split("%")[0]);
    const aCompletions = parseInt(a.completions);
    const bCompletions = parseInt(b.completions);

    // Prioritize satisfaction rating, then completion count
    if (aSatisfaction !== bSatisfaction) {
      return bSatisfaction - aSatisfaction;
    }
    return bCompletions - aCompletions;
  });

  // Return the top katasPerDay katas
  return sortedKatas.slice(0, config.katasPerDay);
}

module.exports = {
  selectKataForDay,
};
