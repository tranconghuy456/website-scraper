import * as puppeteer from "puppeteer";

const initBrowser = async () => {
  let browser;

  try {
    console.log("Opening the browser ...");

    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
  } catch (error) {
    throw error;
  }
  return browser;
};

export { initBrowser };
