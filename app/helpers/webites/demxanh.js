import { convert2csv } from "../../utils/json2csv.js";

export const demxanh = {
  url: "https://demxanh.com",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
    sum: 0,
  },

  async scrape(browser) {
    try {
      let basePage = await browser.newPage();
      console.log(`-> Navigate to ${this.url}`);

      await basePage.goto(this.url);
      console.log("ok");
      await basePage.waitForSelector(".container");

      let payload = await basePage.$$eval(".cat-item", (categories) => {
        categories = categories.map((category) => {
          let element = category.querySelector("a");
          let schema = {
            title: null,
            url: null,
            products: [],
          };

          return {
            ...schema,
            title: element.textContent.trim(),
            url: element.href,
          };
        });
        console.log(categories);
        return categories;
      });

      if (payload) this.categories.push(...this.categories, ...payload);
      console.table(this.categories);
    } catch (error) {}
  },
};
