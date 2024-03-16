import * as websites from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await websites["nemvivahome"]
      .scrape(browser)
      .then(() => console.log("All done!"));
  } catch (error) {
    throw error;
  }
};
