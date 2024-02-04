import { app } from "../configs/app.config.js";
import { convert2csv } from "../utils/json2csv.js";

const uannga = {
  baseUrl: "https://uannga.vn/index.php/shops/san-pham-elan/",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      let page = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl} ...`);

      await page.goto(this.baseUrl);
      await page.waitForSelector(".container");

      var payload = await page.$$eval(".viewcat #xemthem", (categories) => {
        categories = categories.map((category) => {
          return {
            title: category.querySelector("a")?.getAttribute("title").trim(),
            url: category.querySelector("a")?.href,
            products: [],
          };
        });
        return categories;
      });
      this.categories.push(...this.categories, ...payload);

      // ---- CATEGORY PROMISE ---- //
      let categoryPromise = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t+ Navigationg to ${categoryLink}`);

          let categoryPage = await browser.newPage();
          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".container");

          var payload = await categoryPage.$$eval(
            "#category div.col-xs-12",
            async (products) => {
              products = products.map(
                (product) => product.querySelector(".left-block a")?.href
              );

              var nexPage = [
                ...document.querySelectorAll(
                  ".pagination li:not(.active):not(.disabled)"
                ),
              ]
                .slice(0, -1)
                .map((next) => next.querySelector("a[rel='next']")?.href);

              return [products, [...nexPage]];
            }
          );
          this.categories[index] = {
            ...this.categories[index],
            productURLs: payload[0],
            nextPage: payload[1],
          };
          resolve(this.categories[index].productURLs);
        });

      // ---- END CATEGORY PROMISE ---- //

      // ---- PRODUCT PROMISE ---- //
      let productPromise = (index, jdex, productURL) =>
        new Promise(async (resolve, reject) => {
          // console.log(`\t+ Navigating to ${productURL} ...`);
          let productPage = await browser.newPage();
          await productPage.goto(productURL, {
            waitUntil: "load",
            timeout: 60000,
          });
          await productPage.waitForSelector("body");

          console.log(`\t+ Building data ...`);
          var products = await productPage.$$eval(
            "body",
            async (productPage) => {
              var id = Math.random().toString(36).substring(8);

              var payload = [];
              var elements = {
                sku: document.querySelector(".product_info li > strong"),
                name: document.querySelector(".product_info li > h2"),
                description: document.querySelector("#content_detail-1"),
                breadcrumb: document.querySelectorAll(".breadcrumbs-wrap li"),
                regular_price: document.querySelector(
                  ".product_info li .money"
                ),
                images: document.querySelectorAll("#image-gallery li"),
              };
              var updateObject = {
                id,
                sku:
                  "#" +
                    elements.sku?.textContent
                      ?.replace(/\s/g, "")
                      .trim()
                      .replace(/\s/g, "") || "#PRODUCT",
                name: elements.name?.textContent.trim(),
                description: elements.description?.innerHTML,
                breadcrumb: [...elements.breadcrumb]
                  .map((el) => el?.textContent)
                  ?.slice(1)

                  .toString()
                  .replaceAll(",", ">")
                  .trim(),
                images: [...elements.images]
                  .map((imgs) =>
                    imgs.querySelector("a")?.getAttribute("data-src")
                  )
                  .toString()
                  .trim(),
              };
              var configs = document.querySelectorAll(".dropdown-menu");
              if (configs.length == 1) {
                var currentAttr =
                  configs[0].querySelectorAll(".dropdown-menu li");

                for (var x = 0; x < currentAttr.length; x++) {
                  currentAttr[x].querySelector("a").click();
                  updateObject = {
                    ...updateObject,
                    [`attribute_${0}_value`]: currentAttr[x]
                      .querySelector("a")
                      .textContent.trim(),
                    [`attribute_${0}_name`]: "Kích thước",
                  };
                  payload.push({
                    ...updateObject,
                    regular_price: elements.regular_price?.textContent.trim(),
                  });
                }
              }
              return payload;
            },
            productPage
          );
          this.categories[index] = {
            ...this.categories[index],
            products: [...this.categories[index].products, ...products],
          };
          productPage.close();
          this.totals.products++;
          resolve(this.categories[index].products);
        });
      // ---- END PRODUCT PROMISE ---- //

      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await categoryPromise(index, category.url);

        if (categoryCurrentData.length > 0) {
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            let productCurrentData = await productPromise(
              index,
              jdex + ydex,
              productUrl
            );
          }
          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await categoryPromise(index, nextPageUrl);

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                let productCurrentData = await productPromise(
                  index,
                  jdex + ydex,
                  productUrl
                );
              }
            }
          }

          if (this.categories[index].products.length > 0) {
            console.log("\t+ Converting to CSV ...");
            await convert2csv({
              filename: this.categories[index].title,
              data: this.categories[index].products,
            }).then(() => {
              console.log("\t+ Converted to CSV successfully");
              return;
            });
          }
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

export { uannga };
