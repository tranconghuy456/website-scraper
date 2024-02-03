import { demxanh, hoatuoi360, demxanh2 } from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await demxanh2.scrape(browser).then(() => console.log("All done!"));
  } catch (error) {
    throw error;
  }
};
