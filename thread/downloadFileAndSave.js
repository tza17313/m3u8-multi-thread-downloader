const fs = require("fs");
const axios = require("axios").default;
const utils = require("../lib/utils");

module.exports = function (resove, reject) {
  return (task) => {
    const tsObj = task;
    if (fs.existsSync(tsObj.file)) {
      if (resove) {
        resove({ task });
      }
    } else {
      const opt = {
        method: "GET",
        url: tsObj.url,
        headers: {
          "User-Agent": "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
        },
        responseType: "arraybuffer",
      };
      axios(opt)
        .then((res) => {
          if (res.status === 200) {
            fs.writeFile(tsObj.file, res.data, (error) => {
              if (error) {
                if (reject) {
                  reject({ error, task });
                }
              } else {
                if (resove) {
                  resove({ task });
                }
              }
            });
          } else {
            if (reject) {
              reject({ error: res.status, task });
            }
          }
        })
        .catch(function (error) {
          utils.log(`error: ${error}`);
          if (reject) {
            reject({ error, task });
          }
        });
    }
  };
};
