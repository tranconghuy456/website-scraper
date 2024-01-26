import { app } from "../configs/app.config.js";

const multiPage = {
  baseUrl: "https://www.demxanh.com",
  categories: [],

  async scrape(browser) {
    // Category fetching
    let page = await browser.newPage();
    console.log(`Navigating to ${this.baseUrl}`);
    // navigate to url
    await page.goto(this.baseUrl);
    // wait for the required DOM to be rendered
    await page.waitForSelector(".cat-menu-group");
    // get all categories info
    var payload = await page.$$eval(".cat-item", (categories) => {
      categories = categories.map((category) => {
        return {
          title: category.querySelector("a").textContent,
          url: category.querySelector("a").href,
          products: [],
        };
      });
      return categories;
    });
    this.categories.push(...this.categories, payload);

    // products
    let categoryPromise = (index, categoryLink) =>
      new Promise(async (resolve, reject) => {
        let categoryPage = await browser.newPage();
        await categoryPage.goto(categoryLink);
        await categoryPage.waitForSelector(".p-container");

        var payload = await categoryPage.$$eval(".p-item", (products) => {
          products = products.map((product) => {
            return {
              url: product.querySelector(".p-img").href,
            };
          });
          return products;
        });
        if (
          this.categories[0][index] &&
          this.categories[0][index].hasOwnProperty("products")
        ) {
          this.categories[0][index].products.push(payload);
          resolve(this.categories[0][index].products);
        } else {
          resolve(null);
        }
      });

    let productPromise = (index, jdex, productLink) =>
      new Promise(async (resolve, reject) => {
        let productPage = await browser.newPage();

        await productPage.goto(productLink);
        await productPage.waitForSelector(".product-detail-group");

        var payload = {
          title: await productPage.$eval(
            ".blog-middle h1",
            (val) => val.textContent
          ),

          regular_price: (async () => {
            await productPage.$$eval(".config-group-holder a", (buttons) => {
              for (var button of buttons) {
                button.click();
                return "clicked";
              }
              return buttons;
            });
          })(),
        };

        this.categories[0][index][jdex] = {
          ...this.categories[0][index][jdex],
          ...payload,
        };
        resolve(this.categories[0][index][jdex]);
      });

    // console.log(this.categories[0][1]);
    for (var [index, category] of this.categories[0].entries()) {
      //   console.log(index, category.url);
      let categoryCurrentData = await categoryPromise(index, category.url);
      //   console.log(categoryCurrentData);
      console.log(categoryCurrentData[0]);
      for (var [jdex, product] of categoryCurrentData[0].entries()) {
        let productCurrentData = await productPromise(index, jdex, product.url);
        console.log(index, jdex, productCurrentData);
      }
    }
  },
};

export { multiPage };
