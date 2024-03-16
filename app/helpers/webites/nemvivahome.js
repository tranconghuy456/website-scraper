import { convert2csv } from "../../utils/json2csv.js";

export const nemvivahome = {
  url: "https://nemvivahome.com/tat-ca-san-pham/",
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
      await basePage.waitForSelector("#wrapper");

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
        return categories;
      });

      if (payload) this.categories.push(...this.categories, ...payload);

      this.categories.pop();

      console.table(this.categories);

      //* CATEGORY PROMISE *//
      const categoryPromise = (index, categoryLink) =>
        new Promise(async (resolve, reject) => {
          console.log(`\t Getting product via Category: ${categoryLink} ...`);
          let categoryPage = await browser.newPage();
          await categoryPage.goto(categoryLink);
          await categoryPage.waitForSelector("#wrapper");

          let payload = await categoryPage.$$eval(
            ".products > .product-small",
            (products) => {
              products = products.map(
                (product) => product.querySelector(".box-image a")?.href
              );

              let nextPage = [
                ...document.querySelectorAll(
                  ".woocommerce-pagination .page-number:not(.current)"
                ),
              ].map((next) => next?.href);

              return [products, [...nextPage]];
            }
          );
          this.categories[index] = {
            ...this.categories[index],
            productUrl: payload[0],
            nextPage: payload[1],
          };
          resolve(this.categories[index].productUrl);
        });

      //* PRODUCT PROMISE *//
      const productPromise = (index, jdex, productUrl) =>
        new Promise(async (resolve, reject) => {
          let productPage = await browser.newPage();
          await productPage.goto(productUrl);
          await productPage.waitForSelector("#wrapper");

          console.log(`\t Building data ...`);

          var products = await productPage.$$eval(".product-container", () => {
            var id = Math.random().toString(36).substring(8);
            var payload = [];
            var elements = {
              name: document.querySelector(".product-title"),
              images: document.querySelectorAll(
                ".flickity-slider .col > a img"
              ),
              regular_price: document.querySelector(
                ".woocommerce-Price-amount bdi"
              ),
            };

            var updateObject = {
              id,
              name: elements.name.textContent.trim(),
              images: [...elements.images]
                .map((img) => img?.href)
                .toString()
                .trim(),
            };

            var variations = document.querySelectorAll(".variations tr");

            if (variations.length > -1) {
              var currentAttr =
                variations[0].querySelectorAll(".ux-swatch__text");

              for (let x = 0; x < currentAttr.length; x++) {
                currentAttr[x].click();

                updateObject = {
                  ...updateObject,
                  [`attribute_${x}_value`]: currentAttr[x].textContent.trim(),
                  [`attribute_${x}_name`]: variations[0]
                    .querySelector("label")
                    .textContent.trim(),
                };

                payload.push({
                  ...updateObject,
                  regular_price:
                    elements.regular_price && elements.regular_price,
                });
              }
            } else if (variations.length > 1) {
              for (let i = 0; i < variations.length - 1; i++) {
                var currentAttr =
                  variations[i].querySelector(".ux-swatch__text");

                for (let x = 0; x < currentAttr.length; x++) {
                  currentAttr[x].click();

                  updateObject = {
                    ...updateObject,
                    [`attribute_${x}_value`]: currentAttr[x].textContent.trim(),
                    [`attribute_${x}_name`]: variations[i]
                      .querySelector("label")
                      .textContent.trim(),
                  };

                  payload.push({
                    ...updateObject,
                    regular_price:
                      elements.regular_price && elements.regular_price,
                  });
                }
              }
            }

            return payload;
          });

          this.categories[index] = {
            ...this.categories[index],
            products: [...this.categories[index].products, ...products],
          };
          productPage.close();
          resolve(this.categories[index].products);
        });

      for (let [index, category] of this.categories.entries()) {
        // console.log(category.url);
        let categoryData = await categoryPromise(index, category.url);
        console.log(categoryData.length);
        if (categoryData.length > 0) {
          // run product promise
          for (let [jdex, productUrl] of categoryData.entries()) {
            let prodcutData = await productPromise(index, jdex, productUrl);
            console.log(prodcutData);
          }
        }

        // check nextpage
      }
    } catch (error) {}
  },
};
