import {
  demxanh,
  // hoatuoi360,
  // demxanh2,
  uannga,
  tham,
  rem,
  demxinh,
} from "../helpers/pageScraper.js";

export default async (browserInstance) => {
  let browser;

  try {
    browser = await browserInstance;
    await demxinh.scrape(browser).then(() => console.log("All done!"));
  } catch (error) {
    throw error;
  }
};
