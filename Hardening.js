const axios = require("axios");
const helpers = require('./Utilities/helper')
const GetHardeningData = function GetHardeningData(PackageData, db) {
  return new Promise(resolve => {
    axios
      .get(
        `${PackageData[0].HardeningCommandURl}`,
        {
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                PackageData[0].HardeningUserName + ":" + PackageData[0].HardeningPassword
              ).toString("base64")

            //    Authorization:

          }
        }
      )
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
      })
      .finally(function () {
      });
  });

}
const GetHardeningDrillDown = function GetHardeningDrillDown(PackageData, drillDownData) {
  // let device_type;
  let device_id;
  let commands;
  let AllData = [];
  let mainCounter = 0;
  let compilence = 'no';
  for (let i = 0; i < drillDownData.length; i++) {
    device_id = drillDownData[i][0].device_id;
    drillDownData[i].map(item => {
      // device_type = item.device_type;
      if (item.command_param_output == '1'/* item.command_output == '1' */) {
        mainCounter = mainCounter + 1;

      }
    })

    if (mainCounter == drillDownData[i].length) {
      compilence = 'yes'
    }

    let obj = {
      // device_type:device_type,
      command: mainCounter + '/' + drillDownData[i].length,
      details: drillDownData[i],
      compilence: compilence,
      device_id: device_id,
    }
    AllData.push(obj);

    compilence = 'no'
    mainCounter = 0;
  }
  return AllData;
}

exports.GetHardeningDrillDown = GetHardeningDrillDown;
exports.GetHardeningData = GetHardeningData;