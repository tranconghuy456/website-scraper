import { multiPage } from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await multiPage.scrape(browser);
  } catch (error) {
    throw error;
  }
};
