const axios = require("axios");
const https = require('https');
const helpers = require("./Utilities/helper");

function GetTokenPSIRT(PackageData, db) {
  return new Promise((resolve) => {
    const clientId = helpers.decrypt(PackageData.PSIRT_client_Id, helpers.KeyPhrase);
    const clientSecret = helpers.decrypt(PackageData.PSIRT_client_Secret, helpers.KeyPhrase);

    let config = {
      method: 'post',
      url:`${PackageData.PSIRT_Token_Url}?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Accept': 'application/json', 
      }
    };

    axios.request(config)
    .then((response) => {
      helpers.buildStatusForTools(response.status, "PSIRT", db);
      resolve(response.data.access_token);
    })
    .catch((error) => {
      helpers.buildStatusForTools(500, "PSIRT", db);
      console.log("Error in GetToken PSIRT",error);
    });
  });
}
function GetAdvisoryPSIRT(PackageData, PsirtWiseDataList) {
  return new Promise((resolve) => {
    // Create a custom agent that forces IPv4
    const agent = new https.Agent({ family: 4 });
    let config = {
      method: 'get',
      url:  PackageData.PSIRT_Advisory_Url || 'https://apix.cisco.com/security/advisories/all',
      headers: { 
        'Authorization': `Bearer ${PsirtWiseDataList}`, 
        'Accept': 'application/json', 
      },
      httpsAgent: agent,
      timeout: 2 * 60 * 1000, // 2 minutes timeout
    };

    axios.request(config)
    .then((response) => {
      console.log("GetAdvisoryPSIRT response",);
      
      resolve(response.data.advisories);
    })
    .catch((error) => {
      console.error("Error in GetAdvisoryPSIRT", error);
    });
  });
}

const GetIncidentDetailsPSIRT = function GetIncidentDetailsPSIRT(PackageData) {
  // var options = {
  //     "method": "POST",
  //     "hostname": "dev61175.service-now.com",
  //     "path": "/api/now/table/incident",
  //     "headers": {
  //         "authorization": "Basic YWRtaW46V2VsY29tZUAx"
  //     }
  // };

  // return new Promise(resolve => {
  //     var req = http.request(options, function (res) {
  //         var chunks = [];

  //         res.on("data", function (chunk) {
  //             chunks.push(chunk);
  //         });
  //         res.on("end", function () {
  //             try {
  //                 var body = Buffer.concat(chunks).toString();
  //                 resolve(JSON.parse(body));
  //             } catch (error) {
  //                 console.error("Request failed", Buffer.concat(chunks).toString());
  //             }
  //         });
  //     });

  //     req.write(JSON.stringify({
  //         short_description: 'hello',
  //         category: 'network',
  //         severity: '1',
  //         description: 'text',
  //         contact_type: 'dnac'
  //     }));
  //     req.end();

  // });

  // var options = {
  //     "method": "POST",
  //     "hostname": "https://dev65406.service-now.com//api/now/v1/table/incident",
  //     "headers": {
  //         Authorization:
  //        "Basic " +
  //        Buffer.from(
  //          PackageData[0].ServiceNowUserName + ":" + PackageData[0].ServiceNowPassword
  //        ).toString("base64")
  //      }
  // };
  // console.log('Auth-Token', Buffer.from(
  //     PackageData[0].ServiceNowUserName + ":" + PackageData[0].ServiceNowPassword
  //   ).toString("base64")       )

  return new Promise((resolve) => {
    axios
      .get(`${PackageData.ServiceNowAPI}`, {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              PackageData.ServiceNowUserName +
              ":" +
              PackageData.ServiceNowPassword
            ).toString("base64"),
        },
      })
      .then((res) => {
        // var chunks = [];
        // chunks.push(res);
        //     var body = Buffer.concat(chunks).toString();
        // console.log(JSON.parse(body));
        resolve(res.data.result);
      })
      .catch((error) => {
        console.error("Request failed", error);
      })
      .finally(() => { });
  });
};

exports.GetIncidentDetailsPSIRT = GetIncidentDetailsPSIRT;
exports.GetAdvisoryPSIRT = GetAdvisoryPSIRT;
exports.GetTokenPSIRT = GetTokenPSIRT;
