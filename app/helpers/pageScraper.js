import { app } from "../configs/app.config.js";

const multiPage = {
  baseUrl: "https://www.demxanh.com",
  categories: [],

  async scrape(browser) {
    // Category fetching
    let page = await browser.newPage();
    console.log(`-> Navigating to ${this.baseUrl} ...`);
    // navigate to url
    await page.goto(this.baseUrl, { waitUntil: "load", timeout: 60000 });
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
          categoryPage.close();
          resolve(this.categories[0][index].products);
        } else {
          categoryPage.close();
          resolve(null);
        }
      });

    let productPromise = (index, jdex, productLink) =>
      new Promise(async (resolve, reject) => {
        console.log(`+ Navigating to ${productLink} ...`);
        let productPage = await browser.newPage();
        await productPage.goto(productLink, {
          waitUntil: "load",
          timeout: 60000,
        });
        await productPage.waitForSelector(".product-detail-group");

        console.log(`\t + Building data ...`);
        var products = await productPage.$$eval(
          ".pd-config-container",
          (container) => {
            var id = Math.random().toString(36).substring(8);
            var payload = [];

            var updateObject = {
              id,
              sku: `#${
                document.querySelector(".blog-middle div.text-12 a")
                  ? document
                      .querySelector(".blog-middle div.text-12 a")
                      .textContent.trim()
                  : "PRODUCT"
              }`,
              name: document
                .querySelector(".blog-middle h1")
                .textContent.trim(),
              description: document.querySelector(
                ".product-info-group .pro-desc-group"
              ).innerHTML,
              short_description: "Không có mô tả ngắn cho sản phẩm này.",
              breadcrumb: [
                ...document.querySelectorAll(".global-breadcrumb ol a"),
              ]
                .map((text) => {
                  return text.textContent.trim();
                })
                .toString(),
              images: [
                ...document.querySelectorAll(
                  ".product-detail-group a[data-fancybox='gallery'"
                ),
              ]
                .map((img) => {
                  return img.href;
                })
                .toString(),
            };
            var configs = document.querySelectorAll(".pd-config-group");

            if (configs.length == 1) {
              var currentAttr = configs[0].querySelectorAll(
                ".config-group-holder a"
              );

              for (var x = 0; x < currentAttr.length; x++) {
                currentAttr[x].click();
                updateObject = {
                  ...updateObject,
                  [`attribute_${0}_value`]: currentAttr[x].textContent.trim(),
                  [`attribute_${0}_name`]: configs[0]
                    .querySelector("p.group-title")
                    .textContent.trim(),
                };
                payload.push({
                  regular_price: document
                    .querySelector(".pd-price-container b")
                    .textContent.trim(),
                  ...updateObject,
                });
              }
            } else if (configs.length > 1) {
              for (var i = 0; i < configs.length - 1; i++) {
                var currentAttr = configs[i].querySelectorAll(
                  ".config-group-holder a"
                );

                for (var x = 0; x < currentAttr.length; x++) {
                  currentAttr[x].click();
                  updateObject = {
                    ...updateObject,
                    [`attribute_${i}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${i}_name`]: configs[i]
                      .querySelector("p.group-title")
                      .textContent.trim(),
                  };

                  if (configs.length > 1 && i + 1 < configs.length) {
                    var nextAttr = configs[i + 1].querySelectorAll(
                      ".config-group-holder a"
                    );
                    for (var y = 0; y < nextAttr.length; y++) {
                      nextAttr[y].click();
                      updateObject = {
                        ...updateObject,
                        [`attribute_${i + 1}_value`]:
                          nextAttr[y].textContent.trim(),
                        [`attribute_${i + 1}_name`]: configs[i + 1]
                          .querySelector("p.group-title")
                          .textContent.trim(),
                      };
                    }
                  }
                }
                payload.push({
                  regular_price: document
                    .querySelector(".pd-price-container b")
                    .textContent.trim(),
                  ...updateObject,
                });
              }
            }
            return payload;
          }
        );
        console.log(products);

        productPage.close();
        resolve(this.categories[0][index][jdex]);
      });

    // console.log(this.categories[0][1]);
    for (var [index, category] of this.categories[0].entries()) {
      //   console.log(index, category.url);
      // let categoryCurrentData = await categoryPromise(index, category.url);
      let categoryCurrentData = await categoryPromise(
        index,
        this.categories[0][index].url
      );
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
