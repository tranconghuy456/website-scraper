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

        // var variations = await productPage.$$eval(
        //   ".pd-config-group",
        //   (configs) => {
        //     let payload = [];
        //     for (var [count, config] of configs.entries()) {
        //       console.log(count);
        //       let attributes = config.querySelectorAll(
        //         ".config-group-holder a"
        //       );

        //       for (var [index, attribute] of attributes.entries()) {
        //         console.log(index);
        //         attribute.click();
        //         if (configs.length > 1) {
        //           console.log(configs[count + 1]);
        //           for (var [ydex, attribute_1] of configs[count + 1]
        //             .querySelectorAll(".config-group-holder a")
        //             .entries()) {
        //             attribute_1.click();
        //             payload.push({
        //               id: count,
        //               sku:
        //                 "#" +
        //                   document
        //                     .querySelector(".blog-middle div.text-12 a")
        //                     ?.textContent.trim()
        //                     .replace(/(\r\n|\n|\r)/gm, "") || "#PRODUCT",
        //               parent_sku:
        //                 "#" +
        //                   document
        //                     .querySelector(".blog-middle div.text-12 a")
        //                     ?.textContent.trim()
        //                     .replace(/(\r\n|\n|\r)/gm, "") || "#PRODUCT",
        //               name:
        //                 document
        //                   .querySelector(".blog-middle h1")
        //                   .textContent.trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "Updating ...",
        //               regular_price:
        //                 document
        //                   .querySelector(".pd-price-container b")
        //                   .textContent.trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "Contact",
        //               description:
        //                 document.querySelector(".pro-desc-group")?.innerHTML ||
        //                 "No description for this product",
        //               short_description:
        //                 "No short description for this product",
        //               breadcrumb: [
        //                 ...document.querySelectorAll(".global-breadcrumb ol a"),
        //               ]
        //                 .map((text) => {
        //                   if (text)
        //                     return `${text.textContent
        //                       .trim()
        //                       .replace(/(\r\n|\n|\r)/gm, "")}`;
        //                   return "Updating";
        //                 })
        //                 .toString()
        //                 .replaceAll(",", ">"),
        //               images: [
        //                 ...document.querySelectorAll(
        //                   ".product-detail-group a[data-fancybox='gallery']"
        //                 ),
        //               ]
        //                 .map((img) => {
        //                   if (img) return img.href;
        //                   return "Updating";
        //                 })
        //                 .toString(),
        //               [`attribute_${count + 1}_name`]:
        //                 config
        //                   .querySelector("p")
        //                   .textContent.trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "",
        //               [`attribute_${count}_value`]:
        //                 attribute_1.textContent
        //                   .trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "",
        //               [`attribute_${count + 1}_name`]:
        //                 configs[count + 1]
        //                   .querySelector("p")
        //                   .textContent.trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "",
        //               [`attribute_${count + 1}_value`]:
        //                 attribute_1.textContent
        //                   .trim()
        //                   .replace(/(\r\n|\n|\r)/gm, "") || "",
        //               // attribute_1_name:
        //               //   config
        //               //     ?.querySelector("p")
        //               //     ?.textContent?.trim()
        //               //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //               // attribute_1_value:
        //               //   attribute?.textContent
        //               //     ?.trim()
        //               //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //               // attribute_2_name:
        //               //   configs[count + 1]
        //               //     ?.querySelector("p")
        //               //     ?.textContent?.trim()
        //               //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //               // attribute_2_value:
        //               //   attributes[index + 1]?.textContent
        //               //     ?.trim()
        //               //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //             });
        //           }
        //         } else {
        //           payload.push(configs[count], configs[count + 1]);
        //           // payload.push({
        //           //   id: jdex,
        //           //   sku:
        //           //     "#" +
        //           //       document
        //           //         .querySelector(".blog-middle div.text-12 a")
        //           //         ?.textContent.trim()
        //           //         .replace(/(\r\n|\n|\r)/gm, "") || "#PRODUCT",
        //           //   parent_sku:
        //           //     "#" +
        //           //       document
        //           //         .querySelector(".blog-middle div.text-12 a")
        //           //         ?.textContent.trim()
        //           //         .replace(/(\r\n|\n|\r)/gm, "") || "#PRODUCT",
        //           //   name:
        //           //     document
        //           //       .querySelector(".blog-middle h1")
        //           //       .textContent.trim()
        //           //       .replace(/(\r\n|\n|\r)/gm, "") || "Updating ...",
        //           //   regular_price:
        //           //     document
        //           //       .querySelector(".pd-price-container b")
        //           //       .textContent.trim()
        //           //       .replace(/(\r\n|\n|\r)/gm, "") || "Contact",
        //           //   description:
        //           //     document.querySelector(".pro-desc-group")?.innerHTML ||
        //           //     "No description for this product",
        //           //   short_description: "No short description for this product",
        //           //   breadcrumb: [
        //           //     ...document.querySelectorAll(".global-breadcrumb ol a"),
        //           //   ]
        //           //     .map((text) => {
        //           //       if (text)
        //           //         return `${text.textContent
        //           //           .trim()
        //           //           .replace(/(\r\n|\n|\r)/gm, "")}`;
        //           //       return "Updating";
        //           //     })
        //           //     .toString()
        //           //     .replaceAll(",", ">"),
        //           //   images: [
        //           //     ...document.querySelectorAll(
        //           //       ".product-detail-group a[data-fancybox='gallery']"
        //           //     ),
        //           //   ]
        //           //     .map((img) => {
        //           //       if (img) return img.href;
        //           //       return "Updating";
        //           //     })
        //           //     .toString(),
        //           //   [`attribute_${count}_name`]:
        //           //     config
        //           //       .querySelector("p")
        //           //       .textContent.trim()
        //           //       .replace(/(\r\n|\n|\r)/gm, "") || "",
        //           //   [`attribute_${count}_value`]:
        //           //     attribute.textContent
        //           //       .trim()
        //           //       .replace(/(\r\n|\n|\r)/gm, "") || "",
        //           //   // attribute_1_name:
        //           //   //   config
        //           //   //     ?.querySelector("p")
        //           //   //     ?.textContent?.trim()
        //           //   //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //           //   // attribute_1_value:
        //           //   //   attribute?.textContent
        //           //   //     ?.trim()
        //           //   //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //           //   // attribute_2_name:
        //           //   //   configs[count + 1]
        //           //   //     ?.querySelector("p")
        //           //   //     ?.textContent?.trim()
        //           //   //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //           //   // attribute_2_value:
        //           //   //   attributes[index + 1]?.textContent
        //           //   //     ?.trim()
        //           //   //     ?.replace(/(\r\n|\n|\r)/gm, "") || "",
        //           // });
        //         }
        //       }
        //     }
        //     return payload;
        //   }
        // );

        var variations = await productPage.$$eval(
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
        this.categories[0][1].url
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
