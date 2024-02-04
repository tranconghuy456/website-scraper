import {
  // demxanh,
  // hoatuoi360,
  // demxanh2,
  uannga,
} from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await uannga.scrape(browser).then(() => console.log("All done!"));
  } catch (error) {
    throw error;
  }
};
