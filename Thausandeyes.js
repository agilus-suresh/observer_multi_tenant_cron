const axios = require("axios");
var http = require("https");
const helpers = require("./Utilities/helper");

// function GetTokenPSIRT(PackageData, db) {
//   return new Promise((resolve) => {
//     axios
//       .post(
//         `https://cloudsso.cisco.com/as/token.oauth2?grant_type=client_credentials&client_id=p326nketmw9nhfgyawrgady6&client_secret=TucgXcdDB2FAJEMBwuJJdvAc&Content-Type=application/x-www-form-urlencoded`,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       )
//       .then(function (response) {
//         helpers.buildStatusForTools(response.status, "PSIRT", db);
//         resolve(response.data.access_token);
//       })
//       .catch(function (error) {
//         helpers.buildStatusForTools(500, "PSIRT", db);
//       })
//       .finally(function () {
//       });
//   });
// }
async function findAgentsAndMonitorsDetails(db) {
  try {
    // const base_url = 'api.thousandeyes.com';
    const pagckageDetail = await db.collection('tbl_Package').findOne({});
    const api_url = `https://${pagckageDetail.thUrl}/v6/agents.json`;
    let token = pagckageDetail.thAuthrization;
    let config = {
      headers: {
        'Authorization': `Bearer  ${token}`
      }
    }
    let data = await axios.get(`${api_url}`, config);
    let mainData = data.data;
    mainData['timestamp'] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    // console.log("my Data is ", data.data);
    InsertVerification = await InsertData(
      mainData,
      "Th_AgentsAndMoniter",
      db
    );
  }catch(error){
    console.error("error in findAgentsAndMonitorsDetails : ",error.message);
  }
}

//sage endPointagents
async function findEndPointAgents(db) {
  try {
    // const base_url = 'api.thousandeyes.com';
    const pagckageDetail = await db.collection('tbl_Package').findOne({});
    const api_url = `https://${pagckageDetail.thUrl}/v6/endpoint-agents.json`;
    let token = pagckageDetail.thAuthrization;
    let config = {
      headers: {
        'Authorization': `Bearer  ${token}`
      }
    }
    let data = await axios.get(`${api_url}`, config);
    let mainData = data.data;
    mainData['timestamp'] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    // console.log("my Data is ", data.data);
    InsertVerification = await InsertData(
      mainData,
      "Th_EndPointAgents",
      db
    );
  }catch(error){
    console.error("error in findEndPointAgents : ",error.message);
  }
}


async function findUsages(db) {
  try {
    // const base_url = 'api.thousandeyes.com';
    const pagckageDetail = await db.collection('tbl_Package').findOne({});
    const api_url = `https://${pagckageDetail.thUrl}/v6/usage.json`;
    let token = pagckageDetail.thAuthrization;
    let config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
    let data = await axios.get(`${api_url}`, config);
    let mainData = data.data;
    mainData['timestamp'] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    // console.log("my Data is ", data.data);
    InsertVerification = await InsertData(
      mainData,
      "Th_Usage",
      db
    );
    // console.log("GETTTINTKJGJJHKJHKHIKHUKHKJK",InsertVerification)
  }catch(error){
    console.error("error in findUsages : ",error.message);
  }
}

function InsertData(json, CollectionName, db) {
  let i = 0;
  return new Promise(async(resolve) => {
    let result = await db.collection(CollectionName).insertOne(json);
    resolve(result);
    i++;
  });
}

// exports.GetIncidentDetailsPSIRT = GetIncidentDetailsPSIRT;
exports.findAgentsAndMonitorsDetails = findAgentsAndMonitorsDetails;
exports.findEndPointAgents = findEndPointAgents;
exports.findUsages = findUsages;
