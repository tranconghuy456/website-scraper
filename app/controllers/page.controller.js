import { demxanh, hoatuoi360 } from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await hoatuoi360.scrape(browser).then(() => console.log("All done!"));
  } catch (error) {
    throw error;
  }
};
