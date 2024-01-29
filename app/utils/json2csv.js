import { Parser } from "json2csv";
import * as fs from "fs";

const convert2csv = async ({ filename, data }) => {
  filename = filename.replace(/[\/\\:*?"<>]/g, "");

  //   console.log(data);

  try {
    const parser = new Parser({
      withBOM: true,
    });

    const csv = parser.parse(data);

    fs.writeFile(`${filename}.csv`, csv, "utf-8", (error) => {
      if (error) throw error;
      console.log("\t+ Converted to CSV successfully");
    });
  } catch (err) {
    console.error(err);
  }
};

export { convert2csv };
