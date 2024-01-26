import { initBrowser } from "./app/helpers/browser.js";
import scraperController from "./app/controllers/page.controller.js";

let browserInstance = initBrowser();
scraperController(browserInstance);
