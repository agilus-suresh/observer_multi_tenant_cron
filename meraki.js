const axios = require("axios");
const helpers = require("./Utilities/helper");

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};
const GetNetwork = function GetNetwork(PackageData) {
  return new Promise(async(resolve) => {
    try{
      let response = await axios.get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${PackageData.OrganizationId}/networks`,
        //"https://api.meraki.com/api/v0/organizations/775051/networks",
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      resolve(response.data);
    }catch(error){
      console.log("error in GetNetwork ",error);
    }
  });
};
const GetNetworkDevices = function GetNetworkDevices(
  NetworkList,
  PackageData
) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/devices?timestamp=300`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        response.data.forEach((element) => {
          element["networkid"] = NetworkList.id;
          element["networkname"] = NetworkList.name;
        });
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("error ",error)
       })
      .finally(function () { });
  });
};
const GetPrefferedScore = function GetPrefferedScore(Device, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${Device.networkid}/devices/${Device.serial}/performance`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        resolve({ perfScore: null });
      })
      .finally(function () { });
  });
};
const GetNetworkClients = function GetNetworkClients(NetworkList, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/clients?timestamp=300`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        response.data.forEach((element) => {
          element["networkid"] = NetworkList.id;
          element["networkname"] = NetworkList.name;
        });
        resolve(response.data);
      })
      .catch(function (error) { resolve([])})
      .finally(function () { resolve([])});
  });
};
const FormatDeviceWithClients = function FormatDeviceWithClients(item) {
  item.DeviceList["ConnectedClients"] = item._ClientList.length;
  return item.DeviceList;
};
const FormatDeviceWiseDetailedReportData =
  function FormatDeviceWiseDetailedReportData(item) {
    item.DeviceList["ConnectedClients"] = item._ClientList.length;
    return item.DeviceList;
  };
const LimitDeviceListColumns = function LimitDeviceListColumns(item) {
  let obj = {};
  obj["serial"] = item.serial;
  obj["mac"] = item.mac;
  obj["lanIp"] = item.lanIp;
  obj["networkid"] = item.networkid;
  obj["model"] = item.model;
  obj["Prefscore"] = item.Prefscore;
  return obj;
};
const GetTopTenUsers = function GetTopTenUsers(ClientList) {
  return new Promise((resolve) => {
    let newClientList = [...ClientList];
    newClientList = newClientList.map(SumAndFormatClients);
    newClientList = newClientList.sort(function (a, b) {
      return b.Total - a.Total;
    });
    let obj = {};
    obj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    obj["Data"] = newClientList;
    resolve(obj);
  });
};
const GetOSWiseClients = function GetOSWiseClients(ClientList) {
  return new Promise((resolve) => {
    let newClientList = [...ClientList];
    newClientList = newClientList.map(CreateOSDetails);

    var result = newClientList.reduce(function (r, a) {
      r[a.os] = r[a.os] || [];
      r[a.os].push(a);
      return r;
    }, Object.create(null));
    let Entries = Object.entries(result);
    Entries = Entries.map(InsertArrayLength);
    Entries = Entries.sort(function (a, b) {
      return b.Length - a.Length;
    });
    let obj = {};
    obj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    obj["Data"] = Entries;
    resolve(obj);
  });
};
const GetSSIDWiseClients = function GetSSIDWiseClients(ClientList) {
  return new Promise((resolve) => {
    let newClientList = [...ClientList];
    //newClientList=newClientList.map(CreateOSDetails);

    var result = newClientList.reduce(function (r, a) {
      r[a.ssid] = r[a.ssid] || [];
      r[a.ssid].push(a);
      return r;
    }, Object.create(null));
    let Entries = Object.entries(result);
    Entries = Entries.map(InsertArrayLengthSSID);
    Entries = Entries.sort(function (a, b) {
      return b.Length - a.Length;
    });
    let obj = {};
    obj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    obj["Data"] = Entries;
    resolve(obj);
  });
};
const GetOEMWiseClients = function GetOEMWiseClients(ClientList) {
  return new Promise((resolve) => {
    let newClientList = [...ClientList];
    // newClientList=newClientList.map(CreateOSDetails);

    var result = newClientList.reduce(function (r, a) {
      r[a.manufacturer] = r[a.manufacturer] || [];
      r[a.manufacturer].push(a);
      return r;
    }, Object.create(null));
    let Entries = Object.entries(result);
    Entries = Entries.map(InsertArrayLengthOEM);
    Entries = Entries.sort(function (a, b) {
      return b.Length - a.Length;
    });
    let obj = {};
    obj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    obj["Data"] = Entries;
    resolve(obj);
  });
};
const GetLicenseDetails = function GetLicenseDetails(
  OrganizationId,
  NumberofNetwork,
  PackageData
) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${OrganizationId}/licenseState`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        var obj = {};
        obj["expirationDate"] = new Date(
          Date.parse(response.data.expirationDate)
        );
        obj["numberofNetwork"] = NumberofNetwork;
        obj["SM"] = response.data.licensedDeviceCounts["SM"];
        obj["consumed"] =
          response.data.licensedDeviceCounts["wireless"] +
          response.data.licensedDeviceCounts["Z3"] +
          response.data.licensedDeviceCounts["MX64W"] +
          response.data.licensedDeviceCounts["MX84"] +
          response.data.licensedDeviceCounts["MS220-8P"] +
          response.data.licensedDeviceCounts["MV"] +
          response.data.licensedDeviceCounts["MX64"];
        obj["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        resolve(obj);
      })
      .catch(function (error) { })
      .finally(function () { });
  });
};
const GetClientTraffic = function GetClientTraffic(NetworkList, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/traffic?timespan=86400`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        response.data.forEach((element) => {
          element["networkid"] = NetworkList.id;
          element["networkname"] = NetworkList.name;
        });
        resolve(response.data);
      })
      .catch(function (error) {
        resolve();
      })
      .finally(function () { });
  });
};
const GetAppCategory = function GetAppCategory(NetworkList, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/l7FirewallRules/applicationCategories`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        // response.data.forEach(element => {
        //   element["networkid"]=NetworkList.id;
        //   element["networkname"]=NetworkList.name;
        // });

        resolve(response.data.applicationCategories);
      })
      .catch(function (error) {
        resolve();
      })
      .finally(function () { });
  });
};
// const CheckUsageData = function CheckUsageData(data, db) {
//   return new Promise((resolve) => {
//     let myquery = {
//       timestamp: {
//         $gte: new Date(
//           new Date(
//             new Date(new Date(Date.now()).addDays(-1).setHours(0)).setMinutes(0)
//           ).setSeconds(0)
//         ),
//       },
//     };
//     console.log("herre , CheckUsageData");
//     db.collection("DataUsageByAppCategory")
//       .find(myquery)
//       .toArray(function (err, result) {
//         console.log(err , result)
//         if (err) throw err;
//         resolve(result.length);
//       });
//   });
// };

const CheckUsageData = async function CheckUsageData(data, db) {
  try {
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const myquery = {
      timestamp: { $gte: startOfYesterday },
    };

    const result = await db
      .collection("DataUsageByAppCategory")
      .find(myquery)
      .toArray();

    return result.length;
  } catch (error) {
    console.error("CheckUsageData failed:", error);
    throw new Error("Failed to check usage data");
  }
};


function SumAndFormatClients(item) {
  let obj = {};
  obj["Client"] = item.description;
  obj["IP"] = item.ip;
  obj["Sent"] = item.usage.sent / 1024;
  obj["Received"] = item.usage.recv / 1024;
  obj["Total"] = (item.usage.sent + item.usage.recv) / 1024;
  return obj;
}
function CreateOSDetails(item) {
  if (item.os === null) item.os = "Other";
  else if (item.os.toLowerCase().slice(0, 3) === "win") item.os = "Windows";
  else if (item.os.toLowerCase().slice(0, 3) === "mac") item.os = "Mac";
  else if (item.os.toLowerCase().slice(0, 3) === "andr") item.os = "Android";
  return item;
}
function InsertArrayLength(item) {
  let obj = {};
  obj["OS"] = item[0];
  //obj["Data"]=item[1];
  obj["Length"] = item[1].length;
  return obj;
}
function InsertArrayLengthSSID(item) {
  let obj = {};
  obj["SSID"] = item[0];
  //obj["Data"]=item[1];
  obj["Length"] = item[1].length;
  return obj;
}
function InsertArrayLengthOEM(item) {
  let obj = {};
  obj["OEM"] = item[0];
  //obj["Data"]=item[1];
  obj["Length"] = item[1].length;
  return obj;
}

const GetMerakiDeviceAvailability = function GetMerakiDeviceAvailability(OrganizationId, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${OrganizationId}/devices/availabilities`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("GetMerakiDeviceAvailability", error)
        resolve([])
      })
      .finally(function () { resolve([]) });
  });
};
 
 
 
const GetmerakiDeviceAlert = function GetmerakiDeviceAlert(OrganizationId, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${OrganizationId}/assurance/alerts/overview/byNetwork`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("GetmerakiDeviceuplinksLossAndLatency", error)
        resolve([])
      })
      .finally(function () { resolve([]) });
  });
};
 
 
const GetTraffic = function GetTraffic(NetworkList, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/traffic?timespan=86400`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        response.data.forEach((element) => {
          element["networkid"] = NetworkList.id;
          element["networkname"] = NetworkList.name;
        });
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("GetTraffic", {
          errorStatus : error?.response?.status,
          url: error?.response?.config?.url,
          message: error?.response?.statusText
        })
        resolve([])
      })
      .finally(function () { resolve([]) });
  });
};
 
 
const GetmerakiDeviceChannelUtilization = function GetmerakiDeviceChannelUtilization(NetworkList, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/networks/${NetworkList.id}/networkHealth/channelUtilization?timespan=600`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        response.data.forEach((element) => {
          element["networkid"] = NetworkList.id;
          element["networkname"] = NetworkList.name;
        });
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("GetmerakiDeviceuplinksLossAndLatency", error?.response?.statusText)
        resolve([])
      })
      .finally(function () { resolve([]) });
  });
};

const GetMerakiDeviceUplinkStatuses = function GetMerakiDeviceUplinkStatuses(OrganizationId, PackageData) {
  return new Promise((resolve) => {
    axios
      .get(
        `${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${OrganizationId}/appliance/uplink/statuses`,
        {
          headers: {
            "X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
          },
        }
      )
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("GetMerakiDeviceUplinkStatuses", error)
        resolve([])
      })
      .finally(function () { resolve([]) });
  });
};
 
exports.GetMerakiDeviceUplinkStatuses = GetMerakiDeviceUplinkStatuses;
exports.GetNetwork = GetNetwork;
exports.GetNetworkDevices = GetNetworkDevices;
exports.GetPrefferedScore = GetPrefferedScore;
exports.GetNetworkClients = GetNetworkClients;
exports.GetLicenseDetails = GetLicenseDetails;
exports.FormatDeviceWithClients = FormatDeviceWithClients;
exports.FormatDeviceWiseDetailedReportData = FormatDeviceWiseDetailedReportData;
exports.LimitDeviceListColumns = LimitDeviceListColumns;
exports.GetTopTenUsers = GetTopTenUsers;
exports.GetOSWiseClients = GetOSWiseClients;
exports.GetSSIDWiseClients = GetSSIDWiseClients;
exports.GetOEMWiseClients = GetOEMWiseClients;
exports.GetClientTraffic = GetClientTraffic;
exports.GetAppCategory = GetAppCategory;
exports.CheckUsageData = CheckUsageData;
exports.GetMerakiDeviceAvailability = GetMerakiDeviceAvailability;
exports.GetmerakiDeviceChannelUtilization = GetmerakiDeviceChannelUtilization;
exports.GetTraffic = GetTraffic;
exports.GetmerakiDeviceAlert = GetmerakiDeviceAlert;
