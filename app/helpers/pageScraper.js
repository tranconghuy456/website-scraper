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
      let base = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl}`);

      await base.goto(this.baseUrl);
      await base.waitForSelector(".container");

      var payload = await base.$$eval(".viewcat #xemthem", (categories) => {
        categories = categories.map((category) => {
          var categoryEl = category.querySelector("a");

          return {
            title: categoryEl
              ? categoryEl.getAttribute("title").trim()
              : "(Unknown)",
            url: categoryEl ? categoryEl.href : "(Unknown)",
            products: [],
          };
        });

        return categories;
      });
      payload && this.categories.push(...this.categories, ...payload);
      console.table(this.categories);

      // ---- getProductByCategory ---- //
      let getProductByCategory = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t- Getting product via Category ...`);

          let categoryPage = await browser.newPage();

          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".container");

          var payload = await categoryPage.$$eval(
            "#category div.col-xs-12",
            async (products) => {
              products = products
                .filter((product) => {
                  if (product) return product;
                })
                .map((product) => product.querySelector(".left-block a").href);

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
      // ---- END getProductByCategory ---- //

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
                breadcrumb: document.querySelectorAll(".breadcrumbs-wrap li"),
                regular_price: document.querySelector(
                  ".product_info li .money"
                ),
                images: document.querySelectorAll("#image-gallery li"),
              };
              var updateObject = {
                id,
                sku: elements.sku
                  ? elements.sku.textContent
                      .replace(/\s/g, "")
                      .trim()
                      .replace(/\s/g, "")
                  : "(Unknown)",
                name: elements.name
                  ? elements.name.textContent.trim()
                  : "(Unknown)",
                breadcrumb:
                  [...elements.breadcrumb]
                    .map((el) => el?.textContent)
                    ?.slice(1)
                    .toString()
                    .replaceAll(",", ">")
                    .trim() || "(Unknown)",
                images: [...elements.images]
                  .map(
                    (imgs) =>
                      `${this.webBase}/${imgs
                        .querySelector("a")
                        ?.getAttribute("data-src")}`
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
                    regular_price: elements.regular_price
                      ? elements.regular_price.textContent.trim()
                      : "Liên hệ",
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

      // LOOPING //
      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await getProductByCategory(
          index,
          category.url
        );

        if (categoryCurrentData.length > 0) {
          console.table(this.totals);
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            await productPromise(index, jdex + ydex, productUrl);
          }

          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await getProductByCategory(
                index,
                nextPageUrl
              );

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                await productPromise(index, jdex + ydex, productUrl);
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
          console.table(this.totals);
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

const demxanh = {
  baseUrl: "https://demxanh.com",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      let base = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl}`);

      await base.goto(this.baseUrl);
      await base.waitForSelector(".container");

      var payload = await base.$$eval(".cat-item", (categories) => {
        categories = categories.map((category) => {
          var categoryEl = category.querySelector("a");

          return {
            title: categoryEl ? categoryEl.textContent.trim() : "(Unknown)",
            url: categoryEl ? categoryEl.href : "(Unknown)",
            products: [],
          };
        });

        return categories;
      });
      payload && this.categories.push(...this.categories, ...payload);
      console.table(this.categories);

      // ---- getProductByCategory ---- //
      let getProductByCategory = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t- Getting product via Category ...`);

          let categoryPage = await browser.newPage();

          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".p-container");

          var payload = await categoryPage.$$eval(
            ".p-item",
            async (products) => {
              products = products
                .filter((product) => {
                  if (product) return product;
                })
                .map((product) => product.querySelector(".p-img").href);

              var nexPage = [
                ...document.querySelectorAll(".paging a:not(.current)"),
              ].map((next) => next?.href);

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
      // ---- END getProductByCategory ---- //

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
            ".product-detail-page",
            async (productPage) => {
              var id = Math.random().toString(36).substring(8);

              var payload = [];
              var elements = {
                sku: document.querySelector(".blog-middle div.text-12 a"),
                name: document.querySelector(".blog-middle > h1"),
                breadcrumb: document.querySelectorAll(".global-breadcrumb li"),
                regular_price: document.querySelector(
                  ".pd-price-container b.text-32"
                ),
                images: document.querySelectorAll(
                  ".product-detail-group a[data-fancybox='gallery']"
                ),
              };
              var updateObject = {
                id,
                sku: elements.sku
                  ? elements.sku.textContent
                      .replace(/\s/g, "")
                      .trim()
                      .replace(/\s/g, "")
                  : "(Unknown)",
                name: elements.name
                  ? elements.name.textContent.trim()
                  : "(Unknown)",
                breadcrumb:
                  [...elements.breadcrumb]
                    .map((el) => el?.textContent)
                    ?.slice(0, -1)
                    .toString()
                    .trim()
                    .replaceAll(",", ">") || "(Unknown)",
                images: [...elements.images]
                  .map((imgs) => imgs?.href)
                  .toString()
                  .trim(),
              };

              var configs = document.querySelectorAll(
                ".pd-config-container .pd-config-group"
              );

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
                    ...updateObject,
                    regular_price:
                      elements.regular_price &&
                      elements.regular_price.textContent.trim(),
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
                      [`attribute_${i}_value`]:
                        currentAttr[x].textContent.trim(),
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
                    regular_price:
                      elements.regular_price &&
                      elements.regular_price.textContent.trim(),
                    ...updateObject,
                  });
                }
              }
              return payload;
            },
            productPage
          );

          console.log(payload);

          this.categories[index] = {
            ...this.categories[index],
            products: [...this.categories[index].products, ...products],
          };
          productPage.close();
          this.totals.products++;
          resolve(this.categories[index].products);
        });
      // ---- END PRODUCT PROMISE ---- //

      // LOOPING //
      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await getProductByCategory(
          index,
          category.url
        );

        if (categoryCurrentData.length > 0) {
          console.table(this.totals);
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            await productPromise(index, jdex + ydex, productUrl);
          }

          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await getProductByCategory(
                index,
                nextPageUrl
              );

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                await productPromise(index, jdex + ydex, productUrl);
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
          console.table(this.totals);
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

const tham = {
  baseUrl: "https://jysk.vn/tham",
  categories: [
    {
      title: "Thảm",
      url: "https://jysk.vn/tham",
      products: [],
    },
  ],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      //   let base = await browser.newPage();
      //   console.log(`-> Navigating to ${this.baseUrl}`);

      //   await base.goto(this.baseUrl);
      //   await base.waitForSelector(".container");

      //   var payload = await base.$$eval(".product-list", (categories) => {
      //     categories = categories.map((category) => {
      //       var categoryEl = category.querySelector("a");

      //       return {
      //         title: categoryEl
      //           ? categoryEl.getAttribute("title").trim()
      //           : "(Unknown)",
      //         url: categoryEl ? categoryEl.href : "(Unknown)",
      //         products: [],
      //       };
      //     });

      //     return categories;
      //   });
      //   payload && this.categories.push(...this.categories, ...payload);
      //   console.table(this.categories);

      // ---- getProductByCategory ---- //
      let getProductByCategory = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t- Getting product via Category ...`);

          let categoryPage = await browser.newPage();

          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".container");

          var payload = await categoryPage.$$eval(
            ".product-list .w-100",
            async (products) => {
              products = products
                .filter((product) => {
                  if (product) return product;
                })
                .map(
                  (product) =>
                    product.querySelector(".product-item .product-img").href
                );

              var nexPage = [
                "https://jysk.vn/tham?pagenumber=2",
                "https://jysk.vn/tham?pagenumber=3",
                "https://jysk.vn/tham?pagenumber=4",
                "https://jysk.vn/tham?pagenumber=5",
              ];

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
      // ---- END getProductByCategory ---- //

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
                sku: document.querySelector(".product-detail-code"),
                name: document.querySelector(".product-detail-name"),
                breadcrumb: document.querySelectorAll(".breadcrumb li"),
                regular_price: document.querySelector(".price"),
                images: document.querySelectorAll(
                  ".swiper-wrapper .swiper-slide"
                ),
              };
              var updateObject = {
                id,
                sku: elements.sku
                  ? elements.sku.textContent
                      .replace(/\s/g, "")
                      .trim()
                      .replace(/\s/g, "")
                  : "(Unknown)",
                name: elements.name
                  ? elements.name.textContent.trim()
                  : "(Unknown)",
                breadcrumb:
                  [...elements.breadcrumb]
                    .map((el) => el?.textContent)
                    ?.slice(1)
                    .toString()
                    .replaceAll(",", ">")
                    .trim() || "(Unknown)",
                images: [...elements.images]
                  .map((imgs) => imgs.querySelector("a img")?.src)
                  .toString()
                  .trim(),
              };

              payload.push({
                ...updateObject,
                regular_price: elements.regular_price
                  ? elements.regular_price.textContent.trim()
                  : "Liên hệ",
              });

              //   var configs = document.querySelectorAll(".dropdown-menu");
              //   if (configs.length == 1) {
              //     var currentAttr =
              //       configs[0].querySelectorAll(".dropdown-menu li");

              //     for (var x = 0; x < currentAttr.length; x++) {
              //       currentAttr[x].querySelector("a").click();
              //       updateObject = {
              //         ...updateObject,
              //         [`attribute_${0}_value`]: currentAttr[x]
              //           .querySelector("a")
              //           .textContent.trim(),
              //         [`attribute_${0}_name`]: "Kích thước",
              //       };
              //       payload.push({
              //         ...updateObject,
              //         regular_price: elements.regular_price
              //           ? elements.regular_price.textContent.trim()
              //           : "Liên hệ",
              //       });
              //     }
              //   }
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

      // LOOPING //
      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await getProductByCategory(
          index,
          category.url
        );

        if (categoryCurrentData.length > 0) {
          console.table(this.totals);
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            await productPromise(index, jdex + ydex, productUrl);
          }

          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await getProductByCategory(
                index,
                nextPageUrl
              );

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                await productPromise(index, jdex + ydex, productUrl);
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
          console.table(this.totals);
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

const rem = {
  baseUrl: "https://noithatken.com/rem-cua-so/",
  categories: [
    {
      title: "Thảm",
      url: "https://noithatken.com/rem-cua-so/",
      products: [],
    },
  ],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      //   let base = await browser.newPage();
      //   console.log(`-> Navigating to ${this.baseUrl}`);

      //   await base.goto(this.baseUrl);
      //   await base.waitForSelector(".container");

      //   var payload = await base.$$eval(".product-list", (categories) => {
      //     categories = categories.map((category) => {
      //       var categoryEl = category.querySelector("a");

      //       return {
      //         title: categoryEl
      //           ? categoryEl.getAttribute("title").trim()
      //           : "(Unknown)",
      //         url: categoryEl ? categoryEl.href : "(Unknown)",
      //         products: [],
      //       };
      //     });

      //     return categories;
      //   });
      //   payload && this.categories.push(...this.categories, ...payload);
      //   console.table(this.categories);

      // ---- getProductByCategory ---- //
      let getProductByCategory = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t- Getting product via Category ...`);

          let categoryPage = await browser.newPage();

          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector("#main");

          var payload = await categoryPage.$$eval(
            ".products .product-small",
            async (products) => {
              products = products
                .filter((product) => {
                  if (product) return product;
                })
                .map((product) => product.querySelector(".image-none a").href);

              var nexPage = [];

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
      // ---- END getProductByCategory ---- //

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
                sku: document.querySelector(".ma-hang"),
                name: document.querySelector("h1.product-title"),
                breadcrumb: document.querySelector(".danh-muc a[rel='tag']"),
                regular_price: document.querySelector(
                  ".woocommerce-Price-amount bdi"
                ),
                images: document.querySelectorAll(
                  ".woocommerce-product-gallery__image"
                ),
              };
              var updateObject = {
                id,
                sku: elements.sku
                  ? elements.sku.textContent
                      .replace(/\s/g, "")
                      .trim()
                      .replace(/\s/g, "")
                  : "(Unknown)",
                name: elements.name
                  ? elements.name.textContent.trim()
                  : "(Unknown)",
                breadcrumb:
                  elements.breadcrumb.textContent.trim() || "(Unknown)",
                images: [...elements.images]
                  .map((imgs) => imgs.querySelector("a")?.href)
                  .toString()
                  .trim(),
              };

              payload.push({
                ...updateObject,
                regular_price: elements.regular_price
                  ? elements.regular_price.textContent.trim()
                  : "Liên hệ",
              });

              //   var configs = document.querySelectorAll(".dropdown-menu");
              //   if (configs.length == 1) {
              //     var currentAttr =
              //       configs[0].querySelectorAll(".dropdown-menu li");

              //     for (var x = 0; x < currentAttr.length; x++) {
              //       currentAttr[x].querySelector("a").click();
              //       updateObject = {
              //         ...updateObject,
              //         [`attribute_${0}_value`]: currentAttr[x]
              //           .querySelector("a")
              //           .textContent.trim(),
              //         [`attribute_${0}_name`]: "Kích thước",
              //       };
              //       payload.push({
              //         ...updateObject,
              //         regular_price: elements.regular_price
              //           ? elements.regular_price.textContent.trim()
              //           : "Liên hệ",
              //       });
              //     }
              //   }
              return payload;
            },
            productPage
          );
          this.categories[index] = {
            ...this.categories[index],
            products: [...this.categories[index].products, ...products],
          };
          console.log(this.categories[index]);
          productPage.close();
          this.totals.products++;
          resolve(this.categories[index].products);
        });
      // ---- END PRODUCT PROMISE ---- //

      // LOOPING //
      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await getProductByCategory(
          index,
          category.url
        );

        if (categoryCurrentData.length > 0) {
          console.table(this.totals);
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            await productPromise(index, jdex + ydex, productUrl);
          }

          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await getProductByCategory(
                index,
                nextPageUrl
              );

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                await productPromise(index, jdex + ydex, productUrl);
              }
            }
          }
          if (this.categories[index].products.length > 0) {
            console.log("\t+ Converting to CSV ...");
            await convert2csv({
              filename: "Rem",
              data: this.categories[index].products,
            }).then(() => {
              console.log("\t+ Converted to CSV successfully");
              return;
            });
          }
          console.table(this.totals);
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

const demxinh = {
  baseUrl: "https://demxinh.vn/chan-ga-goi-hanvico",
  categories: [
    {
      title: "Chăn Ga - Gối Hanvico",
      url: "https://demxinh.vn/chan-ga-goi-hanvico",
      products: [],
    },
  ],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      //   let base = await browser.newPage();
      //   console.log(`-> Navigating to ${this.baseUrl}`);

      //   await base.goto(this.baseUrl);
      //   await base.waitForSelector(".container");

      //   var payload = await base.$$eval(".product-list", (categories) => {
      //     categories = categories.map((category) => {
      //       var categoryEl = category.querySelector("a");

      //       return {
      //         title: categoryEl
      //           ? categoryEl.getAttribute("title").trim()
      //           : "(Unknown)",
      //         url: categoryEl ? categoryEl.href : "(Unknown)",
      //         products: [],
      //       };
      //     });

      //     return categories;
      //   });
      //   payload && this.categories.push(...this.categories, ...payload);
      //   console.table(this.categories);

      // ---- getProductByCategory ---- //
      let getProductByCategory = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t- Getting product via Category ...`);

          let categoryPage = await browser.newPage();

          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".container");

          var payload = await categoryPage.$$eval(
            "#load_products_page .col-md-4",
            async (products) => {
              products = products
                .filter((product) => {
                  if (product) return product;
                })
                .map((product) => product.querySelector("a").href);

              var nexPage = [
                // "https://jysk.vn/tham?pagenumber=2",
                // "https://jysk.vn/tham?pagenumber=3",
                // "https://jysk.vn/tham?pagenumber=4",
                // "https://jysk.vn/tham?pagenumber=5",
              ];

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
      // ---- END getProductByCategory ---- //

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
                // sku: document.querySelector(".product-detail-code"),
                name: document.querySelector(".title-name"),
                // breadcrumb: document.querySelectorAll(".breadcrumb li"),
                regular_price: document.querySelector(".price"),
                images: document.querySelectorAll(".slick-track .slick-slide"),
              };
              var updateObject = {
                id,
                sku: "Hanvico",
                name: elements.name
                  ? elements.name.textContent.trim()
                  : "(Unknown)",
                // breadcrumb:
                //   [...elements.breadcrumb]
                //     .map((el) => el?.textContent)
                //     ?.slice(1)
                //     .toString()
                //     .replaceAll(",", ">")
                //     .trim() || "(Unknown)",
                images: [...elements.images]
                  .map((imgs) => imgs.querySelector("a img")?.src)
                  .toString()
                  .trim(),
              };

              payload.push({
                ...updateObject,
                regular_price: elements.regular_price
                  ? elements.regular_price.textContent.trim()
                  : "Liên hệ",
              });

              var configs = document.querySelectorAll(".left-info");
              if (configs.length == 1) {
                var currentAttr = configs[0].querySelectorAll("li");

                const sleep = (milliseconds) => {
                  return new Promise((resolve) =>
                    setTimeout(resolve, milliseconds)
                  );
                };

                for (var x = 0; x < currentAttr.length; x++) {
                  document.querySelectorAll(".list_model   ")[x].click();
                  updateObject = {
                    ...updateObject,
                    [`attribute_${0}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${0}_name`]: "Kích thước",
                  };

                  await sleep(500);
                  payload.push({
                    ...updateObject,
                    regular_price: document
                      .querySelector("#list_price_data")
                      .textContent.trim(),
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
          console.log(...products);
          productPage.close();
          this.totals.products++;
          resolve(this.categories[index].products);
        });
      // ---- END PRODUCT PROMISE ---- //

      // LOOPING //
      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;

        let categoryCurrentData = await getProductByCategory(
          index,
          category.url
        );

        if (categoryCurrentData.length > 0) {
          console.table(this.totals);
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
            );

            await productPromise(index, jdex + ydex, productUrl);
          }

          if (this.categories[index].nextPage.length > 0) {
            for (var [kdex, nextPageUrl] of this.categories[
              index
            ].nextPage.entries()) {
              console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

              categoryCurrentData = await getProductByCategory(
                index,
                nextPageUrl
              );

              for (var [ydex, productUrl] of categoryCurrentData.entries()) {
                console.log(
                  `\t+ ${index} - ${
                    jdex + ydex
                  } Navigating to product ${productUrl} ...`
                );
                await productPromise(index, jdex + ydex, productUrl);
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
          console.table(this.totals);
        }
      }
    } catch (error) {
      throw error;
    }
  },
};

// const tham = {
//   baseUrl: "https://jysk.vn/tham?pagenumber=5",
//   categories: [],
//   totals: {
//     products: 0,
//     categories: 0,
//   },

//   async scrape(browser) {
//     try {
//       let base = await browser.newPage();
//       console.log(`-> Navigating to ${this.baseUrl}`);

//       await base.goto(this.baseUrl);
//       await base.waitForSelector(".container");

//       var payload = await base.$$eval(".viewcat #xemthem", (categories) => {
//         categories = categories.map((category) => {
//           var categoryEl = category.querySelector("a");

//           return {
//             title: categoryEl
//               ? categoryEl.getAttribute("title").trim()
//               : "(Unknown)",
//             url: categoryEl ? categoryEl.href : "(Unknown)",
//             products: [],
//           };
//         });

//         return categories;
//       });
//       payload && this.categories.push(...this.categories, ...payload);
//       console.table(this.categories);

//       // ---- getProductByCategory ---- //
//       let getProductByCategory = (index, categoryLink) =>
//         new Promise(async (resolve, reject) => {
//           console.log(`\t- Getting product via Category ...`);

//           let categoryPage = await browser.newPage();

//           await categoryPage.goto(categoryLink);
//           await categoryPage.waitForSelector(".container");

//           var payload = await categoryPage.$$eval(
//             "#category div.col-xs-12",
//             async (products) => {
//               products = products
//                 .filter((product) => {
//                   if (product) return product;
//                 })
//                 .map((product) => product.querySelector(".left-block a").href);

//               var nexPage = [
//                 ...document.querySelectorAll(
//                   ".pagination li:not(.active):not(.disabled)"
//                 ),
//               ]
//                 .slice(0, -1)
//                 .map((next) => next.querySelector("a[rel='next']")?.href);

//               return [products, [...nexPage]];
//             }
//           );
//           this.categories[index] = {
//             ...this.categories[index],
//             productURLs: payload[0],
//             nextPage: payload[1],
//           };
//           resolve(this.categories[index].productURLs);
//         });
//       // ---- END getProductByCategory ---- //

//       // ---- PRODUCT PROMISE ---- //
//       let productPromise = (index, jdex, productURL) =>
//         new Promise(async (resolve, reject) => {
//           // console.log(`\t+ Navigating to ${productURL} ...`);
//           let productPage = await browser.newPage();
//           await productPage.goto(productURL, {
//             waitUntil: "load",
//             timeout: 60000,
//           });
//           await productPage.waitForSelector("body");

//           console.log(`\t+ Building data ...`);
//           var products = await productPage.$$eval(
//             "body",
//             async (productPage) => {
//               var id = Math.random().toString(36).substring(8);

//               var payload = [];
//               var elements = {
//                 sku: document.querySelector(".product_info li > strong"),
//                 name: document.querySelector(".product_info li > h2"),
//                 breadcrumb: document.querySelectorAll(".breadcrumbs-wrap li"),
//                 regular_price: document.querySelector(
//                   ".product_info li .money"
//                 ),
//                 images: document.querySelectorAll("#image-gallery li"),
//               };
//               var updateObject = {
//                 id,
//                 sku: elements.sku
//                   ? elements.sku.textContent
//                       .replace(/\s/g, "")
//                       .trim()
//                       .replace(/\s/g, "")
//                   : "(Unknown)",
//                 name: elements.name
//                   ? elements.name.textContent.trim()
//                   : "(Unknown)",
//                 breadcrumb:
//                   [...elements.breadcrumb]
//                     .map((el) => el?.textContent)
//                     ?.slice(1)
//                     .toString()
//                     .replaceAll(",", ">")
//                     .trim() || "(Unknown)",
//                 images: [...elements.images]
//                   .map(
//                     (imgs) =>
//                       `${this.webBase}/${imgs
//                         .querySelector("a")
//                         ?.getAttribute("data-src")}`
//                   )
//                   .toString()
//                   .trim(),
//               };

//               var configs = document.querySelectorAll(".dropdown-menu");
//               if (configs.length == 1) {
//                 var currentAttr =
//                   configs[0].querySelectorAll(".dropdown-menu li");

//                 for (var x = 0; x < currentAttr.length; x++) {
//                   currentAttr[x].querySelector("a").click();
//                   updateObject = {
//                     ...updateObject,
//                     [`attribute_${0}_value`]: currentAttr[x]
//                       .querySelector("a")
//                       .textContent.trim(),
//                     [`attribute_${0}_name`]: "Kích thước",
//                   };
//                   payload.push({
//                     ...updateObject,
//                     regular_price: elements.regular_price
//                       ? elements.regular_price.textContent.trim()
//                       : "Liên hệ",
//                   });
//                 }
//               }
//               return payload;
//             },
//             productPage
//           );
//           this.categories[index] = {
//             ...this.categories[index],
//             products: [...this.categories[index].products, ...products],
//           };
//           productPage.close();
//           this.totals.products++;
//           resolve(this.categories[index].products);
//         });
//       // ---- END PRODUCT PROMISE ---- //

//       // LOOPING //
//       for (var [index, category] of this.categories.entries()) {
//         this.totals.categories++;

//         let categoryCurrentData = await getProductByCategory(
//           index,
//           category.url
//         );

//         if (categoryCurrentData.length > 0) {
//           console.table(this.totals);
//           for (var [jdex, productUrl] of categoryCurrentData.entries()) {
//             console.log(
//               `\n\t+ ${index} - ${jdex} Navigating to product ${productUrl} ...`
//             );

//             await productPromise(index, jdex + ydex, productUrl);
//           }

//           if (this.categories[index].nextPage.length > 0) {
//             for (var [kdex, nextPageUrl] of this.categories[
//               index
//             ].nextPage.entries()) {
//               console.log(`\n\t-> Navigating to next page ${nextPageUrl}`);

//               categoryCurrentData = await getProductByCategory(
//                 index,
//                 nextPageUrl
//               );

//               for (var [ydex, productUrl] of categoryCurrentData.entries()) {
//                 console.log(
//                   `\t+ ${index} - ${
//                     jdex + ydex
//                   } Navigating to product ${productUrl} ...`
//                 );
//                 await productPromise(index, jdex + ydex, productUrl);
//               }
//             }
//           }
//           if (this.categories[index].products.length > 0) {
//             console.log("\t+ Converting to CSV ...");
//             await convert2csv({
//               filename: this.categories[index].title,
//               data: this.categories[index].products,
//             }).then(() => {
//               console.log("\t+ Converted to CSV successfully");
//               return;
//             });
//           }
//           console.table(this.totals);
//         }
//       }
//     } catch (error) {
//       throw error;
//     }
//   },
// };
export { uannga, demxanh, tham, rem, demxinh };
