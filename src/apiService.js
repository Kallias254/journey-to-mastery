const axios = require("axios");
const config = require("./config");

const API_BASE_URL = "https://www.codewars.com/api/v1";

async function getKataDetails(kataId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/code-challenges/${kataId}`,
    );
    const kataData = response.data;

    // Include language in the returned data
    return {
      ...kataData,
      language: config.preferredLanguage, // Assuming the kata supports the preferred language
    };
  } catch (error) {
    console.error(`Error fetching kata details for ${kataId}:`, error.message);
    return null;
  }
}

async function getCompletedKatas(page = 0) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${config.codewarsUsername}/code-challenges/completed?page=${page}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching completed katas:", error.message);
    return null;
  }
}

module.exports = {
  getKataDetails,
  getCompletedKatas,
};
