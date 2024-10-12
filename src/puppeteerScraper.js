const puppeteer = require("puppeteer");
const config = require("./config");

async function fetchNewKataIds(kyuLevels, tagPreferences, language) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to Codewars login page
    await page.goto("https://www.codewars.com/users/sign_in");

    // Click on the GitHub sign-in button
    await page.waitForSelector('button[data-action="auth#githubSignIn"]');
    await page.click('button[data-action="auth#githubSignIn"]');

    // Wait for GitHub login page and enter credentials
    await page.waitForSelector("#login_field");
    await page.type("#login_field", config.githubUsername);
    await page.type("#password", config.githubPassword);

    // Click the sign-in button
    await page.waitForSelector('input[type="submit"]');
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    let allKataInfo = [];

    for (const kyuLevel of kyuLevels) {
      // Navigate to kata search page with filters
      const tagQuery =
        tagPreferences && tagPreferences.length > 0
          ? `&tags=${tagPreferences.join(",")}`
          : "";
      const searchUrl = `https://www.codewars.com/kata/search/${language}?q=&r[]=-${kyuLevel}${tagQuery}&beta=false&order_by=sort_date%20desc`;
      await page.goto(searchUrl);

      // Scroll to load more katas (adjust the number of scrolls as needed)
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(2000); // Wait for 2 seconds after each scroll
      }

      // Extract kata information
      const kataInfo = await page.evaluate(() => {
        const kataItems = document.querySelectorAll(".list-item-kata");
        return Array.from(kataItems).map((item) => {
          const id = item.id;
          const satisfactionRating =
            item
              .querySelector(".icon-moon-guage")
              ?.nextSibling?.textContent.trim() || "N/A";
          const completions =
            item
              .querySelector(".icon-moon-bullseye")
              ?.nextSibling?.textContent.trim() || "0";
          return { id, satisfactionRating, completions, kyuLevel };
        });
      });

      allKataInfo = [...allKataInfo, ...kataInfo];
    }

    await browser.close();
    return allKataInfo;
  } catch (error) {
    console.error("Error in Puppeteer scraping:", error);
    await browser.close();
    return [];
  }
}

module.exports = { fetchNewKataIds };
