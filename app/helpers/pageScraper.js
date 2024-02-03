import { app } from "../configs/app.config.js";
import { convert2csv } from "../utils/json2csv.js";

const demxanh = {
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
        console.log(`\t+ Navigating to ${productLink} ...`);
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
            var configs = document.querySelectorAll(".pd-config-group");
            let payload = [];
            let attrObject = {};

            if (configs.length > 0) {
              for (let [index, config] of configs.entries()) {
                let attributes = config.querySelectorAll(
                  ".config-group-holder a"
                );
                let object = {
                  id: index,
                  sku:
                    `#${document
                      .querySelector(".blog-middle div.text-12 a")
                      ?.textContent.trim()}` || "#PRODUCT",
                  parent_sku:
                    `#${document
                      .querySelector(".blog-middle div.text-12 a")
                      ?.textContent.trim()}` || "#PRODUCT",
                  name:
                    document
                      .querySelector(".blog-middle h1")
                      ?.textContent.trim() || "Updating ...",
                  description: "No description for this product.",
                  short_description: "No short description for this product.",
                  breadcrumb: [
                    ...document.querySelectorAll(".global-breadcrumb ol a"),
                  ]
                    .map((text) => {
                      if (text) return `${text.textContent.trim()}`;
                      return "Updating ...";
                    })
                    .toString()
                    .replaceAll(",", ">"),
                  images: [
                    ...document.querySelectorAll(
                      ".product-detail-group a[data-fancybox='gallery'"
                    ),
                  ].map((img) => {
                    if (img) return img.href;
                    return "Updating ...";
                  }),
                };

                attributes.forEach((attribute, key) => {
                  attribute.click();

                  object = {
                    ...object,
                    [`attribute_${index}_name`]: config
                      .querySelector("p")
                      .textContent.trim(),
                    [`attribute_${index}_value`]: attribute.textContent.trim(),
                  };
                });
                payload.push(object);

                // for (let [ydex, attribute_1] of attributes.entries()) {
                //   attribute_1.click();
                //   object = {
                //     ...object,
                //     [`attribute_${index}_name`]: config
                //       .querySelector("p")
                //       .textContent.trim(),
                //     [`attribute_${index}_value`]:
                //       attribute_1.textContent.trim(),
                //   };

                //   if (configs.length > 1) {
                //     // let attributes_1 = ;
                //     // object = { attributes_1, key: configs[index + 1], index };
                //     for (let [xdex, attribute_2] of config
                //       .querySelectorAll(".config-group-holder a")
                //       .entries()) {
                //       attribute_2.click();
                //       object = {
                //         ...object,
                //         [`attribute_${index}_name`]: config
                //           .querySelector("p")
                //           .textContent.trim(),
                //         [`attribute_${index}_value`]:
                //           attribute_2.textContent.trim(),
                //       };
                //     }
                //   }

                //   object = {
                //     ...object,
                //     regular_price: document
                //       .querySelector(".pd-price-container b")
                //       .textContent.trim(),
                //   };
                //   payload.push(object);
                // }
              }
            }
            return payload;
          }
        );
        console.log(variations);

        // this.categories[0][index][jdex] = {
        //   ...this.categories[0][index][jdex],
        //   variations,
        // };
        // console.log(this.categories[0][index][jdex]);
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
      console.log(this.categories[0][index]);
      for (var [jdex, product] of categoryCurrentData[0].entries()) {
        let productCurrentData = await productPromise(index, jdex, product.url);
        console.log(`\t+ ${index} - ${jdex} Navigating to ${product.url} ...`);
      }
    }
  },
};

const hoatuoi360 = {
  baseUrl: "https://hoatuoi360.com",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      // Category fetching
      let page = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl} ...`);
      // navigate to url
      await page.goto(this.baseUrl, { waitUntil: "load", timeout: 60000 });
      // wait for the required DOM to be rendered
      await page.waitForSelector(".nav-vertical");

      // get all categories info
      var payload = await page.$$eval(
        ".nav-vertical .navbar-nav li",
        (categories) => {
          categories = categories.map((category) => {
            return {
              title: category.querySelector("a")?.textContent?.trim(),
              url: category.querySelector("a")?.href,
              products: [],
            };
          });
          return categories;
        }
      );
      this.categories.push(...this.categories, ...payload);

      // products
      let categoryPromise = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log("+ Navigating to " + categoryLink);
          let categoryPage = await browser.newPage();
          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".product-grid");

          var payload = await categoryPage.$$eval(
            ".product-grid .col-xs-6",
            async (products) => {
              products = products.map(
                (product) => product.querySelector(".product")?.href
              );

              var nexPage = [
                ...document.querySelectorAll(
                  ".pagination li:not(.prev):not(.next):not(.active)"
                ),
              ].map((next) => next.querySelector("a").href);

              // if (nexPage) {
              //   var nextUrl = document.querySelector(
              //     ".pagination li.next > a"
              //   ).href;
              //   await categoryPromise(index, nextUrl);
              // }

              return [products, [...nexPage]];
            }
          );
          this.categories[index] = {
            ...this.categories[index],
            productURLs: payload[0],
            nextPage: payload[1],
          };
          // console.log(this.categories[index]);
          // console.log(this.categories[index].products[0]);
          categoryPage.close();
          resolve(this.categories[index].productURLs);
          // if (
          //   this.categories[index] &&
          //   this.categories[index].hasOwnProperty("productURLs")
          // ) {
          // } else {
          //   categoryPage.close();
          //   resolve(null);
          // }
        });

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
            ".product-info",
            async (productPage) => {
              var id = Math.random().toString(36).substring(8);

              var payload = [];
              var elements = {
                sku: document.querySelector("span[itemprop='mpn'"),
                name: document.querySelector(".product-info-header-primary h1"),
                description: document.querySelector(
                  ".product-more-info #description"
                ),
                short_description: document.querySelector(
                  ".product-info-content .product-description"
                ),
                breadcrumb: document.querySelectorAll(
                  ".breadcrumbs ul li.active"
                ),
                images: document.querySelector(".product-image-gallery img"),
                regular_price: document.querySelector(".price-box .price"),
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
                short_description: elements.short_description?.innerHTML,
                breadcrumb: [...elements.breadcrumb]
                  .map((el) => el?.textContent)
                  ?.slice(0, -1)
                  .toString()
                  .replaceAll(",", ">"),
                images: elements.images && elements.images.src,
              };
              var configs = document.querySelectorAll(
                ".product-details .product-variants"
              );

              if (configs.length == 1) {
                var currentAttr = configs[0].querySelectorAll(
                  ".product-variants option"
                );

                for (var x = 0; x < currentAttr.length; x++) {
                  // currentAttr[x].click();
                  var scriptText = document
                    .querySelector(".product-details script")
                    ?.textContent?.trim();
                  var priceBox = scriptText
                    .substr(scriptText.indexOf("=") + 1)
                    ?.trim()
                    .replace(";", "");

                  var priceObject = JSON.parse(priceBox);

                  updateObject = {
                    ...updateObject,
                    [`attribute_${0}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${0}_name`]: configs[0]
                      .querySelector("strong.control-label")
                      .textContent.trim(),
                  };
                  payload.push({
                    ...updateObject,
                    // regular_price: elements.regular_price.textContent.trim(),
                    regular_price:
                      priceObject[currentAttr[x].value].price.price,
                  });
                }
              } else if (configs.length > 1) {
                for (var i = 0; i < configs.length - 1; i++) {
                  var currentAttr = configs[i].querySelectorAll(
                    ".form-control option"
                  );

                  for (var x = 0; x < currentAttr.length; x++) {
                    currentAttr[x].click();
                    updateObject = {
                      ...updateObject,
                      [`attribute_${i}_value`]:
                        currentAttr[x].textContent.trim(),
                      [`attribute_${i}_name`]: configs[i]
                        .querySelector("strong.control-label")
                        .textContent.trim(),
                    };

                    if (configs.length > 1 && i + 1 < configs.length) {
                      var nextAttr = configs[i + 1].querySelectorAll(
                        ".form-control option"
                      );
                      for (var y = 0; y < nextAttr.length; y++) {
                        nextAttr[y].click();
                        updateObject = {
                          ...updateObject,
                          [`attribute_${i + 1}_value`]:
                            nextAttr[y].textContent.trim(),
                          [`attribute_${i + 1}_name`]: configs[i + 1]
                            .querySelector("strong.control-label")
                            .textContent.trim(),
                        };
                      }
                    }
                  }
                  payload.push({
                    regular_price: elements.regular_price.textContent.trim(),
                    ...updateObject,
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

      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;
        let categoryCurrentData = await categoryPromise(index, category.url);
        if (categoryCurrentData.length > 0) {
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to ${productUrl} ...`
            );
            let productCurrentData = await productPromise(
              index,
              jdex,
              productUrl
            );
          }

          console.log(this.categories[index].nextPage);
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
                  } Navigating to ${productUrl} ...`
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
    } finally {
      console.table(this.totals);
      return;
    }
  },
};

const demxanh2 = {
  baseUrl: "https://demxanh.com",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      // Category fetching
      let page = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl} ...`);
      // navigate to url
      await page.goto(this.baseUrl, { waitUntil: "load", timeout: 60000 });
      // wait for the required DOM to be rendered
      await page.waitForSelector(".container");

      // get all categories info
      var payload = await page.$$eval(
        ".cat-menu-group div.cat-item",
        (categories) => {
          categories = categories.map((category) => {
            return {
              title: category.querySelector("a")?.textContent?.trim(),
              url: category.querySelector("a")?.href,
              products: [],
            };
          });
          return categories;
        }
      );
      this.categories.push(...this.categories, ...payload);
      // console.log(this.categories);

      // products
      let categoryPromise = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log("+ Navigating to " + categoryLink);
          let categoryPage = await browser.newPage();
          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector(".product-page");

          var payload = await categoryPage.$$eval(
            ".col-left > .p-container .p-item",
            async (products) => {
              products = products.map(
                (product) => product.querySelector(".p-img")?.href
              );

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
                description: document.querySelector(
                  ".product-info-group .pro-desc-group"
                ),
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
                  ?.slice(0, -1)
                  .toString()
                  .trim()
                  .replaceAll(",", ">"),
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
                  // currentAttr[x].click();
                  // var scriptText = document
                  //   .querySelector(".product-details script")
                  //   ?.textContent?.trim();
                  // var priceBox = scriptText
                  //   .substr(scriptText.indexOf("=") + 1)
                  //   ?.trim()
                  //   .replace(";", "");

                  // var priceObject = JSON.parse(priceBox);

                  updateObject = {
                    ...updateObject,
                    [`attribute_${0}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${0}_name`]: configs[0]
                      .querySelector("p.group-title")
                      .textContent.trim(),
                  };
                  payload.push({
                    ...updateObject,
                    // regular_price: elements.regular_price.textContent.trim(),
                    regular_price: elements.regular_price?.textContent.trim(),
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
                    regular_price: elements.regular_price?.textContent.trim(),
                    ...updateObject,
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

      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;
        let categoryCurrentData = await categoryPromise(index, category.url);
        console.log(this.categories);
        if (categoryCurrentData.length > 0) {
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to ${productUrl} ...`
            );
            let productCurrentData = await productPromise(
              index,
              jdex,
              productUrl
            );

            // console.log(productCurrentData);
          }

          // console.log(this.categories[index].nextPage);
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
                  } Navigating to ${productUrl} ...`
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
    } finally {
      console.table(this.totals);
      return;
    }
  },
};

const uannga = {
  baseUrl: "https://uannga.vn",
  categories: [],
  totals: {
    products: 0,
    categories: 0,
  },

  async scrape(browser) {
    try {
      // Category fetching
      let page = await browser.newPage();
      console.log(`-> Navigating to ${this.baseUrl} ...`);
      // navigate to url
      await page.goto(this.baseUrl, { waitUntil: "load", timeout: 60000 });
      // wait for the required DOM to be rendered
      await page.waitForSelector(".container");

      // get all categories info
      var payload = await page.$$eval(".viewcat .row", (categories) => {
        categories = categories.map((category) => {
          return {
            title: category
              .querySelector(".tms_sp_title a")
              ?.getAttribute("title")
              .trim(),
            url: category.querySelector(".tms_sp_title a")?.href,
            products: [],
          };
        });
        return categories;
      });
      this.categories.push(...this.categories, ...payload);
      // console.log(this.categories);

      // products
      let categoryPromise = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log("+ Navigating to " + categoryLink);
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
                ...document.querySelectorAll(".pagination li"),
              ].map((next) =>
                next.querySelector(a["rel='next'"]?.href)?.slice(0, -1)
              );

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
                  .replaceAll(",", ">"),
                images: [...elements.images]
                  .map((imgs) =>
                    imgs.querySelector("a")?.getAttribute("data-src")
                  )
                  .toString()
                  .trim(),
              };
              var configs = document.querySelectorAll(".dropdown");

              if (configs.length == 1) {
                var currentAttr =
                  configs[0].querySelectorAll(".dropdown-menu li");

                for (var x = 0; x < currentAttr.length; x++) {
                  currentAttr[x].querySelector("a").click();
                  // currentAttr[x].click();
                  // var scriptText = document
                  //   .querySelector(".product-details script")
                  //   ?.textContent?.trim();
                  // var priceBox = scriptText
                  //   .substr(scriptText.indexOf("=") + 1)
                  //   ?.trim()
                  //   .replace(";", "");

                  // var priceObject = JSON.parse(priceBox);

                  updateObject = {
                    ...updateObject,
                    [`attribute_${0}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${0}_name`]: configs[0]
                      .querySelector("p.group-title")
                      .textContent.trim(),
                  };
                  payload.push({
                    ...updateObject,
                    // regular_price: elements.regular_price.textContent.trim(),
                    regular_price: elements.regular_price?.textContent.trim(),
                  });
                }
              }
              // } else if (configs.length > 1) {
              //   for (var i = 0; i < configs.length - 1; i++) {
              //     var currentAttr = configs[i].querySelectorAll(
              //       ".config-group-holder a"
              //     );

              //     for (var x = 0; x < currentAttr.length; x++) {
              //       currentAttr[x].click();
              //       updateObject = {
              //         ...updateObject,
              //         [`attribute_${i}_value`]:
              //           currentAttr[x].textContent.trim(),
              //         [`attribute_${i}_name`]: configs[i]
              //           .querySelector("p.group-title")
              //           .textContent.trim(),
              //       };

              //       if (configs.length > 1 && i + 1 < configs.length) {
              //         var nextAttr = configs[i + 1].querySelectorAll(
              //           ".config-group-holder a"
              //         );
              //         for (var y = 0; y < nextAttr.length; y++) {
              //           nextAttr[y].click();
              //           updateObject = {
              //             ...updateObject,
              //             [`attribute_${i + 1}_value`]:
              //               nextAttr[y].textContent.trim(),
              //             [`attribute_${i + 1}_name`]: configs[i + 1]
              //               .querySelector("p.group-title")
              //               .textContent.trim(),
              //           };
              //         }
              //       }
              //     }
              //     payload.push({
              //       regular_price: elements.regular_price?.textContent.trim(),
              //       ...updateObject,
              //     });
              //   }
              // }
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

      for (var [index, category] of this.categories.entries()) {
        this.totals.categories++;
        let categoryCurrentData = await categoryPromise(index, category.url);
        console.log(this.categories);
        if (categoryCurrentData.length > 0) {
          for (var [jdex, productUrl] of categoryCurrentData.entries()) {
            console.log(
              `\n\t+ ${index} - ${jdex} Navigating to ${productUrl} ...`
            );
            let productCurrentData = await productPromise(
              index,
              jdex,
              productUrl
            );

            // console.log(productCurrentData);
          }

          // console.log(this.categories[index].nextPage);
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
                  } Navigating to ${productUrl} ...`
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
    } finally {
      console.table(this.totals);
      return;
    }
  },
};

export { demxanh, hoatuoi360, demxanh2, uannga };
