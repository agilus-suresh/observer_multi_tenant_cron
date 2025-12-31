process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
var meraki = require("./meraki");
var hardening = require("./Hardening");
var SolarWind = require("./SolarWind.js");
var servicesnow = require("./servicesnow.js");
var prime = require("./Prime.js");
var cron = require("node-cron");
const axios = require("axios");
const mongoose = require("mongoose");
const moment = require("moment");
const mailer = require("./Utilities/email_templates");
var https = require("https");
var iconv = require("iconv-lite");
var fs = require("fs");
var Psirt = require("./PSIRT.js");
const Schema = mongoose.Schema;
const ProductSchema = new Schema({}, { strict: false });
const Product = mongoose.model("Product", ProductSchema, "products");
const helpers = require("./Utilities/helper");
var dbo = null;
var db = null;
var xml2JsonParser = require('fast-xml-parser');
var xmlOptions = {
  attributeNamePrefix: "",
  ignoreAttributes: false,
  ignoreNameSpace: false,
}

var StartTime = ""; //new Date("2019-12-12T18:10:00");

var Pkg = mongoose.model("Pkg", new Schema(), "tbl_Package");
var ServiceListData = mongoose.model(
  "ServiceList",
  new Schema(),
  "TblServiceList"
);
var Criticl = mongoose.model("Criticl", new Schema(), "tbl_CriticalDevices");
var criticalTrend = mongoose.model(
  "criticalTrend",
  new Schema(),
  "CriticalDashboard"
);
var APIToken = null;
var ListCriticalDevicesFromAPI = "";
var ListCriticalDevicesFromDB = "";
var ListAllDevicesFromDB = "";
var CriticalDevicesFromDB = null;
var RawDataClientHealth = null;
var ClientHealthData = "";
var WiredWirelessData = "";
var NetworkHealthData = "";
var CWNetworkHealthData = "";
var RawNetworkHealthData = "";
var RawPhysicalTopologyData = "";
var RawSiteHealthData = "";
var RawNetworkHealthDevices = "";
var RawSWIMData = null;
var InventoryHealthData = "";
var InterfaceAvailibilityData = "";
var SWIMData = "";
var CriticalDashboardData = "";
var FormattedDeviceTopologyHealthData = null;
var PackageData = null;
let IsePostureCount = null;
let IseActiveList = null;
let IseAuthList = null;
let IseUserNameApi = null;
let IseFailureReasons = null;
let username_ise = "";
global.toolsArr = null;

var flag = false;
var toolObj2 = {};
var toolObj = {
  "DNA-C": false,
  ServiceNow: false,
  SolarWinds: false,
  "The Optimizer": false,
  Meraki: false,
  PSIRT: false,
  Prime: false,
  ISE: false,
};

var cronRunTime;
let MainTaskWithVariableTime;
let MainTask;
let DailySlaTask;
let PrimeTask;
let SolarwindCPUMemoryTrendTask;
let MerakiTask;
let HardningiTask;
let PsirtTask;
let SolarwindTask;
let CriticalTask;
let ArchieveServiceNowTask;
let ServiceNowTask;
let TimeInsertTask;
let MerakiTrafficTrendTask;
let IseTask;
let IseFailureReasonTask;
let UpdateAtMidNightTask;
let licenseExpiryNotificationTask;
let cliRepDetailUpdateTask;
let dnacSiteTopologyDataTask;

(async () => {
  var objConfigDetails = await GetConfigDetails();
  let fileRead = await GetConstantDetails();
  StartTime = fileRead;
  {
    mongoose.connect(
      `mongodb://${objConfigDetails.MongoUserName}:${objConfigDetails.MongoPassword}@${objConfigDetails.MongoConnectionString}/${objConfigDetails.MongoDataBase}?authMechanism=SCRAM-SHA-256`,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, dbs) {
        if (err) throw err;
        else {
          dbo = dbs;
          db = dbo;
          fetchToolConfig();
          checkHostOrReport();
          licenseExpiryNotificationCron().schedule = true;
          licenseExpiryNotificationCron().start();
          dnacSiteTopologyDataCron().schedule = true;
          dnacSiteTopologyDataCron().start();
          funcUpdateOauth2Tokens();
          updateOauth2AccessTokenCron().schedule = true;
          updateOauth2AccessTokenCron().start();

        }
      }
    );
    mongoose.connection.on("error", (err) => console.log(err));
    mongoose.connection.on("connected", () => { });
  }
})();

const checkHostOrReport = async () => {
  // try {
    let cliDetConfig = await getCliDetaConfig()
    if (cliDetConfig === "Report") {
      fetchCliRepoData();
    }
    cliRepDetailUpdateCron().schedule = true;
    cliRepDetailUpdateCron().start();
  // } catch (error) {
  //   console.log(error)
  // }
}

//////////////////////////////////////////////////////////////////////////
// function for checking the today date with 1 month after expiry date.
//////////////////////////////////////////////////////////////////////////

const killTheServer = async () => {
  let expiryDate = await fetchExpiryDate();
  if (expiryDate) {
    let expiryDays = await fetchDaysAfterExpiry();
    let date = new Date(expiryDate);
    date.setDate(date.getDate() + expiryDays[0].Value);
    let newDate = moment(date).format("YYYY-MM-DD");
    let currentDate = moment(new Date()).format("YYYY-MM-DD");
    if (currentDate >= newDate) {
      destroyAllCron();
      // console.log("All Cron Destroyed");
    }
  } else {
    destroyAllCron();
    // console.log("All Cron Destroyed!!!");
  }
};

// function to fetch days from TblServiceList after which we have to kill the server.
const fetchDaysAfterExpiry = async () => {
  let expiryDays = await db
    .collection("TblServiceList")
    .find({
      KeyType: "DaysAfterLicenseExpiry",
      Key: "After Days",
      CurrentlyInUse: 1,
    })
    .project({ Value: 1 })
    .toArray();
  return expiryDays;
};

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////
// Work for checking today date is date for sending mailer or not ,starts.
//////////////////////////////////////////////////////////////////////////

// cron scheduled at 7AM daily for checking today date is date for sending mailer or not.

const licenseExpiryNotificationCron = () => {
  licenseExpiryNotificationTask = cron.schedule(
    `0 7 * * *`,
    // `*/1 * * * *`,
    async () => {
      let thrChk = await licenseExpiryFirstNotificationCheck();
      if (!thrChk) {
        let secChk = await licenseExpirySecondNotificationCheck();
        if (!secChk) {
          await licenseExpiryThirdNotificationCheck();
        }
      }
    },
    { scheduled: false }
  );
  return licenseExpiryNotificationTask;
};

// functions for fetching expiry days from TblServiceList and triggering the mailer function.
const licenseExpiryFirstNotificationCheck = async () => {
  let expiryDays = await fetchExpiryDays();
  // console.log(`Running a job for ${expiryDays[0].Value1} days check`);
  let data = mailerFunction(expiryDays[0].Value1);
  return data;
};

const licenseExpirySecondNotificationCheck = async () => {
  let expiryDays = await fetchExpiryDays();
  // console.log(`Running a job for ${expiryDays[0].Value2} days check`);
  let data = mailerFunction(expiryDays[0].Value2);
  return data;
};

const licenseExpiryThirdNotificationCheck = async () => {
  let expiryDays = await fetchExpiryDays();
  // console.log(`Running a job for ${expiryDays[0].Value3} days check`);
  let data = mailerFunction(expiryDays[0].Value3);
  return data;
};

// fn to fetch expiry days interval from TblServiceList.
const fetchExpiryDays = async () => {
  let expiryDays = await db
    .collection("TblServiceList")
    .find({ KeyType: "LicenseExpiry", CurrentlyInUse: 1 })
    .toArray();
  return expiryDays;
};

// fn for fetching the expiry date from tbl_Package.
const fetchExpiryDate = async () => {
  let expiryDate = null;
  let tblPackageData = await db
    .collection("tbl_Package")
    .find({}, { LCdata: 1 })
    .toArray();
  if (tblPackageData[0].LCdata) {
    expiryDate = helpers.decrypt(tblPackageData[0].LCdata, helpers.KeyPhrase);
  }
  return expiryDate;
};

// fn to calculate the difference of the 30, 15 or 2 days.
const mailerFunction = async (expiryDays) => {
  let finalChk = 0;
  let expiryDate = await fetchExpiryDate();
  let date = new Date(expiryDate);
  date.setDate(date.getDate() - expiryDays);
  let newDate = moment(date).format("YYYY-MM-DD");
  let currentDate = moment(new Date()).format("YYYY-MM-DD");
  if (currentDate == newDate) {
    let value = await mailer.licenseExpiryNotificationEmail(db);
    if (value) {
      // console.log("License Expiration Mail sent successfully");
      finalChk = value;
    }
  }
  return finalChk;
};

///////////////////////////////////////////////////////////////////////////
// Work for checking today date is date for sending mailer or not ends.
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Process to fetch tool config  and the cron update time starts.
///////////////////////////////////////////////////////////////////////////

// function to fetch tool config to check which tool we have to put ON.
const fetchToolConfig = async () => {
  const toolsData = await db
    .collection("tbl_configurations")
    .find({})
    .toArray();
  toolsData.forEach((ele) => {
    if (ele.AllowedBySuperAdmin === true) {
      toolObj[ele.Name] = ele.AllowedBySuperAdmin;
    }
  });
  toolObj2 = { ...toolObj };
  getCronTimeInterval();
};

// start the cron according to cron time for first time.
const getCronTimeInterval = async () => {
  // try {
    const data = await Pkg.find({});
    if (data) {
      cronRunTime = parseFunction(data[0]);
      // console.log("cronRunTime", cronRunTime);
      cronTesting(cronRunTime).schedule = true;
      cronTesting(cronRunTime).start();

      {
        toolObj["DNA-C"]
          ? ((dnacTaskCron(cronRunTime).schedule = true),
            dnacTaskCron(cronRunTime).start(),
            (criticalTaskCron(cronRunTime).schedule = true),
            criticalTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["ServiceNow"]
          ? ((archieveServiceNowTaskCron(cronRunTime).schedule = true),
            archieveServiceNowTaskCron(cronRunTime).start(),
            (serviceNowTaskCron(cronRunTime).schedule = true),
            serviceNowTaskCron(cronRunTime).start(),
            (dailySlaTaskCron(cronRunTime).schedule = true),
            dailySlaTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["SolarWinds"]
          ? ((solarwindTaskCron(cronRunTime).schedule = true),
            solarwindTaskCron(cronRunTime).start(),
            (solarwindCPUMemoryTrendTaskCron(cronRunTime).schedule = true),
            solarwindCPUMemoryTrendTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["Meraki"]
          ? ((merakiTaskCron(cronRunTime).schedule = true),
            merakiTaskCron(cronRunTime).start(),
            (merakiTrafficTrendTaskCron(cronRunTime).schedule = true),
            merakiTrafficTrendTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["PSIRT"]
          ? ((psirtTaskCron(cronRunTime).schedule = true),
            psirtTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["The Optimizer"]
          ? ((hardningiTaskCron(cronRunTime).schedule = true),
            hardningiTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["Prime"]
          ? ((primeTaskCron(cronRunTime).schedule = true),
            primeTaskCron(cronRunTime).start())
          : null;
      }
      {
        toolObj["ISE"]
          ? ((iseTaskCron(cronRunTime).schedule = true),
            iseTaskCron(cronRunTime).start(),
            (iseFailureReasonTaskCron().schedule = true),
            iseFailureReasonTaskCron().start())
          : null;
      }
      timeInsertTaskCron(cronRunTime).schedule = true;
      timeInsertTaskCron(cronRunTime).start();

      cronUpdateAtMidNight(cronRunTime).schedule = true;
      cronUpdateAtMidNight(cronRunTime).start();
    }
  // } catch (error) { }
};

// fn to check for any change in tool config.
const checkToolAtMidNight = async () => {
  const toolsData = await db
    .collection("tbl_configurations")
    .find({})
    .toArray();
  let arr = toolsData.filter(
    (ele) => ele.AllowedBySuperAdmin !== toolObj[ele.Name]
  );
  if (arr.length > 0) {
    for (const property in toolObj) {
      toolObj[property] = false;
    }
    toolsData.forEach((ele) => {
      if (ele.AllowedBySuperAdmin === true) {
        toolObj[ele.Name] = ele.AllowedBySuperAdmin;
      }
    });
    // console.log("toolObj new", toolObj);
    flag = true;
  }
};

// cron for checking the change in tool config and in cron time.
const cronUpdateAtMidNight = (cronRunTime) => {
  UpdateAtMidNightTask = cron.schedule(
    // `*/10 * * * * *`,
    `0 0 * * *`,
    async () => {
      // try {
        await killTheServer();
        await checkToolAtMidNight();
        const data = await Pkg.find({});
        if (data[0]) {
          let UpdatedCronTime = parseFunction(data[0]);
          if (UpdatedCronTime != cronRunTime || flag) {
            MainTaskWithVariableTime.destroy();
            TimeInsertTask.destroy();
            {
              toolObj2["DNA-C"] === true
                ? (MainTask.destroy(), CriticalTask.destroy())
                : null;
            }
            {
              toolObj2["Prime"] === true ? PrimeTask.destroy() : null;
            }
            {
              toolObj2["The Optimizer"] === true
                ? HardningiTask.destroy()
                : null;
            }
            {
              toolObj2["SolarWinds"] === true
                ? (SolarwindTask.destroy(),
                  SolarwindCPUMemoryTrendTask.destroy())
                : null;
            }
            {
              toolObj2["ServiceNow"] === true
                ? (DailySlaTask.destroy(),
                  ArchieveServiceNowTask.destroy(),
                  ServiceNowTask.destroy())
                : null;
            }
            {
              toolObj2["Meraki"] === true
                ? (MerakiTrafficTrendTask.destroy(), MerakiTask.destroy())
                : null;
            }
            {
              toolObj2["PSIRT"] === true ? PsirtTask.destroy() : null;
            }
            {
              toolObj2["ISE"] === true
                ? (IseTask.destroy(), IseFailureReasonTask.destroy())
                : null;
            }
            toolObj2 = { ...toolObj };

            cronRunTime = UpdatedCronTime;
            cronTesting(cronRunTime).schedule = true;
            cronTesting(cronRunTime).start();
            {
              toolObj["DNA-C"] === true
                ? ((dnacTaskCron(cronRunTime).schedule = true),
                  dnacTaskCron(cronRunTime).start(),
                  (criticalTaskCron(cronRunTime).schedule = true),
                  criticalTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["ServiceNow"] === true
                ? ((archieveServiceNowTaskCron(cronRunTime).schedule = true),
                  archieveServiceNowTaskCron(cronRunTime).start(),
                  (serviceNowTaskCron(cronRunTime).schedule = true),
                  serviceNowTaskCron(cronRunTime).start(),
                  (dailySlaTaskCron(cronRunTime).schedule = true),
                  dailySlaTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["SolarWinds"] === true
                ? ((solarwindTaskCron(cronRunTime).schedule = true),
                  solarwindTaskCron(cronRunTime).start(),
                  (solarwindCPUMemoryTrendTaskCron(
                    cronRunTime
                  ).schedule = true),
                  solarwindCPUMemoryTrendTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["Meraki"] === true
                ? ((merakiTaskCron(cronRunTime).schedule = true),
                  merakiTaskCron(cronRunTime).start(),
                  (merakiTrafficTrendTaskCron(cronRunTime).schedule = true),
                  merakiTrafficTrendTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["PSIRT"] === true
                ? ((psirtTaskCron(cronRunTime).schedule = true),
                  psirtTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["The Optimizer"] === true
                ? ((hardningiTaskCron(cronRunTime).schedule = true),
                  hardningiTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["Prime"] === true
                ? ((primeTaskCron(cronRunTime).schedule = true),
                  primeTaskCron(cronRunTime).start())
                : null;
            }
            {
              toolObj["ISE"] === true
                ? ((iseTaskCron(cronRunTime).schedule = true),
                  iseTaskCron(cronRunTime).start(),
                  (iseFailureReasonTaskCron().schedule = true),
                  iseFailureReasonTaskCron().start())
                : null;
            }

            timeInsertTaskCron(cronRunTime).schedule = true;
            timeInsertTaskCron(cronRunTime).start();
            flag = false;
          }
        }

      // } catch (error) { }
    },
    { scheduled: false }
  );
  return UpdateAtMidNightTask;
};

// fn to parse the cron time for making it ready to work.
const parseFunction = (doc) => {
  let parseData = JSON.parse(JSON.stringify(doc)).cronUpdateTime;
  return parseData;
};

// function for cron testing purpose.
const cronTesting = (a) => {
  console.log("hi", a);
  MainTaskWithVariableTime = cron.schedule(
    `*/${a} * * * *`,
    () => {
      console.log(
        `Running a job after ${a} ${new Date().getTime()} ${moment().format()}`
      );
    },
    { scheduled: false }
  );
  return MainTaskWithVariableTime;
};

const destroyAllCron = async () => {
  MainTaskWithVariableTime.destroy();
  TimeInsertTask.destroy();
  {
    toolObj["DNA-C"] === true
      ? (MainTask.destroy(), CriticalTask.destroy())
      : null;
  }
  {
    toolObj["Prime"] === true ? PrimeTask.destroy() : null;
  }
  {
    toolObj["The Optimizer"] === true ? HardningiTask.destroy() : null;
  }
  {
    toolObj["SolarWinds"] === true
      ? (SolarwindTask.destroy(), SolarwindCPUMemoryTrendTask.destroy())
      : null;
  }
  {
    toolObj["ServiceNow"] === true
      ? (DailySlaTask.destroy(),
        ArchieveServiceNowTask.destroy(),
        ServiceNowTask.destroy())
      : null;
  }
  {
    toolObj["Meraki"] === true
      ? (MerakiTrafficTrendTask.destroy(), MerakiTask.destroy())
      : null;
  }
  {
    toolObj["PSIRT"] === true ? PsirtTask.destroy() : null;
  }
  {
    toolObj["ISE"] === true
      ? (IseTask.destroy(), IseFailureReasonTask.destroy())
      : null;
  }
  licenseExpiryNotificationTask.destroy();
  cliRepDetailUpdateTask.destroy();
  UpdateAtMidNightTask.destroy();
};
////////////////////////////////////////////////////////////////////////////
// Process to fetch tool config  and the cron update time ends.
////////////////////////////////////////////////////////////////////////////

function GetConfigDetails() {
  return new Promise((resolve) => {
    var ReadData = fs.readFile(
      "observer_node_url.txt",
      { encoding: "utf-8" },
      function (err, data) {
        axios
          .get(JSON.parse(data).ConfigUrl, {
            headers: { __runsync: "true", __timeout: "10" },
          })
          .then(function (response) {
            var Dec_Pass = helpers.decrypt(response.data, helpers.KeyPhrase);

            resolve(JSON.parse(Dec_Pass));
          })
          .catch(function (error) {
            // handle error
            resolve("");
          })
          .finally(function () {
            // always executed
          });
      }
    );
  });
}

function GetConstantDetails() {
  return new Promise((resolve) => {
    var ReadData = fs.readFile(
      "observer_time.txt",
      { encoding: "utf-8" },
      function (err, data) {
        resolve(JSON.parse(data).startTime);
      }
    );
  });
}
var config = {
  user: "sa",
  password: "Velocis@123",
  server: "DES191\\SQLEXPRESS",
  database: "SolarWindsOrion_Demo",
};
const CriticalDeviceSchema = new mongoose.Schema({
  Device_Name: String,
  IP: String,
  Mac_Address: String,
  Role: String,
  Action: String,
  timestamp: Date,
});

const CriticalDevice = mongoose.model(
  "tbl_criticaldevices",
  CriticalDeviceSchema
);
// connect to your database

function getMinCpuScore(data) {
  if (data.length > 0) {
    return data.reduce(
      (min, p) => (p.cpuScore < min ? p.cpuScore : min),
      data[0].cpuScore
    );
  } else return 0;
}
function getMaxCpuScore(data) {
  if (data.length > 0) {
    return data.reduce(
      (max, p) => (p.cpuScore > max ? p.cpuScore : max),
      data[0].cpuScore
    );
  } else return 0;
}
function getMinMemoryScore(data) {
  if (data.length > 0) {
    return data.reduce(
      (min, p) => (p.memoryScore < min ? p.memoryScore : min),
      data[0].memoryScore
    );
  } else return 0;
}
function getMaxMemoryScore(data) {
  if (data.length > 0) {
    return data.reduce(
      (max, p) => (p.memoryScore > max ? p.memoryScore : max),
      data[0].memoryScore
    );
  } else return 0;
}
function getMinOverallHealth(data) {
  if (data.length > 0) {
    return data.reduce(
      (min, p) => (p.overallHealth < min ? p.overallHealth : min),
      data[0].overallHealth
    );
  } else return 0;
}
function getMaxOverallHealth(data) {
  if (data.length > 0) {
    return data.reduce(
      (max, p) => (p.overallHealth > max ? p.overallHealth : max),
      data[0].overallHealth
    );
  } else return 0;
}
function getAvgCpuScore(data) {
  if (data.length > 0) {
    var sum = data
      .map((item) => item.cpuScore)
      .reduce((prev, next) => prev + next);
    if (sum > 0) {
      return sum / data.length;
    } else return 0;
  } else return 0;
}
function getAvgmemoryScore(data) {
  var sum = 0;
  if (data.length > 0) {
    sum = data
      .map((item) => item.memoryScore)
      .reduce((prev, next) => prev + next);
  }
  if (sum > 0) {
    return sum / data.length;
  } else return 0;
}
function getAvgOverallHealth(data) {
  var sum = 0;
  if (data.length > 0) {
    sum = data
      .map((item) => item.overallHealth)
      .reduce((prev, next) => prev + next);
  }
  if (sum > 0) {
    return sum / data.length;
  } else return 0;
}
function CreateCriticalDeviceTrend(item) {
  var MinCPUHealth = getMinCpuScore(item);
  var MaxCPUHealth = getMaxCpuScore(item);
  var MinMemoryHealth = getMinMemoryScore(item);
  var MaxMemoryHealth = getMaxMemoryScore(item);
  var MinOverallHealth = getMinOverallHealth(item);
  var MaxOverallHealth = getMaxOverallHealth(item);
  var AvgCpuScore = getAvgCpuScore(item);
  var AvgmemoryScore = getAvgmemoryScore(item);
  var AvgoverallHealth = getAvgOverallHealth(item);
  var element = {};
  element["Role"] = item[0].nwDeviceRole;
  element["DeviceName"] = item[0].nwDeviceName;
  element["MACAddress"] = item[0].macAddress;
  (element["MinCPUHealth"] = MinCPUHealth),
    (element["MaxCPUHealth"] = MaxCPUHealth),
    (element["MinMemoryHealth"] = MinMemoryHealth),
    (element["MaxMemoryHealth"] = MaxMemoryHealth),
    (element["MinOverallHealth"] = MinOverallHealth),
    (element["MaxOverallHealth"] = MaxOverallHealth),
    (element["CPUHealth"] = AvgCpuScore),
    (element["MemoryHealth"] = AvgmemoryScore),
    (element["OverallHealth"] = AvgoverallHealth);
  return element;
}

const iseFailureReasonTaskCron = () => {
  IseFailureReasonTask = cron.schedule(
    // `*/5 * * * * *`,
    `0 0 1 * *`,
    // `*/${2} * * * *`,
    async () => {
      // console.log("Inside Failure ISE tool");
      let PackageData = await GetPackageDetailFromDB();
      const config = {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              PackageData[0].ISEUserName + ":" + PackageData[0].ISEPassword
            ).toString("base64"),
        },
      };
      IseFailureReasons = await GetIseISEFailureReasonsApi(
        PackageData[0].ISEFailureReasonsApi,
        config
      );
      await InsertData(IseFailureReasons, "ISEFailureReasons", db);
    },
    {
      scheduled: false,
    }
  );
  return IseFailureReasonTask;
};

const iseTaskCron = (a) => {
  IseTask = cron.schedule(
    `*/${a} * * * *`,
    async () => {
      // console.log("Inside ISE tool");
      let PackageData = await GetPackageDetailFromDB();
      const config = {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              PackageData[0].ISEUserName + ":" + PackageData[0].ISEPassword
            ).toString("base64"),
        },
      };

      /////////////////////////////////////////////////////////////////////
      // This code is commented as this code can be used in future.
      /////////////////////////////////////////////////////////////////////

      // IsePostureCount = await GetIsePostureCount(
      //   PackageData[0].ISEPostureCount,
      //   config,
      //   db
      // );
      // IseAuthList = await GetIseAuthList(PackageData[0].ISEAuthList, config);
      // IseUserNameApi = await GetIseUserNameApi(
      //   PackageData[0].ISEUserNameApi,
      //   config
      // );

      //////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////

      const vipConfigStatus = await getVipConfigStatus();

      if (vipConfigStatus && vipConfigStatus[0] && vipConfigStatus[0].Value === true) {
        await getVipPostureData(config, a);
      }
    },
    {
      scheduled: false,
    }
  );
  return IseTask;
};

const dnacTaskCron = (a) => {
  MainTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Dnac tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          // try {
            await buildGlobalToolsArr();
            await connectivityOperations()
            /* var persons=[{id:1,Name:'Person1'},{id:2,Name:'Person2'},{id:3,Name:'Person3'}];
          var addresses=[{id:1,City:'Delhi'},{id:4,City:'Mumbai'},{id:3,City:'Chennai'}];
 
          var DataNew= persons.reduce((result, person) =>
          result.concat([{
              Person: person,
              Addresses: addresses.filter((a) => a.id === person.id)
          }]), [])
          */

            /*
          var DataNew=persons.reduce((result, person) =>
          result.concat([{
          Person: person,
          Addresses: addresses.filter((a) => a.id === person.id)
          }]), [])
          .filter((pa) => pa.Addresses.length)
            */
            let cliDetConfig = await getCliDetaConfig();

            APIToken = await GetToken();

            RawNetworkHealthDevices = await GetDeviceFromAPI(APIToken);
            RawPhysicalTopologyData = await GetPhysicalTopologyData(APIToken, db);
            RawSiteHealthData = await GetRawSiteHealthData(APIToken, db);

            let SiteHealthRadar = await SiteHealthRadarData(RawSiteHealthData);
            SiteHealthRadarObj = {};
            SiteHealthRadarObj["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );

            SiteHealthRadarObj["recordSet"] = SiteHealthRadar;
            InsertVerification = await InsertData(
              SiteHealthRadarObj,
              "SiteHealthRadar",
              db
            );
            RawSiteHealthDataObj = {};
            RawSiteHealthDataObj["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            RawSiteHealthDataObj["Data"] = RawSiteHealthData;
            InsertVerification = await InsertData(
              RawSiteHealthDataObj,
              "SiteHealthTopology",
              db
            );

            var DataNew2 = RawNetworkHealthDevices.reduce(
              (result, rawNetworkHealthDevice) =>
                result.concat([
                  {
                    RawNetworkHealthDevice: rawNetworkHealthDevice,
                    _RawPhysicalTopologyData: RawPhysicalTopologyData.filter(
                      (a) => a.macAddress === rawNetworkHealthDevice.macAddress
                    ),
                  },
                ]),
              []
            ).filter((pa) => pa._RawPhysicalTopologyData.length);

            const FormattedJoinedData = DataNew2.map(
              createDeviceTopologyFormating
            );

            var DataNew3 = FormattedJoinedData.reduce(
              (result, FD) =>
                result.concat([
                  {
                    FormattedData: FD,
                    SiteHealthData: RawSiteHealthData.filter(
                      (a) => a.siteId === FD.siteid
                    ),
                  },
                ]),
              []
            );

            FormattedDeviceTopologyHealthData = DataNew3.map(
              createDeviceTopologyHealthFormating
            );

            InterfaceAvailibilityData = await GetInterfaceAvailibility(
              APIToken,
              FormattedDeviceTopologyHealthData
            );
            InsertVerification = await InsertData(
              InterfaceAvailibilityData,
              "InterfaceAvailibility",
              db
            );

            SWIMData = await GetSWIMData(APIToken);
            InsertVerification = await InsertData(SWIMData, "SWIM", db);

            /* ListCriticalDevicesFromAPI=await GetDeviceFromAPI(APIToken);
        ListCriticalDevicesFromDB=await GetDeviceFromDB();
        UpdateDataInCriticalDevices();
        */

            var InsertVerification = null;
            ClientHealthData = await GetClientBreakUp_Health(APIToken);
            InsertVerification = await InsertData(
              ClientHealthData,
              "clienthealth",
              db
            );

            WiredWirelessData = await GetWiredWireless(APIToken);
            InsertVerification = await InsertData(
              WiredWirelessData,
              "WiredWireless",
              db
            );

            NetworkHealthData = await GetNetworkHealth(APIToken);
            InsertVerification = await InsertData(
              NetworkHealthData,
              "NetworkHealth",
              db
            );

            CWNetworkHealthData = await GetCWNetworkHealth(APIToken);
            InsertVerification = await InsertData(
              CWNetworkHealthData,
              "CWNetworkHealth",
              db
            );

            // await GetCWNetworkHealthDrillData(APIToken.Token);

            InventoryHealthData = await GetInventoryHealth(APIToken);
            InsertVerification = await InsertData(
              InventoryHealthData,
              "InventoryHealth",
              db
            );

            InventoryHealthDataDrilldown = await GetInventoryHealthDrillDown(
              APIToken
            );
            InsertVerification = await InsertData(
              InventoryHealthDataDrilldown,
              "InventoryHealthDrilDown",
              db
            );

            /*
       var siteHealthdata = await GetSiteHealthData(APIToken);
    */

            var siteHealthdata = await GetSiteHealthData(APIToken);
            InsertVerification = await InsertData(
              siteHealthdata,
              "SiteHealth",
              db
            );

            /*
       SWIMData=await GetSWIMData(APIToken);
       InsertVerification=await InsertData(SWIMData,'SWIM',db);
      */

            ListAllDevicesFromDB = await GetAllDevicesFromDB();

            //////////////////////////////////
            //////////////////////////////////
            CriticalDevicesFromDB = await GetCriticalDevicesFromDB(APIToken);
            //////////////////////////////////
            //////////////////////////////////
            var GlobalTimestamp = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            var CriticalDeviceDetail = [];
            for (var bb = 0; bb < CriticalDevicesFromDB.length; bb++) {
              var tempdata = await GetCriticalDeviceDetailByAPI(
                CriticalDevicesFromDB[bb]
              );
              if (tempdata != undefined) CriticalDeviceDetail.push(tempdata);
            }
            var CriticalDashboardData = await createCriticalDashboardData(
              CriticalDeviceDetail,
              GlobalTimestamp
            );
            InsertVerification = await InsertData(
              CriticalDashboardData,
              "CriticalDashboard",
              db
            );

            UpdateDataInDeviceList();

            if (cliDetConfig && cliDetConfig === "Host") {
              ClientHealthDataDrill = await GetClientBreakUp_HealthDrillDown(
                APIToken, cliDetConfig
              );
            } else if (cliDetConfig && cliDetConfig === "Report") {
              ClientHealthDataDrill = await clientReportExecApis(APIToken, PackageData, a, cliDetConfig);
            }

            InsertVerification = await InsertData(
              ClientHealthDataDrill,
              "ClientHealthDataDrill",
              db
            );
            const vipConfigStatus = await getVipConfigStatus();

            if (vipConfigStatus && vipConfigStatus[0] && vipConfigStatus[0].Value === true) {
              if (ClientHealthDataDrill) {
                await updateVipMappingData(ClientHealthDataDrill);
              }
              await getClientDetails();
              await clientHealthDropEmailer();
            }

            const dnacIssueData = await getDNACIssueData(APIToken.Token, db, PackageData[0], a);
            await getIssueDrillDownData(APIToken, dnacIssueData);
            await networkIssueEmailer();

            await buildApplicationHealthData(APIToken.Token)
          // } catch (err) {
            // console.log(err);
          // }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return MainTask;
};

const hardningiTaskCron = (a) => {
  HardningiTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Hardening tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          var HardeningDataList = null;
          var ClientList = [];
          var DeviceList = [];
          try {
            HardeningDataList = await hardening.GetHardeningData(
              PackageData,
              db
            );
            // let hardeningTemplateData = HardeningDataList.filter(a => a.templets_name == "TheObserver");

            // let hardeningTemplateData = HardeningDataList.filter(a => a.templets_name == "VSPL_T10");

            // new Date(Math.max.apply(null, hardeningTemplateData.map(function (e) {
            //   return new Date(e.date_added);
            // })));
            // var resultok = groupBy(hardeningTemplateData, function (item) {
            //   return [item.device_type];
            // });

            new Date(
              Math.max.apply(
                null,
                HardeningDataList.map(function (e) {
                  return new Date(e.date_added);
                })
              )
            );
            var resultok = groupBy(HardeningDataList, function (item) {
              return [item.device_id];
            });

            //let drillData = resultok;

            HardeningDataListDrillDown = await hardening.GetHardeningDrillDown(
              PackageData,
              resultok
            );

            let drillDownData = {};
            drillDownData["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            drillDownData.recordset = HardeningDataListDrillDown;
            InsertVerification = await InsertData(
              drillDownData,
              "HardeningCompilanceDrillDown",
              db
            );

            counterMain = 0;
            innerCounterOne = 0;
            innerCounterZero = 0;
            let finalCountOne = 0;
            let finalCountZero = 0;
            let object = {};
            let complaintData = [];
            for (let i = 0; i < resultok.length; i++) {
              resultok[i].map((item) => {
                counterMain = counterMain + 1;
                // if( item.command_output == '0'){
                //   innerCounterZero=innerCounterZero+1
                // }
                if (
                  item.command_param_output ==
                  "1" /* item.command_output == '1' */
                ) {
                  innerCounterOne = innerCounterOne + 1;
                } else {
                  innerCounterZero = innerCounterZero + 1;
                }
              });

              //  if(counterMain==innerCounterZero){
              //   finalCountZero=finalCountZero+1
              //   // counterMain=0;
              // }
              if (counterMain == innerCounterOne) {
                finalCountOne = finalCountOne + 1;
              } else {
                finalCountZero = finalCountZero + 1;
              }

              object = {
                complaint: finalCountOne,
                nonComplaint: finalCountZero,
              };
              counterMain = 0;
              innerCounterZero = 0;
              innerCounterOne = 0;
            }
            object["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            // InsertHardningData = await InsertData(object, "e", db);
            InsertVerification = await InsertData(
              object,
              "HardeningCompilance",
              db
            );
          } catch (err) {
            // console.log(err);
          }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return HardningiTask;
};

const primeTaskCron = (a) => {
  PrimeTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Prime tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          var APWiseDataList = null;
          var RoguedAPInter = [];
          var DeviceList = [];
          try {
            APWiseDataList = await prime.GetAPwiseAvgPeakThroughput(
              PackageData
            );
            let throughData = [];
            let objectFinalData = {};
            let objectData = {};

            await APWiseDataList.map((item) => {
              let frequency;
              if (
                item["Radio Type"] == "802.11a/n/ac" ||
                item["Radio Type"] == "XOR (2.4GHz)"
              ) {
                frequency = "2.4";
              } else {
                frequency = "5";
              }
              objectData = {
                AP_MACAddress: item["AP MACAddress"],
                AP_Name: item["AP Name"],
                Average_RSSI: item["Average RSSI (dBm)"],
                Radio_Type: item["Radio Type"],
                Peak_Throughput: item["Peak Throughput(Mbps)"],
                Average_Throughput: item["Average Throughput(Mbps)"],
                Peak_RSSI: item["Peak RSSI (dBm)"],
                Peak_SNR: item["Peak SNR (dB)"],
                Average_SNR: item["Average SNR (dB)"],
                frequency: frequency,
              };
              throughData.push(objectData);
            });
            var throughGroupData = groupBy(throughData, function (item) {
              return [item.AP_Name];
            });
            let mainCounterforRadioType = 0;
            let mainCounterXORType = 0;
            let AllData = [];
            for (let i = 0; i < throughGroupData.length; i++) {
              throughGroupData[i].map((item) => {
                AP_Name = item.AP_Name;
                if (item.Radio_Type == "802.11a/n/ac") {
                  mainCounterforRadioType = mainCounterforRadioType + 1;
                }
                if (
                  item.Radio_Type == "802.11b/g/n" ||
                  item.Radio_Type == "XOR (2.4GHz)"
                ) {
                  mainCounterXORType = mainCounterXORType + 1;
                }
              });
              let obj = {
                AP_Name: AP_Name,
                radioCounterFirst: mainCounterforRadioType,
                radioCounterSecond: mainCounterXORType,
              };
              AllData.push(obj);
              mainCounterforRadioType = 0;
              mainCounterXORType = 0;
            }
            objectFinalData.AllData = AllData;
            objectFinalData["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            let objectthroughputData = {};
            objectthroughputData["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objectthroughputData.throughData = throughData;
            InsertVerification = await InsertData(
              objectFinalData,
              "APwiseAvgPeakThroughput",
              db
            );
            InsertVerification = await InsertData(
              objectthroughputData,
              "APwiseAvgPeakThroughputDrillDown",
              db
            );

            RoguedAPInter = await prime.RoguedAPInterferenceReport(
              PackageData,
              db
            );
            var RoguedAPInterference = groupBy(RoguedAPInter, function (item) {
              return item["Detecting AP Name"];
            });
            let detect_app_name;
            let roughData = [];
            for (let i = 0; i < RoguedAPInterference.length; i++) {
              RoguedAPInterference[i].map((item) => {
                detect_app_name = item["Detecting AP Name"];
              });

              let obj = {
                detect_app_name: detect_app_name,
                detect_app_count: RoguedAPInterference[i].length,
              };
              roughData.push(obj);
            }

            let roughApiData = {};
            roughApiData.RoguedAPInter = roughData;
            roughApiData["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
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
            obj.RoguedAPInter = RoguedAPInter;
            InsertVerification = await InsertData(
              roughApiData,
              "RoguedAPInterferenceReport",
              db
            );
            InsertVerification = await InsertData(
              obj,
              "RoguedAPInterferenceReportDrillDown",
              db
            );
          } catch (err) {
            // console.log(err);
          }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return PrimeTask;
};

validateUniqueData = (data, newElement) => {
  for (let ele of data) {
    if (
      newElement.softwareVersion === ele.softwareVersion &&
      newElement.series === ele.series
    ) {
      return true;
    }
  }
  return false;
};

getUniqueAdvisoryData = (data) => {
  let advisoryDataArray = {};
  // for (let ele of data) {
  //   const entityId = `${ele.series}_${ele.softwareVersion}_${ele.advisoryId}`;
  //   if (!advisoryDataArray[entityId]) {
  //     advisoryDataArray[entityId] = ele;
  //   }
  // }
  // let finalData =[];
  // finalData = Object.values(advisoryDataArray);
  // return finalData;
  for (let ele of data) {
    const entityId = ele.advisoryId;
    if (!advisoryDataArray[entityId]) {
      const obj = {
        advisoryTitle: ele.advisoryTitle,
        summary: ele.summary,
        advisoryId: ele.advisoryId,
        timestamp: ele.timestamp,
        AdvisorylastUpdated: ele.lastUpdated,
        sir: ele.sir,
        cvssBaseScore: ele.cvssBaseScore,
        deviceData: [
          {
            softwareVersion: ele.softwareVersion,
            series: ele.series,
            softwareType: ele.softwareType,
            deviceLastUpdated: ele.lastUpdated,
            serialNumber: ele.serialNumber,
            family: ele.family,
            hostname: ele.hostname,
            platformId: ele.platformId,
            reachabilityStatus: ele.reachabilityStatus,
            role: ele.role,
          },
        ],
      };

      advisoryDataArray[entityId] = obj;
    } else {
      const deviceData = advisoryDataArray[entityId]["deviceData"];
      const isUnique = validateUniqueData(deviceData, ele);
      if (!isUnique) {
        advisoryDataArray[entityId]["deviceData"].push({
          softwareVersion: ele.softwareVersion,
          series: ele.series,
          softwareType: ele.softwareType,
          deviceLastUpdated: ele.lastUpdated,
          serialNumber: ele.serialNumber,
          family: ele.family,
          hostname: ele.hostname,
          platformId: ele.platformId,
          reachabilityStatus: ele.reachabilityStatus,
          role: ele.role,
        });
      }
    }
  }
  const finalData = Object.values(advisoryDataArray) || [];
  return finalData;
};

const psirtTaskExecutor = () => {
  const PackageConnection = (async () => {
    // console.log("Inside PSIRT Cron");
    var PackageData = await GetPackageDetailFromDB();
    const Main = (async () => {
      var APWiseDataList = null;
      var RoguedAPInter = [];
      var DeviceList = [];
      let resultData;
      let APIToken = await GetToken();
      try {
        PsirtWiseDataList = await Psirt.GetTokenPSIRT(PackageData, db);

        PsirtDataList = await Psirt.GetAdvisoryPSIRT(
          PackageData,
          PsirtWiseDataList
        );
        // fs.writeFile('/home/kuldeep/data/Shikha/Velocis/Observer_Project/Work logs/PSIRT troubleshoot-20 Aug 2020/PSIRT_Advisory_Data.txt', JSON.stringify(PsirtDataList), (err) => {})
        // var deviceData = [{
        //   series: "Cisco Small Business 250 Series Smart Switches Sof",
        //   snmpContact: "",
        //   snmpLocation: "Near Washroom",
        //   softwareType: null,
        //   softwareVersion: "8.8.125.0",
        //   tagCount: "0",
        //   tunnelUdpPort: "16666",
        //   type: "Cisco 2700I Unified Access Point",
        //   upTime: "01:05:40.480",
        //   waasDeviceMode: null
        // },
        // {
        //   series: "Cisco Small Business 250 Series Smart Switches Sof",
        //   snmpContact: "",
        //   snmpLocation: "Near Washroom",
        //   softwareType: null,
        //   softwareVersion: "8.8.125.0",
        //   tagCount: "0",
        //   tunnelUdpPort: "16666",
        //   type: "Cisco 2700I Unified Access Point",
        //   upTime: "01:05:40.480",
        //   waasDeviceMode: null
        // }, {
        //   series: "Cisco Small Business 350X Series Managed Switches",
        //   snmpContact: "",
        //   snmpLocation: "Near Washroom",
        //   softwareType: null,
        //   softwareVersion: "8.8.125.0",
        //   tagCount: "0",
        //   tunnelUdpPort: "16666",
        //   type: "Cisco 2700I Unified Access Point",
        //   upTime: "01:05:40.480",
        //   waasDeviceMode: null
        // }
        // ]
        // var test = [{
        //   'advisoryId': "cisco-sa-20200129-smlbus-switch-disclos",
        //   'advisoryTitle': "Cisco Small Business Switches Information Disclosure Vulnerability",
        //   'bugIDs': Array(2)["CSCvr54104", "CSCvs68748"],
        //   'cves': Array(1)["CVE-2019-15993"],
        //   'cvssBaseScore': "7.5",
        //   'cwe': Array(1)["CWE-16"],
        //   'firstPublished': "2020-01-29T16:00:00-0800",
        //   'ipsSignatures': Array(1)["NA"],
        //   'lastUpdated': "2020-01-29T16:00:00-0800",
        //   'productNames': [
        //     "Cisco Small Business 250 Series Smart Switches Sof",
        //     "Cisco Small Business 350 Series Managed Switches S…",
        //     "Cisco Small Business 350X Series Managed Switches ",
        //   ],
        //   'sir': 'High'
        // }, {
        //   'advisoryId': "cisco-sa-20200129-smlbus-switch-disclos",
        //   'advisoryTitle': "Cisco Small Business Switches Information Disclosure Vulnerability",
        //   'bugIDs': Array(2)["CSCvr54104", "CSCvs68748"],
        //   'cves': Array(1)["CVE-2019-15993"],
        //   'cvssBaseScore': "7.5",
        //   'cwe': Array(1)["CWE-16"],
        //   'firstPublished': "2020-01-29T16:00:00-0800",
        //   'ipsSignatures': Array(1)["NA"],
        //   'lastUpdated': "2020-01-29T16:00:00-0800",
        //   'productNames': [
        //     "Cisco Small Business 250 Series Smart Switches Sof…xyz",
        //     "Cisco Small Business 350 Series Managed Switches S…",
        //     "Cisco Small Business 350X Series Managed Switches …",
        //   ],
        //   'sir': 'Medium'
        // }]
        let RawNetworkHealthDevices = await GetDeviceFromAPI(APIToken);
        let commonArray = [];
        let devicelist = [];

        let IncidentDetailsData = await Psirt.GetIncidentDetailsPSIRT(
          PackageData
        );

        let collectionData = await db
          .collection("PSIRTAdvisoriesDeviceWiseDrillDown")
          .find({})
          .toArray();

        const deviceData = await db
          .collection("InventoryHealthDrilDown")
          .find({})
          .sort({ timestamp: -1 })
          .limit(1)
          .toArray();

        deviceData[0].Data.forEach((item) => {
          for (let i = 0; i < PsirtDataList.length; i++) {
            const advisoryData = PsirtDataList[i];
            if (
              advisoryData.productNames.join("##").includes(item.series) ||
              advisoryData.productNames
                .join("##")
                .includes(item.softwareVersion)
            ) {
              let obj = {
                softwareType: item.softwareType,
                softwareVersion: item.softwareVersion,
                deviceLastUpdated: item.lastUpdated,
                series: item.series,
                advisoryTitle: advisoryData.advisoryTitle,
                summary: advisoryData.summary,
                advisoryId: advisoryData.advisoryId,
                timestamp: advisoryData.timestamp,
                AdvisorylastUpdated: advisoryData.lastUpdated,
                sir: advisoryData.sir,
                cvssBaseScore: advisoryData.cvssBaseScore,
                serialNumber: item.serialNumber,
                family: item.family,
                hostname: item.hostname,
                platformId: item.platformId,
                reachabilityStatus: item.reachabilityStatus,
                role: item.role,
                // incidentId: IncidentDetailsData.result.number,
                // incident_state: IncidentDetailsData.result.incident_state
              };
              commonArray.push(obj);
            }
          }
          //   PsirtDataList.map(advisoryData => {
          //  // collectionData.map(existsItem => {
          //  //   if(existsItem &&existsItem.commonArray.length!=0){

          // //   existsItem.commonArray.map(value => {

          //    // if (value.series != item.series && value.advisoryTitle != values.advisoryTitle && value.incident_state != '6' && value.incident_state != '7') {

          //     if (advisoryData.productNames.join('##').includes(item.series)
          //     || advisoryData.productNames.join('##').includes(item.softwareVersion)) {

          //       let obj = {
          //         softwareType: item.softwareType,
          //         softwareVersion: item.softwareVersion,
          //         deviceLastUpdated: item.lastUpdated,
          //         series: item.series,
          //         advisoryTitle: advisoryData.advisoryTitle,
          //         summary: advisoryData.summary,
          //         advisoryId: advisoryData.advisoryId,
          //         timestamp: advisoryData.timestamp,
          //         AdvisorylastUpdated: advisoryData.lastUpdated,
          //         sir: advisoryData.sir,
          //         cvssBaseScore: advisoryData.cvssBaseScore,
          //         // incidentId: IncidentDetailsData.result.number,
          //         // incident_state: IncidentDetailsData.result.incident_state
          //       }
          //       commonArray.push(obj);
          //     } else {
          //       console.log("Value not exists!")
          //     }

          //      }
          // })
          // }
          //  })
          // })
        });

        commonArray = getUniqueAdvisoryData(commonArray);

        //....PSIRT drill down start ......
        let dataPASIRT = {};
        dataPASIRT.commonArray = commonArray;
        dataPASIRT["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        // let collectionData = await db.collection('PSIRTAdvisoriesDeviceWiseDrillDown').find({}).toArray();
        // collectionData.map(existsItem => {
        //   existsItem.commonArray.map(value => {
        //     if (value.series != item.series && value.advisoryTitle != values.advisoryTitle && value.incident_state != '6' && value.incident_state != '7') {
        //       // InsertVerification = await InsertData(dataPASIRT, "PSIRTAdvisoriesDeviceWiseDrillDown", db);
        //     }
        //   })
        // })
        InsertVerification = await InsertData(
          dataPASIRT,
          "PSIRTAdvisoriesDeviceWiseDrillDown",
          db
        );
        //....END.....

        //Fetching all device details
        const allDeviceData = [];
        commonArray.map((element) => {
          let deviceData = element.deviceData;
          deviceData.map((ele) => (ele.sir = element.sir));
          allDeviceData.push(...deviceData);
        });

        var commonArrayData = groupBy(
          allDeviceData /* commonArray */,
          function (item) {
            return [item.series];
          }
        );

        let totalCount = 0;
        let psirtData = [];
        highCount = 0;
        mediumCount = 0;
        criticalCount = 0;
        for (let i = 0; i < commonArrayData.length; i++) {
          commonArrayData[i].map((item) => {
            if (item.sir == "High") {
              highCount = highCount + 1;
            }
            if (item.sir == "Medium") {
              mediumCount = mediumCount + 1;
            }
            if (item.sir == "Critical") {
              criticalCount = criticalCount + 1;
            }
            device_name = item.series;
            device_softwareVersion = item.softwareVersion;
          });
          psirtData.push({
            device_name: device_name,
            device_softwareVersion: device_softwareVersion,
            totalCount: commonArrayData[i].length,
            highCount: highCount,
            mediumCount: mediumCount,
            criticalCount: criticalCount,
          });
          highCount = 0;
          mediumCount = 0;
          criticalCount = 0;
        }
        let data = {};
        data["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        data.psirtData = psirtData;

        InsertVerification = await InsertData(
          data,
          "PSIRTAdvisoriesDeviceWise",
          db
        );
      } catch (err) {
        console.error(err);
      }
    })();
  })();
};

const psirtTaskCron = (a) => {
  PsirtTask = cron.schedule(
    "0 6 * * 4",
    // "30 12 * * 3",
    // console.log("Inside psirt tool"),
    psirtTaskExecutor,
    {
      scheduled: false,
    }
  );
  return PsirtTask;
};

const merakiTaskCron = (a) => {
  MerakiTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Meraki tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          var NetworkList = null;
          var ClientList = [];
          var DeviceList = [];
          try {
            NetworkList = await meraki.GetNetwork(PackageData, db);
            NetworkList = NetworkList.filter(
              (a) => a.type != "systems manager"
            );
            // DeviceList=await meraki.GetNetworkDevices(NetworkList);
            for (var count = 0; count < NetworkList.length; count++) {
              var tempdata = await meraki.GetNetworkDevices(
                NetworkList[count],
                PackageData
              );
              DeviceList = DeviceList.concat(tempdata);
            }
            for (var count = 0; count < DeviceList.length; count++) {
              var tempdata = await meraki.GetPrefferedScore(
                DeviceList[count],
                PackageData
              );
              DeviceList[count]["Prefscore"] = tempdata.perfScore;
            }
            DeviceList = DeviceList.map(meraki.LimitDeviceListColumns);
            for (var count = 0; count < NetworkList.length; count++) {
              var tempdata = await meraki.GetNetworkClients(
                NetworkList[count],
                PackageData
              );
              ClientList = ClientList.concat(tempdata);
            }
            //START

            var ClientListWithModelAndPrefScore = ClientList.reduce(
              (result, clientlist) =>
                result.concat([
                  {
                    ClientList: clientlist,
                    _DeviceList: DeviceList.filter(
                      (a) => a.mac === clientlist.recentDeviceMac
                    ),
                  },
                ]),
              []
            );
            ClientListWithModelAndPrefScore =
              ClientListWithModelAndPrefScore.map(function (item) {
                item.ClientList["model"] = item._DeviceList[0].model;
                item.ClientList["PrefScore"] = item._DeviceList[0].Prefscore;
                return item;
              });
            //END
            var resultok = groupBy(ClientList, function (item) {
              return [item.recentDeviceMac, item.ssid];
            });
            resultok = resultok.map(InsertNWDetailToClientArray);

            var DevicesWithNoOfClients = DeviceList.reduce(
              (result, deviceList) =>
                result.concat([
                  {
                    DeviceList: deviceList,
                    _ClientList: ClientList.filter(
                      (a) => a.recentDeviceMac === deviceList.mac
                    ),
                  },
                ]),
              []
            );

            DeviceList = DevicesWithNoOfClients.map(
              meraki.FormatDeviceWithClients
            );

            var DataNew2 = NetworkList.reduce(
              (result, networkList) =>
                result.concat([
                  {
                    NetworkList: networkList,
                    _DeviceList: DeviceList.filter(
                      (a) => a.networkid === networkList.id
                    ),
                  },
                ]),
              []
            ); //.filter(pa => pa._DeviceList.length);
            var DataNew3 = DataNew2.reduce(
              (result, networkList) =>
                result.concat([
                  {
                    NetworkList: networkList.NetworkList,
                    DeviceList: networkList._DeviceList,
                    _ClientList: resultok.filter(
                      (a) => a.NetworkId === networkList.NetworkList.id
                    ),
                  },
                ]),
              []
            );
            var objNWWiseDevice = {};
            objNWWiseDevice["Data"] = DataNew3;
            objNWWiseDevice["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            InsertVerification = await InsertData(
              objNWWiseDevice,
              "NetworkWiseDeviceDistribution",
              db
            );

            let TopTenUsers = await meraki.GetTopTenUsers(ClientList);
            InsertVerification = await InsertData(
              TopTenUsers,
              "TopTenUsers",
              db
            );

            let OSWiseClients = await meraki.GetOSWiseClients(ClientList);
            InsertVerification = await InsertData(
              OSWiseClients,
              "OSWiseClients",
              db
            );

            let SSIDWiseClients = await meraki.GetSSIDWiseClients(ClientList);
            InsertVerification = await InsertData(
              SSIDWiseClients,
              "SSIDWiseClients",
              db
            );

            let OEMWiseClients = await meraki.GetOEMWiseClients(ClientList);
            InsertVerification = await InsertData(
              OEMWiseClients,
              "OEMWiseClients",
              db
            );

            let LicenseDetails = await meraki.GetLicenseDetails(
              PackageData[0].OrganizationId,
              NetworkList.length,
              PackageData
            );
            InsertVerification = await InsertData(
              LicenseDetails,
              "LicenseDetails",
              db
            );
            // var DeviceWiseDetailedReportData=DataNew2.map(meraki.FormatDeviceWiseDetailedReportData);
          } catch (err) { }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return MerakiTask;
};

const serviceNowTaskCron = (a) => {
  ServiceNowTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside service Now");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          try {
            let IncidentDetails = await servicesnow.GetIncidentDetails(
              PackageData,
              db
            );

            let CriticalTickets = IncidentDetails.filter(
              (a) =>
                !(a.state === "6") &&
                !(a.state === "7") &&
                a.priority === "1" &&
                a.impact === "1" &&
                a.urgency === "1"
            );
            let OnHoldTickets = IncidentDetails.filter((a) => a.state === "3");
            let CRDetails = await servicesnow.GetCRDetails(PackageData);
            let CRTickets = CRDetails.filter((a) => a.type === "emergency");

            let TaskSlaDetails = await servicesnow.GetTaskSLADetails(
              PackageData
            );
            let TaskSlaTickets = TaskSlaDetails.filter(
              (a) => a.type === "emergency"
            );

            let BreachedTickets = IncidentDetails.reduce(
              (result, incidentDetails) =>
                result.concat([
                  {
                    IncidentDetails: incidentDetails,
                    _TaskSlaDetails: TaskSlaDetails.filter(
                      (a) =>
                        a.task.value == incidentDetails.sys_id &&
                        a.has_breached == "true"
                    ),
                  },
                ]),
              []
            ).filter((pa) => pa._TaskSlaDetails.length);
            let objTicketSummary = {};
            objTicketSummary["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objTicketSummary["Critical"] = CriticalTickets.length;
            objTicketSummary["OnHold"] = OnHoldTickets.length;
            objTicketSummary["CR"] = CRTickets.length;
            objTicketSummary["Breached"] = BreachedTickets.length;

            let objIncidentDetails = {};
            objIncidentDetails["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );

            let commonData = OnHoldTickets.concat(CriticalTickets);
            let incidentData = commonData.map(function (item) {
              let data = {};
              item.sys_created_on = new Date(item.sys_created_on);
              if (item.priority == "1") item.priority = "Critical";
              else if (item.priority == "2") item.priority = "High";
              else if (item.priority == "3") item.priority = "Moderate";
              else if (item.priority == "4") item.priority = "Low";
              else if (item.priority == "5") item.priority = "Planning";

              if (item.urgency == "1") item.urgency = "High";
              else if (item.urgency == "2") item.urgency = "Medium";
              else if (item.urgency == "3") item.urgency = "Low";

              if (item.severity == "1") item.severity = "High";
              else if (item.severity == "2") item.severity = "Medium";
              else if (item.severity == "3") item.severity = "Low";

              if (item.state == "1") item.state = "New";
              else if (item.state == "2") item.state = "In Process";
              else if (item.state == "3") item.state = "On Hold";
              else if (item.state == "6") item.state = "Resolved";
              else if (item.state == "7") item.state = "Closed";
              else if (item.state == "8") item.state = "Cancelled";
              return item;
            });

            let CriticalTicketDrillDownData = incidentData.map(function (item) {
              let data = {};
              (data["IncidentNumber"] = item.number),
                (data["Summary"] = item.short_description),
                (data["Category"] = item.category),
                (data["Priority"] = item.priority),
                (data["Status"] = item.state),
                (data["Severity"] = item.severity),
                (data["Urgency"] = item.urgency),
                (data["OpenTime"] = item.opened_at),
                (data["CloseTime"] = item.closed_at),
                (data["SLADueOn"] = item.sla_due),
                (data["Description"] = item.description),
                (data["HoldReason"] = item.hold_reason);
              return data;
            });
            objIncidentDetails["Data"] = CriticalTicketDrillDownData;
            InsertVerification = await InsertData(
              objIncidentDetails,
              "IncidentDetails",
              db
            );

            InsertVerification = await InsertData(
              objTicketSummary,
              "TicketSummary",
              db
            );

            IncidentDetails = IncidentDetails.map(function (item) {
              let data = {};
              item.sys_created_on = new Date(item.sys_created_on);
              if (item.priority == "1") item.priority = "Critical";
              else if (item.priority == "2") item.priority = "High";
              else if (item.priority == "3") item.priority = "Moderate";
              else if (item.priority == "4") item.priority = "Low";
              else if (item.priority == "5") item.priority = "Planning";

              if (item.urgency == "1") item.urgency = "High";
              else if (item.urgency == "2") item.urgency = "Medium";
              else if (item.urgency == "3") item.urgency = "Low";

              if (item.severity == "1") item.severity = "High";
              else if (item.severity == "2") item.severity = "Medium";
              else if (item.severity == "3") item.severity = "Low";

              if (item.state == "1") item.state = "New";
              else if (item.state == "2") item.state = "In Process";
              else if (item.state == "3") item.state = "On Hold";
              else if (item.state == "6") item.state = "Resolved";
              else if (item.state == "7") item.state = "Closed";
              else if (item.state == "8") item.state = "Cancelled";
              return item;
            });

            let CriticalTicketDrillDown = CriticalTickets.map(function (item) {
              let data = {};
              /*
                    if(item.priority=="1")
                    item.priority="Critical";
                    else if(item.priority=="2")
                    item.priority="High";
                    else if(item.priority=="3")
                    item.priority="Moderate";
                    else if(item.priority=="4")
                    item.priority="Low";
                    else if(item.priority=="5")
                    item.priority="Planning";
 
                    if(item.urgency=="1")
                    item.urgency="High";
                    else if(item.urgency=="2")
                    item.urgency="Medium";
                    else if(item.urgency=="3")
                    item.urgency="Low";
 
                    if(item.severity=="1")
                    item.severity="High";
                    else if(item.severity=="2")
                    item.severity="Medium";
                    else if(item.severity=="3")
                    item.severity="Low";
 
                    if(item.state=="1")
                    item.state="New";
                    else if(item.state=="2")
                    item.state="In Process";
                    else if(item.state=="3")
                    item.state="On Hold";
                    else if(item.state=="6")
                    item.state="Resolved";
                    else if(item.state=="7")
                    item.state="Closed";
                    else if(item.state=="8")
                    item.state="Cancelled";
          */

              (data["IncidentNumber"] = item.number),
                (data["Summary"] = item.short_description),
                (data["Category"] = item.category),
                (data["Priority"] = item.priority),
                (data["Status"] = item.state),
                (data["Severity"] = item.severity),
                (data["Urgency"] = item.urgency),
                (data["OpenTime"] = item.opened_at),
                (data["CloseTime"] = item.closed_at),
                (data["SLADueOn"] = item.sla_due),
                (data["Description"] = item.description),
                (data["HoldReason"] = item.hold_reason);
              return data;
            });
            let objCriticalTicketDrillDown = {};
            objCriticalTicketDrillDown["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );

            objCriticalTicketDrillDown["Data"] = CriticalTicketDrillDown;
            InsertVerification = await InsertData(
              objCriticalTicketDrillDown,
              "CriticalTicketDrillDown",
              db
            );


            let OnHoldTicketDrillDown = OnHoldTickets.map(function (item) {
              let data = {};
              /*
                    if(item.priority=="1")
                    item.priority="Critical";
                    else if(item.priority=="2")
                    item.priority="High";
                    else if(item.priority=="3")
                    item.priority="Moderate";
                    else if(item.priority=="4")
                    item.priority="Low";
                    else if(item.priority=="5")
                    item.priority="Planning";

                    if(item.urgency=="1")
                    item.urgency="High";
                    else if(item.urgency=="2")
                    item.urgency="Medium";
                    else if(item.urgency=="3")
                    item.urgency="Low";

                    if(item.severity=="1")
                    item.severity="High";
                    else if(item.severity=="2")
                    item.severity="Medium";
                    else if(item.severity=="3")
                    item.severity="Low";

                    if(item.state=="1")
                    item.state="New";
                    else if(item.state=="2")
                    item.state="In Process";
                    else if(item.state=="3")
                    item.state="On Hold";
                    else if(item.state=="6")
                    item.state="Resolved";
                    else if(item.state=="7")
                    item.state="Closed";
                    else if(item.state=="8")
                    item.state="Cancelled";
          */
              (data["IncidentNumber"] = item.number),
                (data["Summary"] = item.short_description),
                (data["Category"] = item.category),
                (data["Priority"] = item.priority),
                (data["Status"] = item.state),
                (data["Severity"] = item.severity),
                (data["Urgency"] = item.urgency),
                (data["OpenTime"] = item.opened_at),
                (data["CloseTime"] = item.closed_at),
                (data["SLADueOn"] = item.sla_due),
                (data["Description"] = item.description),
                (data["HoldReason"] = item.hold_reason);
              return data;
            });
            let objOnHoldTicketDrillDown = {};
            objOnHoldTicketDrillDown["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objOnHoldTicketDrillDown["Data"] = OnHoldTicketDrillDown;
            InsertVerification = await InsertData(
              objOnHoldTicketDrillDown,
              "OnHoldTicketDrillDown",
              db
            );
            let CRTicketDrillDown = CRTickets.map(function (item) {
              let data = {};
              if (item.priority == "1") item.priority = "Critical";
              else if (item.priority == "2") item.priority = "High";
              else if (item.priority == "3") item.priority = "Moderate";
              else if (item.priority == "4") item.priority = "Low";
              else if (item.priority == "5") item.priority = "Planning";

              if (item.urgency == "1") item.urgency = "High";
              else if (item.urgency == "2") item.urgency = "Medium";
              else if (item.urgency == "3") item.urgency = "Low";

              if (item.impact == "1") item.impact = "High";
              else if (item.impact == "2") item.impact = "Medium";
              else if (item.impact == "3") item.impact = "Low";

              if (item.scope == "1") item.scope = "High";
              else if (item.scope == "2") item.scope = "Medium";
              else if (item.scope == "3") item.scope = "Low";

              if (item.state == "-5") item.state = "New";
              else if (item.state == "-4") item.state = "Assess";
              else if (item.state == "-3") item.state = "Authorize";
              else if (item.state == "-2") item.state = "Scheduled";
              else if (item.state == "-1") item.state = "Implement";
              else if (item.state == "0") item.state = "Review";
              else if (item.state == "3") item.state = "Closed";
              else if (item.state == "4") item.state = "Cancelled";

              (data["IncidentNumber"] = item.number),
                (data["Summary"] = item.short_description),
                (data["Category"] = item.category),
                (data["Priority"] = item.priority),
                (data["Status"] = item.state),
                (data["Severity"] = item.scope),
                (data["Urgency"] = item.urgency),
                (data["OpenTime"] = item.opened_at),
                (data["CloseTime"] = item.closed_at),
                (data["SLADueOn"] = item.sla_due),
                (data["Description"] = item.description),
                (data["HoldReason"] = item.on_hold_reason);
              (data["TestPlan"] = item.test_plan);
              (data["Type"] = item.type);
              (data["Impact"] = item.impact);
              (data["BackoutPlan"] = item.backout_plan);
              (data["ChangePlan"] = item.change_plan);
              return data;
            });
            let objCRTicketDrillDown = {};
            objCRTicketDrillDown["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objCRTicketDrillDown["Data"] = CRTicketDrillDown;
            InsertVerification = await InsertData(
              objCRTicketDrillDown,
              "CRTicketDrillDown",
              db
            );

            let BreachedTicketsDrillDown = BreachedTickets.map(function (item) {
              let data = {};
              if (item.IncidentDetails.priority == "1")
                item.IncidentDetails.priority = "Critical";
              else if (item.IncidentDetails.priority == "2")
                item.IncidentDetails.priority = "High";
              else if (item.IncidentDetails.priority == "3")
                item.IncidentDetails.priority = "Moderate";
              else if (item.IncidentDetails.priority == "4")
                item.IncidentDetails.priority = "Low";
              else if (item.IncidentDetails.priority == "5")
                item.IncidentDetails.priority = "Planning";

              if (item.IncidentDetails.urgency == "1")
                item.IncidentDetails.urgency = "High";
              else if (item.IncidentDetails.urgency == "2")
                item.IncidentDetails.urgency = "Medium";
              else if (item.IncidentDetails.urgency == "3")
                item.IncidentDetails.urgency = "Low";

              if (item.IncidentDetails.severity == "1")
                item.IncidentDetails.severity = "High";
              else if (item.IncidentDetails.severity == "2")
                item.IncidentDetails.severity = "Medium";
              else if (item.IncidentDetails.severity == "3")
                item.IncidentDetails.severity = "Low";

              if (item.IncidentDetails.state == "1")
                item.IncidentDetails.state = "New";
              else if (item.IncidentDetails.state == "2")
                item.IncidentDetails.state = "In Process";
              else if (item.IncidentDetails.state == "3")
                item.IncidentDetails.state = "On Hold";
              else if (item.IncidentDetails.state == "6")
                item.IncidentDetails.state = "Resolved";
              else if (item.IncidentDetails.state == "7")
                item.IncidentDetails.state = "Closed";
              else if (item.IncidentDetails.state == "8")
                item.IncidentDetails.state = "Cancelled";

              (data["IncidentNumber"] = item.IncidentDetails.number),
                (data["Summary"] = item.IncidentDetails.short_description),
                (data["Category"] = item.IncidentDetails.category),
                (data["Priority"] = item.IncidentDetails.priority),
                (data["Status"] = item.IncidentDetails.state),
                (data["Severity"] = item.IncidentDetails.severity),
                (data["Urgency"] = item.IncidentDetails.urgency),
                (data["OpenTime"] = item.IncidentDetails.opened_at),
                (data["CloseTime"] = item.IncidentDetails.closed_at),
                (data["SLADueOn"] = item.IncidentDetails.sla_due),
                (data["Description"] = item.IncidentDetails.description),
                (data["HoldReason"] = item.IncidentDetails.hold_reason);
              return data;
            });
            let objBreachedTicketsDrillDown = {};
            objBreachedTicketsDrillDown["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objBreachedTicketsDrillDown["Data"] = BreachedTicketsDrillDown;
            InsertVerification = await InsertData(
              objBreachedTicketsDrillDown,
              "BreachedTicketsDrillDown",
              db
            );

            let NonClosedResolvedTicket = IncidentDetails.filter(
              (a) => a.state != "Closed" && a.state != "Resolved"
            );

            //Removed Code from here
            let TicketBreakUpCatData =
              await servicesnow.GetCategorywiseTicketBreakUp(
                NonClosedResolvedTicket
              );
            InsertVerification = await InsertData(
              TicketBreakUpCatData,
              "TicketBreakUpCategoryWise",
              db
            );

            let TicketBreakUpPriorityData =
              await servicesnow.GetPrioritywiseTicketBreakUp(
                NonClosedResolvedTicket
              );
            InsertVerification = await InsertData(
              TicketBreakUpPriorityData,
              "TicketBreakupPriorityStateWise",
              db
            );
            let AllNonClosedResolvedData = NonClosedResolvedTicket.map(
              function (item) {
                let DatatoStore = {};
                DatatoStore["number"] = item.number;
                DatatoStore["short_description"] = item.short_description;
                DatatoStore["category"] = item.category;
                DatatoStore["priority"] = item.priority;
                DatatoStore["state"] = item.state;
                DatatoStore["severity"] = item.severity;
                DatatoStore["urgency"] = item.urgency;
                DatatoStore["opened_at"] = item.opened_at;
                DatatoStore["closed_at"] = item.closed_at;
                DatatoStore["sla_due"] = item.sla_due;
                DatatoStore["description"] = item.description;
                DatatoStore["hold_reason"] = item.hold_reason;
                DatatoStore["sys_created_on"] = item.sys_created_on;
                return DatatoStore;
              }
            );
            let objAllData = {};
            objAllData["timestamp"] = new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            );
            objAllData["Data"] = AllNonClosedResolvedData;
            InsertVerification = await InsertData(
              objAllData,
              "AllNonClosedResolvedTickets",
              db
            );
            // let CategorywiseTicketBreakUp=await servicesnow.GetCategorywiseTicketBreakUp(IncidentDetails);
            let QuarterlySLAData = await servicesnow.GetQuarterlySLA(
              TaskSlaDetails
            );
            InsertVerification = await InsertData(
              QuarterlySLAData,
              "QuaterlySLAAchievement",
              db
            );
            // let DailySLAData = await servicesnow.GetDailySLA(TaskSlaDetails);
            //InsertVerification = await InsertData(DailySLAData, "DailySLAData", db);

            let VerifyMonthlySLA =
              await servicesnow.CalculateAndInsertMonthlySLA(
                db,
                TaskSlaDetails
              );
          } catch (err) { }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return ServiceNowTask;
};

const solarwindTaskCron = (a) => {
  SolarwindTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside SolarWind tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        var ServiceListCPU = await GetServiceListCPU();
        var ServiceListMemory = await GetServiceListMemory();
        const Main = (async () => {
          var NetworkList = null;
          var ClientList = [];
          var DeviceList = [];
          // try {
            let con = await SolarWind.connectSQL(PackageData, db);
            if (con === 1) {
              let CPUutilizationData = await SolarWind.getCPUutilizationData(
                ServiceListCPU,
                ServiceListMemory
              );
              let getWanlinkData = await SolarWind.getWanlink();
              let getWanlinkDrillDownData = await SolarWind.getWanlinkDrillDown(
                getWanlinkData
              );
              let getInventry = await SolarWind.getInventry(CPUutilizationData);
              let getInventryDrill = await SolarWind.getInventryDrill(
                CPUutilizationData
              );
              let getCpuDrill = await SolarWind.getCpuDrill(
                CPUutilizationData,
                ServiceListCPU,
                ServiceListMemory
              );
              let getnetworkHealth = await SolarWind.getnetworkHealth(
                CPUutilizationData,
                ServiceListCPU,
                ServiceListMemory
              );
              let getnetworkHealthDrillData =
                await SolarWind.getnetworkHealthDrillData(
                  CPUutilizationData,
                  ServiceListCPU,
                  ServiceListMemory,
                  db
                );
            }
          // } catch (err) {
            // console.log(err);
          // }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return SolarwindTask;
};

const solarwindCPUMemoryTrendTaskCron = (a) => {
  SolarwindCPUMemoryTrendTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside SloarwindCpu Memory trend tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          // try {
            let IncidentDetails = await SolarWind.createCPUMemoryTrend(
              PackageData,
              db
            );
          // } catch (err) {
            // console.log(err);
          // }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return SolarwindCPUMemoryTrendTask;
};

const archieveServiceNowTaskCron = (a) => {
  ArchieveServiceNowTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside archieveServiceNowTaskCron");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          try {
            let IncidentDetails = await servicesnow.ArchieveServiceNow(
              db,
              PackageData
            );
          } catch (err) { }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return ArchieveServiceNowTask;
};

const dailySlaTaskCron = (a) => {
  DailySlaTask = cron.schedule(
    "05 22 * * *",
    () => {
      // console.log("Inside daily Sla Task tool");
      // console.log("archieveServiceNowTaskCron", archieveServiceNowTaskCron);
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          try {
            //let IncidentDetails = await servicesnow.ArchieveServiceNow(db, PackageData);

            let TaskSlaDetails = await servicesnow.GetTaskSLADetails(
              PackageData
            );
            // let TaskSlaTickets = TaskSlaDetails.filter(a => a.type === "emergency");

            let DailySLAData = await servicesnow.GetDailySLA(TaskSlaDetails);
            InsertVerification = await InsertData(
              DailySLAData,
              "DailySLAData",
              db
            );
          } catch (err) {
            console.log(err);
          }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return DailySlaTask;
};

const merakiTrafficTrendTaskCron = (a) => {
  MerakiTrafficTrendTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      //MerakiTrafficTrendTask.stop();
      // console.log("Inside Meraki Traffic trend tool");
      const PackageConnection = (async () => {
        var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          let NetworkList = null;
          let ClientList = [];
          let TrafficHistory = [];
          let AppCategory = [];
          try {
            let CheckData = await meraki.CheckUsageData(PackageData, db);
            if (CheckData == 0) {
              NetworkList = await meraki.GetNetwork(PackageData);
              NetworkList = NetworkList.filter(
                (a) => a.type != "systems manager"
              );
              for (var count = 0; count < NetworkList.length; count++) {
                let tempdata = await meraki.GetClientTraffic(
                  NetworkList[count],
                  PackageData
                );
                if (tempdata != undefined) {
                  tempdata = tempdata.map(function (item) {
                    item["network"] = NetworkList[count].name;
                    return item;
                  });
                  TrafficHistory = TrafficHistory.concat(tempdata);
                }
              }

              for (var count = 0; count < NetworkList.length; count++) {
                let tempdata = await meraki.GetAppCategory(
                  NetworkList[count],
                  PackageData
                );
                if (tempdata != undefined)
                  AppCategory = AppCategory.concat(tempdata);
              }
              let arrAppCategory = [];
              AppCategory.map(function (item) {
                let arr = [];
                arr = [...item.applications];
                arr = arr.map(function (element) {
                  return { Application: element.name, Category: item.name };
                });
                arrAppCategory = arrAppCategory.concat(arr);
                //return arr;
              });
              TrafficHistory = TrafficHistory.map(function (item) {
                let category = arrAppCategory.find(
                  (o) => o.Application === item.application
                );
                if (category == undefined) item["category"] = "Other";
                else item["category"] = category.Category;

                item["totalUsage"] =
                  TrafficHistory[0].sent + TrafficHistory[0].recv;
                return item;
              });

              var resultok = groupBy(TrafficHistory, function (item) {
                return [item.networkname, item.category];
              });

              // let groupedByAppNetworkname = Object.values(
              //   TrafficHistory.reduce((grouping, item) => {
              //     grouping[item.networkname] = [...(grouping[item.networkname] || []), item];
              //     return grouping;
              //   }, {})
              // );

              /*
                      let groupedByAppCat = Object.values(
                        TrafficHistory.reduce((grouping, item) => {
                          grouping[item.category] = [...(grouping[item.category] || []), item];
                          return grouping;
                        }, {})
                      );*/
              groupedByAppCat = resultok.map(function (item) {
                let dataApp = {};
                dataApp["Network"] = item[0].networkname;
                dataApp["Category"] = item[0].category;
                let Total = item.reduce(
                  (a, { totalUsage }) => a + totalUsage,
                  0
                );
                dataApp["Total"] = Total;
                return dataApp;
              });
              groupedByAppCat = groupedByAppCat.sort(function (a, b) {
                return b.Total - a.Total;
              });
              let DatatoInsert = {};
              DatatoInsert["Data"] = groupedByAppCat;
              DatatoInsert["timestamp"] = new Date(
                new Date(
                  new Date(
                    new Date(Date.now()).setMinutes(
                      parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                    )
                  ).setSeconds(0)
                ).setMilliseconds(0)
              );

              let DataDrillDown = {};
              DataDrillDown["Data"] = TrafficHistory;
              DataDrillDown["timestamp"] = new Date(
                new Date(
                  new Date(
                    new Date(Date.now()).setMinutes(
                      parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                    )
                  ).setSeconds(0)
                ).setMilliseconds(0)
              );
              InsertVerification = await InsertData(
                DatatoInsert,
                "DataUsageByAppCategory",
                db
              );
              InsertVerification = await InsertData(
                DataDrillDown,
                "DataUsageByAppCategoryDrillDown",
                db
              );
            }
          } catch (err) {
            // console.log(err);
          }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return MerakiTrafficTrendTask;
};

const timeInsertTaskCron = (a) => {
  TimeInsertTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Time");
      const PackageConnection = (async () => {
        //var PackageData = await GetPackageDetailFromDB();
        const Main = (async () => {
          // try {
            let collectionData = await db
              .collection("TopTwoTimestamp")
              .find({})
              .toArray();
            let data = await db.collection("tbl_Package").find({}).toArray();
            let dataForCronTimeInterval = data[0].cronUpdateTime;

            if (collectionData.length == 0) {
              {
                toolObj["PSIRT"] ? psirtTaskExecutor() : null;
              }
              await createSiteTopologyData();
              db.collection("TopTwoTimestamp").insertOne(
                {
                  TimeStamp: new Date(
                    new Date(
                      new Date(
                        new Date(Date.now()).setMinutes(
                          parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                        )
                      ).setSeconds(0)
                    ).setMilliseconds(0)
                  ),
                  IsFirstTimeStamp: true,
                  timeInterval: dataForCronTimeInterval,
                },
                function (err, result) {
                  if (err) throw err;
                }
              );
            } else if (collectionData.length == 1) {
              db.collection("TopTwoTimestamp").insertOne(
                {
                  TimeStamp: new Date(
                    new Date(
                      new Date(
                        new Date(Date.now()).setMinutes(
                          parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                        )
                      ).setSeconds(0)
                    ).setMilliseconds(0)
                  ),
                  IsFirstTimeStamp: false,
                  timeInterval: dataForCronTimeInterval,
                },
                function (err, result) {
                  if (err) throw err;
                }
              );
            } else {
              db.collection("TopTwoTimestamp").deleteOne(
                { IsFirstTimeStamp: false },
                function (err, result) {
                  if (err) throw err;
                  db.collection("TopTwoTimestamp").insertOne(
                    {
                      TimeStamp: new Date(
                        new Date(
                          new Date(
                            new Date(Date.now()).setMinutes(
                              parseInt(new Date(Date.now()).getMinutes() / 5) *
                              5
                            )
                          ).setSeconds(0)
                        ).setMilliseconds(0)
                      ),
                      IsFirstTimeStamp: false,
                      timeInterval: dataForCronTimeInterval,
                    },
                    function (err, result) {
                      if (err) throw err;
                    }
                  );
                }
              );
            }
          // } catch (err) {
            // console.log(err);
          // }
        })();
      })();
    },
    {
      scheduled: false,
    }
  );
  return TimeInsertTask;
};

const criticalTaskCron = (a) => {
  CriticalTask = cron.schedule(
    `*/${a} * * * *`,
    () => {
      // console.log("Inside Critical task tool");
      const Main2 = (async () => {
        var DataToSend = {};
        var allDevices = [];
        var CriticalDashboardDataDB = await GetCriticalDashboardDataDB(
          APIToken
        );
        CriticalDashboardDataDB.forEach((element) => {
          allDevices = allDevices.concat(element.DevicesList);
        });

        var groupedByMac = Object.values(
          allDevices.reduce((grouping, item) => {
            grouping[item.macAddress] = [
              ...(grouping[item.macAddress] || []),
              item,
            ];
            return grouping;
          }, {})
        );
        var AllDevicesTrendData = groupedByMac.map(CreateCriticalDeviceTrend);
        var TotalOverallHealth = getAvgOverallHealth(allDevices);
        var TotalmemoryScore = getAvgmemoryScore(allDevices);
        var TotalCpuScore = getAvgCpuScore(allDevices);
        //DataToSend["timestamp"]=new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0));
        DataToSend["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(new Date(Date.now()).setMinutes(0)).setSeconds(0)
            ).setMilliseconds(0)
          ).setHours(0)
        );
        DataToSend["DeviceList"] = AllDevicesTrendData;
        DataToSend["TotalOverallHealth"] = TotalOverallHealth;
        DataToSend["TotalCPUHealth"] = TotalmemoryScore;
        DataToSend["TotalMemoryHealth"] = TotalCpuScore;
        InsertVerification = await InsertData(
          DataToSend,
          "tbl_TrendDnacCriticalDevice",
          db
        );
      })();
    },
    {
      scheduled: false,
    }
  );
  return CriticalTask;
};

//////////////////////////////////////////////////////////////////////////
// functions used by ISE tool cron starts
//////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// This code is commented as this code can be used in future.
/////////////////////////////////////////////////////////////////////

// fn for getting data from Posture count api
// const GetIsePostureCount = async (api, config, db) => {
//   let Data = await axios.get(`${api}`, config);
//   helpers.buildStatusForTools(Data.status, "ISE", db);
//   if (Data.data) {
//     var jsonObj = xml2JsonParser.parse(Data.data)
//     // console.log("GetIsePostureCount", jsonObj);
//     // console.log(jsonObj.sessionCount.count);
//   }
// };

// fn for getting data from Auth List api
// const GetIseAuthList = async (api, config) => {
//   let { data } = await axios.get(
//     `${api}/${moment().format("YYYY-MM-DD hh:mm:ss")}/${null}`,
//     config
//   );
//   if (data) {
//     var jsonObj = xml2JsonParser.parse(data)
//     // console.log("GetIseAuthList",jsonObj);
//   }
// };

// fn for getting data from User name api
// const GetIseUserNameApi = async (api, config) => {
//   if (username_ise) {
//     let { data } = await axios.get(`${api}/${username_ise}`, config);
//     if (data) {
//       var jsonObj = xml2JsonParser.parse(data);
//       // console.log("GetIseUserNameApi",jsonObj);
//     }
//   }
// };

// fn for getting data from Failure Reasons api
const GetIseISEFailureReasonsApi = async (api, config) => {
  try {
    let ar = { iseFailureData: [] };
    let { data } = await axios.get(`${api}`, config);
    if (data) {
      var json = xml2JsonParser.parse(data, xmlOptions);
      json.failureReasonList.failureReason.forEach(value => {
        delete Object.assign(value, { ["failureReasonId"]: value["id"] })["id"];
        ar.iseFailureData.push(value);
      })
      ar["timestamp"] = new Date();
      return ar;
    }
  } catch (error) {
    console.log(" error in GetIseISEFailureReasonsApi");
  }
};

///////////////////////////////////////////////////////////////////////////
// functions used by ISE tool cron ends
///////////////////////////////////////////////////////////////////////////

function GetDeviceFromAPI(APIToken) {
  return new Promise((resolve) => {
    axios
      .get(PackageData[0].DnacNetworkDeviceAPI, {
        headers: { "x-auth-token": APIToken.Token },
      })
      .then(function (response) {
        var data = response.data.response
          .filter((a) => a.family)
          .filter(
            (a) =>
              a.family.toLowerCase().indexOf("meraki") === -1 &&
              a.family != null
          );
        resolve(data);
      })
      .catch(function (error) {
        // handle error
        // console.log(error);
      })
      .finally(function () {
        // always executed
      });
  });
}
function GetDeviceFromDB(APIToken) {
  return new Promise((resolve) => {
    var Test = mongoose.model("Test", new Schema(), "tbl_criticaldevices");
    Test.find({})
      .lean()
      .exec(function (err, doc) {
        resolve(doc);
      });
  });
}
/*
function UpdateDataInCriticalDevices()
{    
    return new Promise(resolve => 
        {                          
            
            var DeviceInDBNotInAPI = ListCriticalDevicesFromDB.filter(function(obj) {
                return !ListCriticalDevicesFromAPI.some(function(obj2) {
                    return obj.Mac_Address == obj2.macAddress;
                });
            });

            var DeviceInAPINotInDB =ListCriticalDevicesFromAPI.filter(function(obj) {
                return !ListCriticalDevicesFromDB.some(function(obj2) {
                    return obj.macAddress == obj2.Mac_Address;
                });
            });
         

            var NonCriticalDevices=DeviceInDBNotInAPI.filter(a=>a.Action==='0');
            var CriticalDevices=DeviceInDBNotInAPI.filter(a=>a.Action==='1');

            var arrNonCriticalDevicesMac=[];


            for(var i=0;i<NonCriticalDevices.length;i++)
            {
                arrNonCriticalDevicesMac.push(NonCriticalDevices[i].Mac_Address);                              
            }
            
            CriticalDevice.deleteMany({ Mac_Address: arrNonCriticalDevicesMac }, function (err) {
                if(err) console.log(err);
              });
            
        });
}*/
function GetClientBreakUp_HealthDrillDown(APIToken, cliDetConfig) {
  var ClientBreakUp = {};
  return new Promise((resolve) => {
    axios
      .get(PackageData[0].DnacHostAPI, {
        headers: {
          "x-auth-token": APIToken.Token,
        },
      })
      .then(function (response) {
        RawDataClientHealth = response.data.response;
        response.data.response.forEach(el => {
          el.hostMac = el.hostMac.toLowerCase();
        })
        ClientBreakUp["recordset"] = response.data.response;
        ClientBreakUp["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        ClientBreakUp["dataFetchFrom"] = cliDetConfig;

        resolve(ClientBreakUp);
      })
      .catch(function (error) {
        // handle error
        // console.log(error);
      })
      .finally(function () {
        // always executed
      });
  });
}
function GetClientBreakUp_Health(APIToken) {
  var ClientBreakUp = {};
  return new Promise((resolve) => {
    axios
      .get(
        PackageData[0].DnacClientHealthAPI +
        Math.round(new Date().getTime() / 1000) * 1000,
        {
          headers: {
            "x-auth-token": APIToken.Token,
            __runsync: "true",
            __timeout: "10",
          },
        }
      )
      .then(function (response) {
        RawDataClientHealth = response.data.response;

        ClientBreakUp["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        ClientBreakUp["Data"] = {
          All: {
            count: response.data.response[0].scoreDetail[0].clientCount,
            score: response.data.response[0].scoreDetail[0].scoreValue,
          },
          Wired: {
            count: response.data.response[0].scoreDetail[1].clientCount,
            score: response.data.response[0].scoreDetail[1].scoreValue,
          },
          Wireless: {
            count: response.data.response[0].scoreDetail[2].clientCount,
            score: response.data.response[0].scoreDetail[2].scoreValue,
          },
        };
        resolve(ClientBreakUp);
      })
      .catch(function (error) {
        // handle error
        // console.log(error);
      })
      .finally(function () {
        // always executed
      });
  });
}
function GetWiredWireless(APIToken) {
  var WiredWirelessBreakUp = {};
  var Wired = {};
  var Wireless = {};
  return new Promise((resolve) => {
    for (
      var count = 0;
      count < RawDataClientHealth[0].scoreDetail[1].scoreList.length;
      count++
    ) {
      Wired[
        RawDataClientHealth[0].scoreDetail[1].scoreList[
          count
        ].scoreCategory.value
      ] = RawDataClientHealth[0].scoreDetail[1].scoreList[count].clientCount;
    }

    // WiredWirelessBreakUp={Wired};

    for (
      var count = 0;
      count < RawDataClientHealth[0].scoreDetail[2].scoreList.length;
      count++
    ) {
      Wireless[
        RawDataClientHealth[0].scoreDetail[2].scoreList[
          count
        ].scoreCategory.value
      ] = RawDataClientHealth[0].scoreDetail[2].scoreList[count].clientCount;
    }
    WiredWirelessBreakUp["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    WiredWirelessBreakUp["Data"] = { Wired, Wireless };
    resolve(WiredWirelessBreakUp);
  });
}

function GetNetworkHealth(APIToken) {
  var NetworkHealth = {};
  return new Promise((resolve) => {
    axios
      .get(
        PackageData[0].DnacNetworkHealthAPI +
        Math.round(new Date().getTime() / 1000) * 1000,
        {
          headers: {
            "x-auth-token": APIToken.Token,
            __runsync: "true",
            __timeout: "10",
          },
        }
      )
      .then(function (response) {
        RawNetworkHealthData = response;
        NetworkHealth["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        NetworkHealth["Data"] = {
          HealthScore: response.data.response[0].healthScore,
          TotalDevices: response.data.response[0].totalCount,
          GoodCount: response.data.response[0].goodCount,
          FairCount: response.data.response[0].fairCount,
          BadCount: response.data.response[0].badCount,
          UnmonCount: response.data.response[0].unmonCount,
        };
        resolve(NetworkHealth);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () { });
  });
}

function GetCWNetworkHealth(APIToken) {
  var CWNetworkHealth = {};
  var arrCategory = [];

  return new Promise((resolve) => {
    const Data =
      RawNetworkHealthData?.data?.healthDistirubution?.map(createCWNHDList);

    CWNetworkHealth["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    CWNetworkHealth["Data"] = Data;
    resolve(CWNetworkHealth);
  });
}

function GetInventoryHealth(APIToken) {
  var InventoryHealth = {};
  return new Promise((resolve) => {
    axios
      .get(PackageData[0].DnacNetworkDeviceAPI, {
        headers: { "x-auth-token": APIToken.Token },
      })
      .then(function (response) {
        //GetInventoryHealthDrillDown(response.data.response)
        var Reachable = response.data.response.filter(
          (a) => a.reachabilityStatus === "Reachable"
        );
        var Unreachable = response.data.response.filter(
          (a) => a.reachabilityStatus === "Unreachable"
        );

        InventoryHealth["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );

        InventoryHealth["Data"] = {
          Reachable: Reachable.length,
          Unreachable: Unreachable.length,
        };
        resolve(InventoryHealth);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () { });
  });
}
function GetInventoryHealthDrillDown(APIToken) {
  var InventoryHealth = {};
  return new Promise((resolve) => {
    axios
      .get(PackageData[0].DnacNetworkDeviceAPI, {
        headers: { "x-auth-token": APIToken.Token },
      })
      .then(function (response) {
        //GetInventoryHealthDrillDown(response.data.response)
        var Reachable = response.data.response.filter(
          (a) => a.reachabilityStatus === "Reachable"
        );
        var Unreachable = response.data.response.filter(
          (a) => a.reachabilityStatus === "Unreachable"
        );

        InventoryHealth["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );

        InventoryHealth["Data"] = response.data.response;
        resolve(InventoryHealth);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () { });
  });
}

function GetToken() {
  const data = PackageData[0].DnacTokenAPI.split("/");
  const ip = data[2];
  var options = {
    hostname: ip /* '10.122.1.25' */,
    path: "/dna/system/api/v1/auth/token",
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          PackageData[0].DnacUserName + ":" + PackageData[0].DnacPassWord
        ).toString("base64"),
    },
  };

  return new Promise((resolve) => {
    var req = https.request(options, function (res) {
      var data = [];
      res
        .on("data", function (chunk) {
          data.push(chunk);
        })
        .on("end", function () {
          var buffer = Buffer.concat(data);
          var str = iconv.decode(buffer, "windows-1252");
          resolve(JSON.parse(str));
        });
    });
    req.end();
    req.on("error", function (e) {
      console.error(e);
    });
  });
}

function createCWNHDList(item) {
  const category = item.category;
  var element = {
    category: item.category,
    healthScore: item.healthScore,
    totalCount: item.totalCount,
    goodPercentage: item.goodPercentage,
    fairPercentage: item.fairPercentage,
    badPercentage: item.badPercentage,
    unmonPercentage: item.unmonPercentage,
  };
  // var data={};
  // data[category]=element;
  return element;
}

function createFormattedPhysicalTopologyData(item) {
  var element = {
    latitude: item.additionalInfo.latitude,
    longitude: item.additionalInfo.longitude,
    macAddress: item.additionalInfo.macAddress,
    siteid: item.additionalInfo.siteid,
    deviceSeries: item.deviceSeries,
    deviceType: item.deviceType,
    family: item.family,
    id: item.id,
    ip: item.ip,
    label: item.label,
    nodeType: item.nodeType,
    platformId: item.platformId,
    role: item.role,
    roleSource: item.roleSource,
    softwareVersion: item.softwareVersion,
  };
  return element;
}

function createDeviceTopologyFormating(item) {
  var element = {
    siteid: item._RawPhysicalTopologyData[0].siteid,
    apManagerInterfaceIp: item.RawNetworkHealthDevice.apManagerInterfaceIp,
    associatedWlcIp: item.RawNetworkHealthDevice.associatedWlcIp,
    bootDateTime: item.RawNetworkHealthDevice.bootDateTime,
    collectionInterval: item.RawNetworkHealthDevice.collectionInterval,
    collectionStatus: item.RawNetworkHealthDevice.collectionStatus,
    deviceSupportLevel: item.RawNetworkHealthDevice.deviceSupportLevel,
    errorCode: item.RawNetworkHealthDevice.errorCode,
    errorDescription: item.RawNetworkHealthDevice.errorDescription,
    family: item.RawNetworkHealthDevice.family,
    hostname: item.RawNetworkHealthDevice.hostname,
    id: item.RawNetworkHealthDevice.id,
    instanceTenantId: item.RawNetworkHealthDevice.instanceTenantId,
    instanceUuid: item.RawNetworkHealthDevice.instanceUuid,
    interfaceCount: item.RawNetworkHealthDevice.interfaceCount,
    inventoryStatusDetail: item.RawNetworkHealthDevice.inventoryStatusDetail,
    lastUpdated: item.RawNetworkHealthDevice.lastUpdated,
    lastUpdateTime: item.RawNetworkHealthDevice.lastUpdateTime,
    lineCardCount: item.RawNetworkHealthDevice.lineCardCount,
    lineCardId: item.RawNetworkHealthDevice.lineCardId,
    location: item.RawNetworkHealthDevice.location,
    locationName: item.RawNetworkHealthDevice.locationName,
    macAddress: item.RawNetworkHealthDevice.macAddress,
    managementIpAddress: item.RawNetworkHealthDevice.managementIpAddress,
    memorySize: item.RawNetworkHealthDevice.memorySize,
    platformId: item.RawNetworkHealthDevice.platformId,
    reachabilityFailureReason:
      item.RawNetworkHealthDevice.reachabilityFailureReason,
    reachabilityStatus: item.RawNetworkHealthDevice.reachabilityStatus,
    role: item.RawNetworkHealthDevice.role,
    roleSource: item.RawNetworkHealthDevice.roleSource,
    serialNumber: item.RawNetworkHealthDevice.serialNumber,
    series: item.RawNetworkHealthDevice.series,
    status: item.RawNetworkHealthDevice.snmpContact,
    snmpLocation: item.RawNetworkHealthDevice.snmpLocation,
    softwareType: item.RawNetworkHealthDevice.softwareType,
    softwareVersion: item.RawNetworkHealthDevice.softwareVersion,
    tagCount: item.RawNetworkHealthDevice.tagCount,
    tunnelUdpPort: item.RawNetworkHealthDevice.tunnelUdpPort,
    type: item.RawNetworkHealthDevice.type,
    upTime: item.RawNetworkHealthDevice.upTime,
    waasDeviceMode: item.RawNetworkHealthDevice.waasDeviceMode,
  };
  return element;
}

function createDeviceTopologyHealthFormating(item) {
  var element = {
    siteName:
      item.SiteHealthData.length != 0 ? item.SiteHealthData[0].siteName : "",
    siteid: item.FormattedData.siteid,
    apManagerInterfaceIp: item.FormattedData.apManagerInterfaceIp,
    associatedWlcIp: item.FormattedData.associatedWlcIp,
    bootDateTime: item.FormattedData.bootDateTime,
    collectionInterval: item.FormattedData.collectionInterval,
    collectionStatus: item.FormattedData.collectionStatus,
    deviceSupportLevel: item.FormattedData.deviceSupportLevel,
    errorCode: item.FormattedData.errorCode,
    errorDescription: item.FormattedData.errorDescription,
    family: item.FormattedData.family,
    hostname: item.FormattedData.hostname,
    id: item.FormattedData.id,
    instanceTenantId: item.FormattedData.instanceTenantId,
    instanceUuid: item.FormattedData.instanceUuid,
    interfaceCount: item.FormattedData.interfaceCount,
    inventoryStatusDetail: item.FormattedData.inventoryStatusDetail,
    lastUpdated: item.FormattedData.lastUpdated,
    lastUpdateTime: item.FormattedData.lastUpdateTime,
    lineCardCount: item.FormattedData.lineCardCount,
    lineCardId: item.FormattedData.lineCardId,
    location: item.FormattedData.location,
    locationName: item.FormattedData.locationName,
    macAddress: item.FormattedData.macAddress,
    managementIpAddress: item.FormattedData.managementIpAddress,
    memorySize: item.FormattedData.memorySize,
    platformId: item.FormattedData.platformId,
    reachabilityFailureReason: item.FormattedData.reachabilityFailureReason,
    reachabilityStatus: item.FormattedData.reachabilityStatus,
    role: item.FormattedData.role,
    roleSource: item.FormattedData.roleSource,
    serialNumber: item.FormattedData.serialNumber,
    series: item.FormattedData.series,
    snmpContact: item.FormattedData.snmpContact,
    snmpLocation: item.FormattedData.snmpLocation,
    softwareType: item.FormattedData.softwareType,
    softwareVersion: item.FormattedData.softwareVersion,
    tagCount: item.FormattedData.tagCount,
    tunnelUdpPort: item.FormattedData.tunnelUdpPort,
    type: item.FormattedData.type,
    upTime: item.FormattedData.upTime,
    waasDeviceMode: item.FormattedData.waasDeviceMode,
  };
  return element;
}

function GetInterfaceAvailibility(APIToken, FormattedData) {
  var InterfaceAvailibility = {};
  const data = PackageData[0].DnacTokenAPI.split("/");
  const hostname = data[0] + "//" + data[2];
  return new Promise((resolve) => {
    axios
      .get(hostname /* '10.122.1.25' */ + "/api/v1/interface", {
        headers: { "x-auth-token": APIToken.Token },
      })
      .then(function (response) {
        var interfaceData = response.data.response;

        var DataNew3 = interfaceData.reduce(
          (result, IF) =>
            result.concat([
              {
                _interface: IF,
                _FormattedData: FormattedData.filter(
                  (a) => a.id === IF.deviceId
                ),
              },
            ]),
          []
        );
        var FormattedInterfaceData = DataNew3.map(createInterfaceFormating);
        FormattedInterfaceData = FormattedInterfaceData.filter(
          (a) => a.role === "ACCESS"
        );
        /*
    FormattedInterfaceData.push({    
    "hostname":"11A1L2S01.vspllab.im",
    "hostmac":"70:18:a7:6f:2b:80",
    "mappedPhysicalInterfaceId":null,
    "mappedPhysicalInterfaceName":null,
    "mediaType":null,
    "nativeVlanId":"0",
    "ospfSupport":"false",
    "pid":"C9300-24P",
    "portMode":"access",
    "portName":"Port-channel20",
    "portType":"Ethernet SVI",
    "serialNo":"FOC2245Z0DB",
    "series":"Cisco Catalyst 9300 Series Switches",
    "siteid":"ad001f1f-e9b2-4466-8d7f-06701ad9d7f2",
    "siteName":"A25",
    "speed":"100000",
    "status":"down",
    "vlanId":"10",
    "voiceVlan":null
    });
    */
        var uniqueSites = FormattedInterfaceData.filter(
          (e, i) =>
            FormattedInterfaceData.findIndex(
              (a) => a["siteName"] === e["siteName"]
            ) === i
        );
        var arrSiteWiseDetails = uniqueSites.map(
          createSiteWiseDetails(FormattedInterfaceData)
        );
        InterfaceAvailibility["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        InterfaceAvailibility["Data"] = arrSiteWiseDetails;
        resolve(InterfaceAvailibility);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () { });
  });
}

function createInterfaceFormating(item) {
  var element = {
    siteName: item && item._FormattedData && item._FormattedData.length ? item._FormattedData[0].siteName : '',
    siteid: item && item._FormattedData && item._FormattedData.length ? item._FormattedData[0].siteid : '',
    role: item && item._FormattedData && item._FormattedData.length ? item._FormattedData[0].role : '',
    hostname: item && item._FormattedData && item._FormattedData.length ? item._FormattedData[0].hostname : '',
    hostmac: item && item._FormattedData && item._FormattedData.length ? item._FormattedData[0].macAddress : '',
    macAddress: item && item._interface ? item._interface.macAddress : '',
    status: item && item._interface ? item._interface.status : '',
  };
  return element;
}

function createSiteWiseDetails(_FormattedInterfaceData) {
  return function (uniqueSite) {
    var element = {};
    var siteTotal = 0;
    var siteUtilized = 0;
    var siteFree = 0;
    element["siteName"] = uniqueSite.siteName;
    element["siteid"] = uniqueSite.siteid;
    var arrSite = [];
    var data = _FormattedInterfaceData.filter(
      (a) => a.siteid === uniqueSite.siteid
    );
    var arrDeviceWiseDetails = data.filter(
      (e, i) => data.findIndex((a) => a["macAddress"] === e["macAddress"]) === i
    );

    var groupedByMac = Object.values(
      data.reduce((grouping, item) => {
        grouping[item.hostmac] = [...(grouping[item.hostmac] || []), item];
        return grouping;
      }, {})
    );
    groupedByMac.forEach((ele) => {
      var site = {};
      site["hostmac"] = ele[0].hostmac;
      site["hostname"] = ele[0].hostname;
      site["total"] = ele.length;
      site["utilized"] = ele.filter((a) => a.status === "up");
      site["free"] = ele.filter((a) => a.status === "down");
      arrSite.push(site);
      site = {};
      siteTotal = siteTotal + ele.length;
      siteUtilized = siteUtilized + ele.filter((a) => a.status === "up").length;
      siteFree = siteFree + ele.filter((a) => a.status === "down").length;
    });
    element["devices"] = arrSite;
    element["siteTotal"] = siteTotal;
    element["siteUtilized"] = siteUtilized;
    element["siteFree"] = siteFree;
    siteTotal = 0;
    siteUtilized = 0;
    siteFree = 0;
    return element;
  };

  //   var element =
  //   {
  //     "siteName":item._FormattedData[0].siteName,
  //     "siteid":item._FormattedData[0].siteid,
  //     "macAddress":item._interface.macAddress,
  //     "mappedPhysicalInterfaceId":item._interface.mappedPhysicalInterfaceId,
  //     "mappedPhysicalInterfaceName":item._interface.mappedPhysicalInterfaceName,
  //     "mediaType":item._interface.mediaType,
  //     "nativeVlanId":item._interface.nativeVlanId,
  //     "ospfSupport":item._interface.ospfSupport,
  //     "pid":item._interface.pid,
  //     "portMode":item._interface.portMode,
  //     "portName":item._interface.portName,
  //     "portType":item._interface.portType,
  //     "serialNo":item._interface.serialNo,
  //     "series":item._interface.series,
  //     "speed":item._interface.speed,
  //     "status":item._interface.status,
  //     "vlanId":item._interface.vlanId,
  //     "voiceVlan":item._interface.voiceVlan
  //   }
  //   return element;
}

function GetPhysicalTopologyData(APIToken, db) {
  const data = PackageData[0].DnacTokenAPI.split("/");
  const hostname = data[0] + "//" + data[2];
  var PhysicalTopology = {};
  return new Promise((resolve) => {
    axios
      .get(
        hostname /* '10.122.1.25' */ + "/api/v1/topology/physical-topology",
        {
          headers: {
            "x-auth-token": APIToken.Token,
            __runsync: "true",
            __timeout: "10",
          },
        }
      )
      .then(function (response) {
        getSiteTopologyData(response.data.response, db)
        var RawPhysicalTopologyData = response.data.response.nodes.filter(
          (a) => a.additionalInfo != undefined
        );
        var FormattedPhysicalTopologyData = RawPhysicalTopologyData.map(
          createFormattedPhysicalTopologyData
        );
        resolve(FormattedPhysicalTopologyData);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () {
      });
  });
}
function GetSWIMData(APIToken) {
  var GetSWIMData = {};
  return new Promise((resolve) => {
    axios
      .get(PackageData[0].DnacSwimInfoAPI, {
        headers: {
          "x-auth-token": APIToken.Token,
          __runsync: "true",
          __timeout: "10",
        },
      })
      .then(function (response) {
        RawSWIMData = response.data.response;
        var DevicesWithComplianceCheck = FormattedDeviceTopologyHealthData.map(
          createComplianceNonCom
        );
        var CompliantDeviceList = DevicesWithComplianceCheck.filter(
          (a) => a.status == "Compliance"
        );
        var NonCompliantDeviceList = DevicesWithComplianceCheck.filter(
          (a) => a.status == "Noncompliance"
        );
        GetSWIMData["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        GetSWIMData["Complaint"] = {
          Count: CompliantDeviceList.length,
          Devices: CompliantDeviceList,
        };
        GetSWIMData["Noncomplaint"] = {
          Count: NonCompliantDeviceList.length,
          Devices: NonCompliantDeviceList,
        };
        resolve(GetSWIMData);
      })
      .catch(function (error) {
        // console.log(error);
      })
      .finally(function () { });
  });
}
function createComplianceNonCom(item) {
  var element = {
    macAddress: item.macAddress,
    hostname: item.hostname,
    family: item.family,
    softwareVersion: item.softwareVersion,
    isTaggedGolden: "",
    status: "",
  };
  var CompliantDevices = RawSWIMData.filter(function (obj) {
    return obj.applicableDevicesForImage[0].productName == item.type;
  });
  if (CompliantDevices.length > 0) {
    element["status"] = "Compliance";
    element["isTaggedGolden"] = true;
  } else {
    element["status"] = "Noncompliance";
    element["isTaggedGolden"] = false;
  }

  // var DeviceInAPINotInDB =ListCriticalDevicesFromAPI.filter(function(obj) {
  //     return !ListCriticalDevicesFromDB.some(function(obj2) {
  //         return obj.macAddress == obj2.Mac_Address;
  //     });
  // });
  //   const category=item.category;
  //   var element =
  //   {
  //     "healthScore":item.healthScore,
  //     "totalCount":item.totalCount,
  //     "goodPercentage":item.goodPercentage,
  //     "fairPercentage":item.fairPercentage,
  //     "badPercentage":item.badPercentage,
  //     "unmonPercentage":item.unmonPercentage
  //   }
  //   var data={};
  //   data[category]=element;
  return element;
}

function GetRawSiteHealthData(APIToken, db) {
  const dnacVersion = PackageData[0].DNacVersion;
  switch (dnacVersion) {
    case '2.2.2.3':
      return getRawSiteHealthData_3(APIToken);
    case '2.2.2.5':
      return getRawSiteHealthData_5(APIToken);
    default:
      return getRawSiteHealthData_3(APIToken);
  }
}

const getRawSiteHealthData_3 = (APIToken) => {
  return new Promise((resolve) => {
    axios
      .get(
        PackageData[0].DnacSiteHealthAPI +
        Math.round(new Date().getTime() / 1000) * 1000,
        {
          headers: {
            "x-auth-token": APIToken.Token,
            __runsync: "true",
            __timeout: "10",
          },
        }
      )
      .then(function (response) {
        resolve(response.data.response);
      })
      .catch(function (error) { })
      .finally(function () { });
  });
}

const getRawSiteHealthData_5 = async (APIToken) => {
  const baseUrl = `${PackageData[0].DnacSiteHealthAPI}${Math.round(new Date().getTime() / 1000) * 1000}`;
  const areaData = await fetchAreaData(baseUrl, APIToken);
  const bulidingData = await fetchBuildingData(baseUrl, APIToken);
  const allData = [...areaData, ...bulidingData];
  return allData;
}

function SiteHealthRadarData(filterData) {
  let Data = filterData.filter((item) => item.siteType == "building");
  return new Promise((resolve) => {
    let radarData = [];
    let object = {};
    Data.forEach((item) => {
      (object = {
        _id: { siteName: item.siteName },
        healthyNetworkDevicePercentage: item.healthyNetworkDevicePercentage,
        numberOfNetworkDevice: item.numberOfNetworkDevice,
        numberOfWiredClients: item.numberOfWiredClients,
        numberOfWirelessClients: item.numberOfWirelessClients,
      }),
        radarData.push(object);
    });
    resolve(radarData);
  });
}
function AllSiteData(item) {
  const category = item.siteName.trim();
  var element = {
    latitude: item.latitude,
    longitude: item.longitude,
    Access: {
      type: "Devices",
      healthScore: item.networkHealthAccess > 0 ? item.networkHealthAccess : 0,
      count: item.accessTotalCount > 0 ? item.accessTotalCount : 0,
      deviceRole: "Access",
    },
    Core: {
      type: "Devices",
      healthScore: item.networkHealthCore > 0 ? item.networkHealthCore : 0,
      count: item.coreTotalCount > 0 ? item.coreTotalCount : 0,
      deviceRole: "Core",
    },
    Router: {
      type: "Devices",
      healthScore: item.networkHealthRouter > 0 ? item.networkHealthRouter : 0,
      count: item.routerTotalCount > 0 ? item.routerTotalCount : 0,
      deviceRole: "Router",
    },
    Distributed: {
      type: "Devices",
      healthScore:
        item.networkHealthDistribution > 0 ? item.networkHealthDistribution : 0,
      count: item.distributionTotalCount > 0 ? item.distributionTotalCount : 0,
      deviceRole: "Distributed",
    },
    Wireless: {
      type: "Devices",
      healthScore:
        item.networkHealthWireless > 0 ? item.networkHealthWireless : 0,
      count:
        item.wirelessDeviceTotalCount > 0 ? item.wirelessDeviceTotalCount : 0,
      deviceRole: "Wireless",
    },
    healthyNetworkDevices: {
      healthyNetworkDevicesPrecentages:
        item.healthyNetworkDevicePercentage > 0
          ? item.healthyNetworkDevicePercentage
          : 0,
      healthyNetworkDevices:
        item.numberOfNetworkDevice > 0 ? item.numberOfNetworkDevice : 0,
    },
    WiredClient: {
      type: "Clients",
      totalCount: item.numberOfWiredClients > 0 ? item.numberOfWiredClients : 0,
      goodCount: item.wiredGoodClients > 0 ? item.wiredGoodClients : 0,
      deviceRole: "Wired Client",
    },
    WirelessClient: {
      type: "Clients",
      totalCount:
        item.numberOfWirelessClients > 0 ? item.numberOfWirelessClients : 0,
      goodCount: item.wirelessGoodClients > 0 ? item.wirelessGoodClients : 0,
      deviceRole: "Wireless Client",
    },
  };
  var data = {};
  data[category] = element;
  return data;
}

function GetSiteHealthData(APIToken) {
  var siteHealthFilterData = {};
  const dnacVersion = PackageData[0].DNacVersion;
  switch (dnacVersion) {
    case '2.2.2.3':
      return getSiteHealthData_3(siteHealthFilterData, APIToken);
    case '2.2.2.5':
      return getSiteHealthData_5(siteHealthFilterData, APIToken);
    default:
      return getSiteHealthData_3(siteHealthFilterData, APIToken);
  }
}

const getSiteHealthData_3 = (siteHealthFilterData, APIToken) => {
  return new Promise((resolve) => {
    axios
      .get(
        PackageData[0].DnacSiteHealthAPI +
        Math.round(new Date().getTime() / 1000) * 1000,
        {
          headers: {
            "x-auth-token": APIToken.Token,
            __runsync: "true",
            __timeout: "10",
          },
        }
      )
      .then(function (response) {
        const Data = response.data.response.map(AllSiteData);
        siteHealthFilterData["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        siteHealthFilterData["Data"] = Data;
        resolve(siteHealthFilterData);
      })
      .catch(function (error) { })
      .finally(function () { });
  });
}

const getSiteHealthData_5 = async (siteHealthFilterData, APIToken) => {
  const baseUrl = `${PackageData[0].DnacSiteHealthAPI}${Math.round(new Date().getTime() / 1000) * 1000}`;
  const areaData = await fetchAreaData(baseUrl, APIToken);
  const bulidingData = await fetchBuildingData(baseUrl, APIToken);
  const allData = [...areaData, ...bulidingData];
  const Data = allData.map(AllSiteData);
  siteHealthFilterData["timestamp"] = new Date(
    new Date(
      new Date(
        new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5
        )
      ).setSeconds(0)
    ).setMilliseconds(0)
  );
  siteHealthFilterData["Data"] = Data;
  return siteHealthFilterData;
}

const fetchAreaData = async (baseUrl, APIToken) => {
  let allData = [];
  let offset = 1;
  const limit = 50;
  while (true) {
    const apiUrl = `${baseUrl}&offset=${offset}&limit=${limit}&siteType=AREA`;
    const areaData = await axios.get(apiUrl, { headers: { "x-auth-token": APIToken.Token } });
    if (areaData && areaData.data && areaData.data.response && areaData.data.response.length > 0) {
      allData = [...areaData.data.response];
      offset = offset + limit;
    } else {
      break;
    }
  }
  return allData;
}

const fetchBuildingData = async (baseUrl, APIToken) => {
  let allData = [];
  let offset = 1;
  const limit = 50;
  while (true) {
    const apiUrl = `${baseUrl}&offset=${offset}&limit=${limit}&siteType=BUILDING`;
    const bulidingData = await axios.get(apiUrl, { headers: { "x-auth-token": APIToken.Token } });
    if (bulidingData && bulidingData.data && bulidingData.data.response && bulidingData.data.response.length > 0) {
      allData = [...bulidingData.data.response];
      offset = offset + limit;
    } else {
      break;
    }
  }
  return allData;
}

function GetCriticalDevicesFromDB(APIToken) {
  return new Promise((resolve) => {
    var DeviceListFromCriticalDevicetbl = [];
    Criticl.find({ Action: "1" })
      .lean()
      .exec(function (err, doc) {
        DeviceListFromCriticalDevicetbl = doc;
        /*
                for(var aa=0;aa<DeviceListFromCriticalDevicetbl.length;aa++)
                {
                  var daaata= GetCriticalDeviceDetailByAPI(DeviceListFromCriticalDevicetbl[aa]);
                  
                }
                */
        // var DeviceDetails=DeviceListFromCriticalDevicetbl.map(await GetCriticalDeviceDetailByAPI);
        resolve(doc);
      });
  });
}
function GetAllDevicesFromDB(APIToken) {
  return new Promise((resolve) => {
    Criticl.find({})
      .lean()
      .exec(function (err, doc) {
        resolve(doc);
      });
  });
}
function GetCriticalDeviceDetailByAPI(item) {
  var DeviceDetail = {};
  var data = null;
  return new Promise((resolve) => {
    var APIURL = PackageData[0].DnacNetworkDetails;
    APIURL = APIURL.replace(
      "{0}",
      Math.round(new Date().getTime() / 1000) * 1000
    ).replace("{1}", item.macAddress);
    //axios.get(`https://10.122.1.25/dna/intent/api/v1/device-detail?timestampMath.round((new Date()).getTime() / 1000)*1000searchBy=${item.Mac_Address}&identifier=macAddress`,{ headers: {'x-auth-token':APIToken.Token,'__runsync':'true','__timeout':'10'}})
    axios
      .get(APIURL, {
        headers: {
          "x-auth-token": APIToken.Token,
          __runsync: "true",
          __timeout: "10",
        },
      })
      .then(function (response) {
        // handle success
        data = response.data.response;
        // const Data=response.data.result.map(createListOfModels);
        // Sla.insertMany(Data).then(async (docs)=>{
        //      //resolve();
        //      var result = await function2();
        //     // var result3 = await function3();

        //    });
      })
      .catch(function (error) {
        // handle error
        // console.log(error);
      })
      .finally(function () {
        // always executed
      });
    setTimeout(() => {
      resolve(data);
    }, 15000);
  });

  // return new Promise(resolve =>
  // {
  //     axios.get(`https://10.122.1.25/dna/intent/api/v1/device-detail?timestampMath.round((new Date()).getTime() / 1000)*1000searchBy=${item.Mac_Address}&identifier=macAddress`,{ headers: {'x-auth-token':APIToken.Token,'__runsync':'true','__timeout':'10'}})
  // .then(function (response)
  // {
  //    resolve(response)
  //     return(DeviceDetail);
  // })
  //     .catch(function (error) {
  //     })
  //     .finally(function () {
  //     });
  // });
}
function createCriticalDashboardData(rawData, timestamp) {
  return new Promise((resolve) => {
    var Block = {};
    var Charts = {};
    var FinalData = {};
    var AccessData = rawData.filter((a) => a.nwDeviceRole == "ACCESS");
    var COREData = rawData.filter((a) => a.nwDeviceRole == "CORE");
    var DISTRIBUTIONData = rawData.filter(
      (a) => a.nwDeviceRole == "DISTRIBUTION"
    );
    var WLCData = rawData.filter((a) => a.nwDeviceRole == "WLC");
    var ROUTERData = rawData.filter(
      (a) => a.nwDeviceRole == "ROUTER" || a.nwDeviceRole == "BORDER ROUTER"
    );
    var APData = rawData.filter((a) => a.nwDeviceRole == "AP");
    var OverallHealth = rawData.filter((a) => a.overallHealth > 0);
    var MemoryScore = rawData.filter((a) => a.memoryScore > 0);
    var CPUScore = rawData.filter((a) => a.cpuScore > 0);
    if (AccessData.length == 0) {
      Block["Access"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = AccessData.filter((a) => a.overallHealth >= 7).length;
      var fair = AccessData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = AccessData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["Access"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (ROUTERData.length == 0) {
      Block["Router"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = ROUTERData.filter((a) => a.overallHealth >= 7).length;
      var fair = ROUTERData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = ROUTERData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["Router"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (COREData.length == 0) {
      Block["Core"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = COREData.filter((a) => a.overallHealth >= 7).length;
      var fair = COREData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = COREData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["Core"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (DISTRIBUTIONData.length == 0) {
      Block["Distribution"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = DISTRIBUTIONData.filter((a) => a.overallHealth >= 7).length;
      var fair = DISTRIBUTIONData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = DISTRIBUTIONData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["Distribution"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (WLCData.length == 0) {
      Block["WLC"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = WLCData.filter((a) => a.overallHealth >= 7).length;
      var fair = WLCData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = WLCData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["WLC"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (APData.length == 0) {
      Block["AP"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = APData.filter((a) => a.overallHealth >= 7).length;
      var fair = APData.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = APData.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Block["AP"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (OverallHealth.length == 0) {
      Charts["OverallHealth"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = OverallHealth.filter((a) => a.overallHealth >= 7).length;
      var fair = OverallHealth.filter(
        (a) => a.overallHealth >= 3 && a.overallHealth < 7
      ).length;
      var poor = OverallHealth.filter((a) => a.overallHealth < 3).length;
      var total = good + fair + poor;
      Charts["OverallHealth"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (MemoryScore.length == 0) {
      Charts["MemoryHealth"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = MemoryScore.filter((a) => a.memoryScore >= 7).length;
      var fair = MemoryScore.filter(
        (a) => a.memoryScore >= 3 && a.memoryScore < 7
      ).length;
      var poor = MemoryScore.filter((a) => a.memoryScore < 3).length;
      var total = good + fair + poor;
      Charts["MemoryHealth"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }

    if (CPUScore.length == 0) {
      Charts["CPUHealth"] = {
        Good: 0,
        Fair: 0,
        Poor: 0,
        GoodPercentage: 0,
        FairPercentage: 0,
        PoorPercentage: 0,
      };
    } else {
      var good = CPUScore.filter((a) => a.cpuScore >= 7).length;
      var fair = CPUScore.filter(
        (a) => a.cpuScore >= 3 && a.cpuScore < 7
      ).length;
      var poor = CPUScore.filter((a) => a.cpuScore < 3).length;
      var total = good + fair + poor;
      Charts["CPUHealth"] = {
        Good: good,
        Fair: fair,
        Poor: poor,
        GoodPercentage: (good * 100) / total,
        FairPercentage: (fair * 100) / total,
        PoorPercentage: (poor * 100) / total,
      };
    }
    FinalData["timestamp"] = timestamp;
    FinalData["Blocks"] = Block;
    FinalData["Charts"] = Charts;
    FinalData["DevicesList"] = rawData.map(FormatCriticalDevices);
    resolve(FinalData);
  });
}
function FormatCriticalDevices(item) {
  // const category=item.category;
  var element = {
    communicationState: item.communicationState,
    cpuScore: item.cpuScore,
    macAddress: item.macAddress,
    memoryScore: item.memoryScore,
    nwDeviceName: item.nwDeviceName,
    nwDeviceRole: item.nwDeviceRole,
    overallHealth: item.overallHealth,
  };
  return element;
}
function GetCriticalDashboardDataDB(APIToken) {
  return new Promise((resolve) => {
    var DeviceListFromCriticalDevicetbl = [];

    var TonightTime = new Date(
      new Date(
        new Date(
          new Date(new Date(Date.now()).setMinutes(0)).setSeconds(0)
        ).setMilliseconds(0)
      ).setHours(0)
    );

    var yesterday = new Date(TonightTime.getTime() - 24 * 60 * 60 * 1000);

    criticalTrend
      .find({
        timestamp: { $lt: TonightTime, $gte: yesterday },
      })
      .lean()
      .exec(function (err, doc) {
        DeviceListFromCriticalDevicetbl = doc;
        /* for(var aa=0;aa<DeviceListFromCriticalDevicetbl.length;aa++)
                {
                  var daaata= GetCriticalDeviceDetailByAPI(DeviceListFromCriticalDevicetbl[aa]);
                }
                */
        // var DeviceDetails=DeviceListFromCriticalDevicetbl.map(await GetCriticalDeviceDetailByAPI);
        resolve(doc);
      });
  });
}
function GetPackageDetailFromDB() {
  return new Promise((resolve) => {
    //var DeviceListFromCriticalDevicetbl=[];
    //            var Pkg = mongoose.model('Pkg', new Schema(), 'tbl_Package');
    Pkg.find({})
      .lean()
      .exec(function (err, doc) {
        PackageData = doc;

        PackageData[0].DnacPassWord = PackageData[0].DnacPassWord
          ? helpers.decrypt(PackageData[0].DnacPassWord, helpers.KeyPhrase)
          : "";

        PackageData[0].HardeningPassword = PackageData[0].HardeningPassword
          ? helpers.decrypt(
            PackageData[0].HardeningPassword,
            helpers.KeyPhrase
          )
          : "";

        PackageData[0].SolarWindDbPassword = PackageData[0].SolarWindDbPassword
          ? helpers.decrypt(
            PackageData[0].SolarWindDbPassword,
            helpers.KeyPhrase
          )
          : "";

        PackageData[0].PrimeFTPPassWord = PackageData[0].PrimeFTPPassWord
          ? helpers.decrypt(
            PackageData[0].PrimeFTPPassWord,
            helpers.KeyPhrase
          )
          : "";
        PackageData[0].ServiceNowPassword = PackageData[0].ServiceNowPassword
          ? helpers.decrypt(
            PackageData[0].ServiceNowPassword,
            helpers.KeyPhrase
          )
          : "";

        PackageData[0].ISEPassword = PackageData[0].ISEPassword
          ? helpers.decrypt(PackageData[0].ISEPassword, helpers.KeyPhrase)
          : "";
        resolve(doc);
      });
  });
}
function GetServiceListCPU() {
  return new Promise((resolve) => {
    //var DeviceListFromCriticalDevicetbl=[];
    //            var Pkg = mongoose.model('Pkg', new Schema(), 'tbl_Package');
    ServiceListData.find({
      $and: [{ KeyType: "CpuUtilization" }, { CurrentlyInUse: 1 }],
    })
      .lean()
      .exec(function (err, doc) {
        //  PackageData = doc;
        resolve(doc);
      });
  });
}
function GetServiceListMemory() {
  return new Promise((resolve) => {
    //var DeviceListFromCriticalDevicetbl=[];
    //            var Pkg = mongoose.model('Pkg', new Schema(), 'tbl_Package');
    ServiceListData.find({
      $and: [{ KeyType: "MemoryUtilization" }, { CurrentlyInUse: 1 }],
    })
      .lean()
      .exec(function (err, doc) {
        //  PackageData = doc;
        resolve(doc);
      });
  });
}
//Manish Work Starts
function UpdateDataInDeviceList() {
  return new Promise((resolve) => {
    var dummyData1 = {
      apManagerInterfaceIp: "",
      associatedWlcIp: "",
      bootDateTime: "2019-12-14 08:20:10",
      collectionStatus: "Managed",
      serialNumber: "FDO2110A0KQ",
      upTime: "12 days, 5:08:04.87",
      collectionInterval: "Global Default",
      inventoryStatusDetail: '<status><general code="SUCCESS"/></status>',
      lastUpdateTime: 1577366890847.0,
      hostname: "13V1R01.vspllab.in",
      macAddress: "80:d3:79:ed:27:50",
      softwareType: "IOS-XE",
      softwareVersion: "3.16.4",
      deviceSupportLevel: "Supported",
      errorCode: null,
      errorDescription: null,
      family: "Routers",
      interfaceCount: "0",
      lastUpdated: "2019-12-26 13:28:10",
      lineCardCount: "0",
      lineCardId: "",
      locationName: null,
      managementIpAddress: "10.122.1.8",
      memorySize: "NA",
      platformId: "ISR4331/K9",
      reachabilityFailureReason: "",
      reachabilityStatus: "Reachable",
      series: "Cisco 4000 Series Integrated Services Routers",
      snmpContact: "",
      snmpLocation: "",
      tagCount: "0",
      tunnelUdpPort: null,
      waasDeviceMode: null,
      roleSource: "AUTO",
      location: null,
      type: "Cisco 4331 Integrated Services Router",
      role: "BORDER ROUTER",
      instanceUuid: "f938c21d-b2a4-40c2-bbda-1d797abd1b0d",
      instanceTenantId: "5c38a503d3c21e004cec6004",
      id: "f938c21d-b2a4-40c2-bbda-1d797abd1b0d",
    };
    var dummyData2 = {
      apManagerInterfaceIp: "",
      associatedWlcIp: "",
      bootDateTime: "2019-12-14 08:20:10",
      collectionStatus: "Managed",
      serialNumber: "FDO2110A0KQ",
      upTime: "12 days, 5:08:04.87",
      collectionInterval: "Global Default",
      inventoryStatusDetail: '<status><general code="SUCCESS"/></status>',
      lastUpdateTime: 1577366890847.0,
      hostname: "14V1R01.vspllab.in",
      macAddress: "90:d3:79:ed:27:50",
      softwareType: "IOS-XE",
      softwareVersion: "3.16.4",
      deviceSupportLevel: "Supported",
      errorCode: null,
      errorDescription: null,
      family: "Routers",
      interfaceCount: "0",
      lastUpdated: "2019-12-26 13:28:10",
      lineCardCount: "0",
      lineCardId: "",
      locationName: null,
      managementIpAddress: "10.122.1.8",
      memorySize: "NA",
      platformId: "ISR4331/K9",
      reachabilityFailureReason: "",
      reachabilityStatus: "Reachable",
      series: "Cisco 4000 Series Integrated Services Routers",
      snmpContact: "",
      snmpLocation: "",
      tagCount: "0",
      tunnelUdpPort: null,
      waasDeviceMode: null,
      roleSource: "AUTO",
      location: null,
      type: "Cisco 4331 Integrated Services Router",
      role: "BORDER ROUTER",
      instanceUuid: "f938c21d-b2a4-40c2-bbda-1d797abd1b0d",
      instanceTenantId: "5c38a503d3c21e004cec6004",
      id: "f938c21d-b2a4-40c2-bbda-1d797abd1b0d",
    };

    //RawNetworkHealthDevices.push(dummyData1);
    //RawNetworkHealthDevices.splice(0, 1)
    // RawNetworkHealthDevices.push(dummyData2);
    var SameDeviceList = RawNetworkHealthDevices.filter(function (obj) {
      return ListAllDevicesFromDB.some(function (obj2) {
        return obj.macAddress == obj2.macAddress;
      });
    });
    var DeviceListInDBNotInAPI = ListAllDevicesFromDB.filter(function (obj) {
      return !RawNetworkHealthDevices.some(function (obj2) {
        return obj.macAddress == obj2.macAddress;
      });
    });

    var DeviceListInAPINotInDB = RawNetworkHealthDevices.filter(function (obj) {
      return !ListAllDevicesFromDB.some(function (obj2) {
        return obj.macAddress == obj2.macAddress;
      });
    });

    if (
      DeviceListInDBNotInAPI.length == 0 &&
      DeviceListInAPINotInDB.length > 0
    ) {
      DeviceListInAPINotInDB.forEach((element) => {
        element["Action"] = "0";
        element["LastUpdateRecievedOn"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        // element["timestamp"] =new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0));
        InsertVerification = InsertData(element, "tbl_CriticalDevices", db);
      });
    } else if (
      DeviceListInDBNotInAPI.length == 0 &&
      DeviceListInAPINotInDB.length == 0
    ) {
      SameDeviceList.map(EachDataUpdate);
    } else {
      if (DeviceListInAPINotInDB.length > 0) {
        DeviceListInAPINotInDB.forEach((element) => {
          element["Action"] = "0";
          element["LastUpdateRecievedOn"] = new Date(
            new Date(
              new Date(
                new Date(Date.now()).setMinutes(
                  parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                )
              ).setSeconds(0)
            ).setMilliseconds(0)
          );
          InsertVerification = InsertData(element, "tbl_CriticalDevices", db);
        });
      }
      if (SameDeviceList.length > 0) {
        SameDeviceList.map(EachDataUpdate);
      }
    }
    // CriticalDevice.deleteMany({ Mac_Address: arrNonCriticalDevicesMac }, function (err) {
    //     if(err) console.log(err);
    //   });
  });
}
function EachDataUpdate(item) {
  // var dataToUpdate = await item.macAddress;
  db.collection("tbl_CriticalDevices").update(
    { macAddress: item.macAddress },
    {
      $set: {
        LastUpdateRecievedOn: new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        ),
      },
    },
    function (err, result) {
      if (err) throw err;
    }
  );
}
//Manish Work Ends
function DataFromSWModels(item) {
  var element = {
    SolarWindsId: item.SolarWindsId,
    NodeID: item.NodeID,
    NodeName: item.NodeName,
    TotalMemory: item.TotalMemory,
    MemoryUsed: item.MemoryUsed,
    Machine_Type: item.Machine_Type,
    Status: item.Status,
    Status_Description: item.Status_Description,
    Response_Time: item.Response_Time,
    CPULoad: item.CPULoad,
    PercentMemoryUsed: item.PercentMemoryUsed,
    SiteType: item.SiteType,
    Locations: item.Locations,
    DeviceType: item.DeviceType,
    IP_Address: item.IP_Address,
    timestamp: new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    ),
  };
  return element;
}
function InsertData(json, CollectionName, db) {
  return new Promise((resolve) => {
    db.collection(CollectionName).insertOne(json, function (error, result) {
      if (error) throw error;
      resolve(result);
    });
  });
}

// var SupportingTask = cron.schedule("1 * * * * *", () => {
//   if (new Date(StartTime) < new Date(Date.now())) {

//     MainTask.schedule = true;
//     // MainTask.start();

//     DailySlaTask.schedule = true;
//     // DailySlaTask.start();

//     PrimeTask.schedule = true;
//     // PrimeTask.start();

//     SolarwindCPUMemoryTrendTask.schedule = true;
//     // SolarwindCPUMemoryTrendTask.start();

//     MerakiTask.schedule = true;
//     // MerakiTask.start();

//     HardningiTask.schedule = true;
//     // HardningiTask.start();

//     PsirtTask.schedule = true;
//     // PsirtTask.start();

//     SolarwindTask.schedule = true;
//     // SolarwindTask.start();

//     CriticalTask.schedule = true;
//     // CriticalTask.start();

//     ArchieveServiceNowTask.schedule = true;
//     // ArchieveServiceNowTask.start();

//     ServiceNowTask.schedule = true;
//     // ServiceNowTask.start();

//     TimeInsertTask.schedule = true;
//     // TimeInsertTask.start();

//     MerakiTrafficTrendTask.schedule = true;
//     // MerakiTrafficTrendTask.start();

//     SupportingTask.stop();
//   }
// });

function groupBy(array, f) {
  var groups = {};
  array.forEach(function (o) {
    var group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
}
function InsertNWDetailToClientArray(item) {
  let obj = {};
  obj["NetworkId"] = item[0].networkid;
  obj["NetworkName"] = item[0].networkname;
  obj["Data"] = [...item];
  return obj;
}

const giveIconType = (family) => {
  if (family == "Routers") {
    return "router"
  } else if (family == "cloud node") {
    return "cloud"
  } else {
    return "switch"
  }
}

const getSiteTopologyData = async (data, db) => {
  data.nodes.filter((ele, i) => {
    if (ele.deviceType.includes("cloud")) {
      ele.deviceId = 0;
    } else {
      ele.deviceId = i + 1;
    }
  })
  data.links.filter(ele => {
    data.nodes.forEach(val => {
      if (ele.source == val.id) {
        ele.sourceId = val.deviceId;
      }
      if (ele.target == val.id) {
        ele.targetId = val.deviceId;
      }
    })
  })

  const siteObj = {};
  data.nodes.forEach(elm => {
    if (elm.additionalInfo) {
      if (elm.additionalInfo.siteid) {
        if (!siteObj[elm.additionalInfo.siteid]) {
          siteObj[elm.additionalInfo.siteid] = {
            nodes: [{
              "Type": elm.deviceType,
              "IP": elm.ip,
              "Role": elm.role,
              "Family": elm.family,
              "name": elm.label,
              "iconType": giveIconType(elm.family),
              "id": elm.id,
            }],
          };
        } else {
          siteObj[elm.additionalInfo.siteid].nodes.push({
            "Type": elm.deviceType,
            "IP": elm.ip,
            "Role": elm.role,
            "Family": elm.family,
            "name": elm.label,
            "iconType": giveIconType(elm.family),
            "id": elm.id,
          });
        }
        data.links.forEach(val => {
          if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
            if (siteObj[elm.additionalInfo.siteid].links) {
              siteObj[elm.additionalInfo.siteid].links.push({
                "source": val.source,
                "target": val.target,
                "id": val.id,
                "linkStatus": val.linkStatus
              })
            } else {
              siteObj[elm.additionalInfo.siteid] = {
                ...siteObj[elm.additionalInfo.siteid],
                links: [{
                  "source": val.source,
                  "target": val.target,
                  "id": val.id,
                  "linkStatus": val.linkStatus
                }]
              }
            }
          }
        })
      } else {
        siteObj[""] = {
          nodes: [{
            "Type": elm.deviceType,
            "IP": elm.ip,
            "Role": elm.role,
            "Family": elm.family,
            "name": elm.label,
            "iconType": giveIconType(elm.family),
            "id": elm.id,
          }],
        };
        data.links.forEach(val => {
          if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
            if (siteObj[""].links) {
              siteObj[""].links.push({
                "source": val.source,
                "target": val.target,
                "id": val.id,
                "linkStatus": val.linkStatus
              })
            } else {
              siteObj[""] = {
                ...siteObj[""],
                links: [{
                  "source": val.source,
                  "target": val.target,
                  "id": val.id,
                  "linkStatus": val.linkStatus
                }]
              }
            }
          }
          // 
          // if (elm.deviceId == val.targetId) {
          //   console.log("target",val.targetId,elm.deviceId)
          // }
        })
      }
    }
    if (elm.deviceType.includes("cloud")) {
      for (let [key, value] of Object.entries(siteObj)) {
        if (key !== '') {
          value.nodes.push({
            "Type": elm.deviceType,
            "IP": elm.ip,
            "Role": elm.role,
            "Family": elm.family,
            "name": elm.label,
            "iconType": giveIconType(elm.family),
            "id": elm.id,
          });
          data.links.forEach(val => {
            if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
              if (value.links) {
                value.links.push({
                  "source": val.source,
                  "target": val.target,
                  "id": val.id,
                  "linkStatus": val.linkStatus
                })
              } else {
                value = {
                  ...value,
                  links: [{
                    "source": val.source,
                    "target": val.target,
                    "id": val.id,
                    "linkStatus": val.linkStatus
                  }]
                }
              }
            }
            // 
            // if (elm.deviceId == val.targetId) {
            //   console.log("target",val.targetId,elm.deviceId)
            // }
          })
        }
      }
    }
  })

  for (let [key, value] of Object.entries(siteObj)) {
    if (value.links) {
      uniqueLinksObj = {};
      value.links.forEach(link => {
        const uniqueId = `${link.source}#${link.target}#${link.id}`;
        if (!uniqueLinksObj[uniqueId]) {
          uniqueLinksObj[uniqueId] = link;
        }
      });
      uniqueLinks = Object.values(uniqueLinksObj);
      value.links = [...uniqueLinks];
    }
  }
  const finalData = Object.keys(siteObj).map(key => {
    siteObj[key].siteid = key;
    return siteObj[key];
  });
  let objd = {
    siteData: [...finalData],
    timestamp: new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    )
  }
  await InsertData(objd, "SiteMapTopology", db);
}

const updateVipMappingData = async (ClientHealthDataDrill) => {
  let result = {};
  const vipData = await db.collection('Vip_Mapping').find().toArray();
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));

  if (vipData && vipData.length === 0) {
    const vipMappingData = getVipMappingData(ClientHealthDataDrill, timeStamp);
    result = await db.collection('Vip_Mapping').insertMany(vipMappingData);
  } else {
    const existingVipData = vipData.map(device => device.hostMac);

    for (let device of ClientHealthDataDrill.recordset) {
      if (!existingVipData.includes(device.hostMac)) {
        const vipMappingData = createVipObj(device, timeStamp);
        result = await db.collection('Vip_Mapping').insertOne(vipMappingData);
      }
    };
  }
  return result;
}

const getVipMappingData = (data, timeStamp) => {
  const vipMappingData = data.recordset.map(device => {
    return createVipObj(device, timeStamp);
  });
  return vipMappingData;
}

const createVipObj = (device, timeStamp) => {
  return {
    hostMac: device.hostMac,
    userName: device.username,
    hostIp: device.hostIp,
    hostType: device.hostType,
    connectedNetworkDeviceIp: device.connectedNetworkDeviceIpAddress,
    connectedNetworkDeviceId: device.connectedNetworkDeviceId,
    connectedNetworkDeviceName: device.connectedNetworkDeviceName,
    isVip: false,
    isSoftDeleted: false,
    timestamp: timeStamp
  }
}

const getClientDetails = async () => {
  const macAddressData = await db.collection('Vip_Mapping').find({ "isVip": true }, { hostMac: 1 }).toArray();
  const macAddressArray = macAddressData.map(device => device.hostMac);
  const headers = { "x-auth-token": APIToken.Token };
  const apiTimeStamp = Math.round(new Date().getTime() / 1000) * 1000;
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));

  for (let macAddress of macAddressArray) {
    const apiUrl = `${PackageData[0].DnacClientDetailsAPI}?timestamp=${apiTimeStamp}&macAddress=${macAddress}`;
    const res = await axios.get(apiUrl, { headers: headers });
    if (res) {
      const data = res.data.detail;
      const obj = {
        "connectionStatus": data.connectionStatus,
        "hostType": data.hostType,
        "hostMac": data.hostMac.toLowerCase(),
        "hostName": data.hostName,
        "hostOs": data.hostOs,
        "subType": data.subType,
        "hostIpV4": data.hostIpV4,
        "lastUpdated": data.lastUpdated,
        "ssid": data.ssid,
        "authType": data.authType,
        "healthScore": data.healthScore,
        "location": data.location,
        "timestamp": timeStamp
      };
      await InsertData(obj, "clientDetails", db);
    }
  }
}

const updateOauth2AccessTokenCron = () => {
  updateTokenResult = cron.schedule('0 7 3 * *', async () => {
    await funcUpdateOauth2Tokens();
  },
    { scheduled: false }
  );
  return updateTokenResult;
};

const funcUpdateOauth2Tokens = async () => {
  // try {
    let msalClientId = '';
    let msalClientkey = '';
    const msalData = await db.collection("tbl_Package").find({}).project({ ApplicationID: 1, SecretKey: 1 }).toArray();
    if (msalData && msalData.length > 0) {
      msalClientId = msalData[0].ApplicationID;
      msalClientkey = msalData[0].SecretKey;
    }
    const tokensSaved = await db.collection("TblServiceList").find({
      "KeyType": "MailerCredentialOAuth2", "Key": "Token", "CurrentlyInUse": 1
    }).toArray();
    if (tokensSaved && tokensSaved.length > 0 && tokensSaved[0].Value) {
      const refreshTokenValue = helpers.decrypt(tokensSaved[0].Value.RefreshToken, helpers.KeyPhrase);
      const tenantIdValue = tokensSaved[0].Value.tenantId;
      const clientIdValue = helpers.decrypt(msalClientId, helpers.KeyPhrase)
      const refreshTokenRequest = {
        "grant_type": "refresh_token",
        "client_id": clientIdValue,       
        "client_secret": helpers.decrypt(msalClientkey, helpers.KeyPhrase),
        "refresh_token": refreshTokenValue,        
      }
      const REFRESH_TOKEN_URL = `https://login.microsoftonline.com/${tenantIdValue}/oauth2/v2.0/token`
      const response = await axios.post(REFRESH_TOKEN_URL, new URLSearchParams(refreshTokenRequest),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

      if (response && response.data) {
        const newTokensData = response.data;
        const newAccessToken = helpers.encrypt(newTokensData.access_token, helpers.KeyPhrase);
        const newRefreshToken = helpers.encrypt(newTokensData.refresh_token, helpers.KeyPhrase);
        const tokenExpiresInMin = newTokensData.expires_in / 60;
        const newTokenExpireTime = moment(new Date()).add(tokenExpiresInMin, 'm').toDate()

        const result = await db.collection("TblServiceList").updateOne({
          "KeyType": "MailerCredentialOAuth2", "Key": "Token", "CurrentlyInUse": 1
        }, {
          $set: {
            'Value.accessToken': newAccessToken, 'Value.RefreshToken': newRefreshToken,
            'Value.expiresOn': new Date(newTokenExpireTime)
          }
        });
        if (result) {
          console.log('OAuth2 Tokens Updated Successfully.')
        }
      }
    }
  // } catch (err) {
    // console.error(err);
  // }
}


//var request = new sql.Request();
/*
 request.query('select * from Access', function (err, recordset) {
     if (err) console.log(err)
     // send records as a response
     //res.send(recordset);
 });
*/

/*
var persons=[{id:1,Name:'Person1'},{id:2,Name:'Person2'},{id:3,Name:'Person3'}];
var addresses=[{id:1,City:'Delhi'},{id:2,City:'Mumbai'},{id:3,City:'Chennai'}];
var DataNew=persons.reduce((result, person) =>
result.concat([{
  Person: person,
  Addresses: addresses.filter((a) => a.id === person.id)
}]), [])
.filter((pa) => pa.Addresses.length)
const FormattedData=DataNew.map(ChangeFormat);
*/

/*

 function TestSQL(request)
 {
    return new Promise(resolve =>
        {
    request.query('select * from Access', function (err, recordset)
    {
    if (err) console.log(err)
       for(var i=0;i<=10000;i++)
       {
       }
       resolve(recordset);
    });
        });
 }

 function getNetworkList()
{
        return new Promise(resolve =>
            {
        axios.get('https://api.meraki.com/api/v0/organizations/775051/networks',{ headers: {'X-Cisco-Meraki-API-Key':'8f061340df0684d187f55c1b9e77efdd1445e7c0'}})
        .then(function (response) {
            resolve(response);
        })
        .catch(function (error) {
            // handle error
        })
        .finally(function () {
            // always executed
        });
        });
}


function ChangeFormat(item)
{
    var element = {
        Id:item.Person.id,
        Name: item.Person.Name,
        City:item.Addresses[0].City,
        timestamp:new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0))
    }
    return element;
}

*/

const fetchCliRepoData = async () => {
  // try {
    const PackageData = await GetPackageDetailFromDB();
    const APIToken = await GetToken();
    const config = {
      headers: {
        "x-auth-token": APIToken.Token
      },
    };
    const viewGroupId = await getCliRepoViewGrpId(PackageData, config);
    await updateCliRepViewGrpId(viewGroupId)
    const viewId = await getCliRepoViewId(PackageData, config, viewGroupId);
    await updateCliRepViewId(viewId)
  // } catch (error) {
    // console.log(error)
  // }
}

const clientReportExecApis = async (Token, PackageData, cronTime, cliDetConfig) => {
  // try {
    let finalData = {};
    const endDateTime = new Date().getTime();
    const startDateTime = endDateTime - (cronTime * 60 * 1000)
    const config = {
      headers: {
        "x-auth-token": Token.Token
      },
    };
    let reportId = await getClientReportId(PackageData, config, endDateTime, startDateTime);
    const executionId = await getReportExecutionId(PackageData, config, reportId);
    if (executionId) {
      let FinalRepExecData = await getFinalRepExecData(PackageData, config, reportId, executionId, cliDetConfig);
      finalData = { ...FinalRepExecData }
    }
    if (reportId) {
      await deleteReportSchedule(PackageData, config, reportId);
    }
    return finalData;
  // } catch (error) {
  //   console.error(error);
  // }
}

const getCliRepoViewId = async (PackageData, config, viewGroupId) => {
  // try {
    let viewId = "";
    let api = PackageData[0].DnacViewIdAPI;
    let newApi = api.replace("{viewGroupId}", viewGroupId);
    let { data } = await axios.get(`${newApi}`, config);
    if (Object.keys(data).length && data.views.length) {
      data.views.forEach(ele => {
        if (ele.viewName == "Client Detail") {
          viewId = ele.viewId;
        }
      })
    }
    return viewId;
  // } catch (error) {
  //   console.log(error)
  // }
}

const getClientReportId = async (PackageData, config, endDateTime, startDateTime) => {
  // try {
    let body = await getCliRepoReqBody();
    body.name = `${body.name}_${new Date().getTime()}`;
    body.view.filters.forEach(ele => {
      if (ele.type === "TIME_RANGE" && ele.name === "TimeRange") {
        ele.value.startDateTime = startDateTime;
        ele.value.endDateTime = endDateTime;
      }
    });
    let reportId = "";
    let api = PackageData[0].DnacMainCliRepAPI;
    let { data } = await axios.post(api, body, config);
    if (Object.keys(data).length) {
      reportId = data.reportId;
    }
    return reportId;
  // } catch (error) {
  //   console.log(error)
  // }
}

const getCliRepoReqBody = async () => {
  // try {
    let result = undefined;
    let reqBody = await db.collection("TblServiceList").find({
      KeyType: "clientReport",
      Key: "cliRepReqBody",
      CurrentlyInUse: 1,
    }).project({ Value: 1 }).toArray();
    if (reqBody.length !== 0) {
      result = reqBody[0].Value;
    }
    return result;
  // } catch (error) {
    // console.log(error)
  // }
}

const getCliRepViewIds = async () => {
  // try {
    let result = [];
    let data = await db.collection("TblServiceList").find({
      $or: [
        { KeyType: "clientReport", Key: "viewGroupId", CurrentlyInUse: 1 },
        { KeyType: "clientReport", Key: "viewId", CurrentlyInUse: 1 }
      ]
    }).project({ Key: 1, Value: 1 }).toArray();
    if (data.length !== 0) {
      result = [...data];
    }
    return result;
  // } catch (error) {
  //   console.log(error)
  // }
}

const updateCliRepViewId = async (viewId) => {
  // try {
    await db.collection("TblServiceList").updateOne({
      "KeyType": "clientReport",
      "Key": "viewId",
      "CurrentlyInUse": 1,
    }, { $set: { Value: viewId } });
    await db.collection("TblServiceList").updateOne({
      "KeyType": "clientReport",
      "Key": "cliRepReqBody",
      "CurrentlyInUse": 1,
    }, { $set: { "Value.view.viewId": viewId } });
  // } catch (error) {
  //   console.log(error)
  // }
}

const getFinalRepExecData = async (PackageData, config, reportId, executionId, cliDetConfig) => {
  // try {
    let recordset = [];
    let api = PackageData[0].DnacRepExecAPI;
    let newApi = api.replace("{reportId}", reportId).replace("{executionId}", executionId);
    let { data } = await axios.get(`${newApi}`, config);
    if (Object.keys(data).length) {
      let proFinalData = processFinalRepData(data.client_details)
      recordset = [...proFinalData];
    }
    return {
      recordset, timestamp: new Date(
        new Date(
          new Date(
            new Date(Date.now()).setMinutes(
              parseInt(new Date(Date.now()).getMinutes() / 5) * 5
            )
          ).setSeconds(0)
        ).setMilliseconds(0)
      ), dataFetchFrom: cliDetConfig
    };
  // } catch (error) {
  //   console.log(error)
  // }
}

const chkCliRepDetails = async () => {
  // try {
    let oldViewId = "";
    let oldviewGroupId = "";
    const PackageData = await GetPackageDetailFromDB();
    APIToken = await GetToken();
    const config = {
      headers: {
        "x-auth-token": APIToken.Token
      },
    };
    let oldData = await getCliRepViewIds();
    oldData.forEach(ele => {
      if (ele.Key === "viewId") {
        oldViewId = ele.Value;
      }
      if (ele.Key === "viewGroupId") {
        oldviewGroupId = ele.Value;
      }
    })
    const newViewGroupId = await getCliRepoViewGrpId(PackageData, config);
    if (oldviewGroupId !== newViewGroupId) {
      await updateCliRepViewGrpId(newViewGroupId);
    }
    let newViewId = await getCliRepoViewId(PackageData, config, newViewGroupId);
    if (oldViewId !== newViewId) {
      await updateCliRepViewId(newViewId);
    }
  // } catch (error) {
  //   console.log(error)
  // }
}

const getReportExecutionId = async (PackageData, config, reportId) => {
  let executionId = null;
  let apiUrl = PackageData[0].DnacReportAPI;
  apiUrl = apiUrl.replace('{reportId}', reportId);
  let retryCount = 1;
  const currentTime = new Date();
  while (true) {
    const result = await axios.get(apiUrl, config);
    if (result && result.data && result.data.executions.length && result.data.executions[0].processStatus === "SUCCESS") {
      executionId = result.data.executions[0].executionId;
      break;
    }

    await addDelay(30000);
    const timeNow = new Date();
    if (timeNow.getTime() - currentTime.getTime() > 600000) {
      break;
    }
  }
  return executionId;
}

const addDelay = ms => new Promise(res => setTimeout(res, ms));

const deleteReportSchedule = async (PackageData, config, reportId) => {
  let apiUrl = PackageData[0].DnacReportAPI;
  apiUrl = apiUrl.replace('{reportId}', reportId);
  const result = await axios.delete(apiUrl, config);
  return result;
}

const getCliRepoViewGrpId = async (PackageData, config) => {
  // try {
    let viewGroupId = "";
    let api = PackageData[0].DnacViewGrpAPI;
    let { data } = await axios.get(`${api}`, config);
    if (data.length) {
      data.forEach(ele => {
        if (ele.category === "Client") {
          viewGroupId = ele.viewGroupId;
        }
      })
    }
    return viewGroupId;
  // } catch (error) {
  //   console.log(error)
  // }
}

const updateCliRepViewGrpId = async (viewGroupId) => {
  // try {
    await db.collection("TblServiceList").updateOne({
      "KeyType": "clientReport",
      "Key": "viewGroupId",
      "CurrentlyInUse": 1,
    }, { $set: { Value: viewGroupId } });
    await db.collection("TblServiceList").updateOne({
      "KeyType": "clientReport",
      "Key": "cliRepReqBody",
      "CurrentlyInUse": 1,
    }, { $set: { "Value.viewGroupId": viewGroupId } });
  // } catch (error) {
  //   console.log(error)
  // }
}

const cliRepDetailUpdateCron = () => {
  cliRepDetailUpdateTask = cron.schedule(
    `5 0 * * *`,
    async () => {
      let cliDetConfig = await getCliDetaConfig()
      if (cliDetConfig === "Report") {
        await chkCliRepDetails();
      }
    },
    { scheduled: false }
  );
  return cliRepDetailUpdateTask;
};

const getCliDetaConfig = async () => {
  // try {
    let data = "";
    let result = await db.collection("TblServiceList").find({
      "KeyType": "clientReport",
      "Key": "confiurationStatus",
      "CurrentlyInUse": 1,
    }).project({ Value: 1 }).toArray();
    if (result.length !== 0) {
      data = result[0].Value;
    }
    return data;
  // } catch (error) {
  //   console.log(error)
  // }
}

const processFinalRepData = (data) => {
  console.log("data",data);
  const cliRepData = data.map(device => {
    return createCliObj(device);
  });
  return cliRepData;
}

const createCliObj = (device) => {
  return {
    hostName: device.deviceType !== "Wired" && device.hostName !== "--" ? device.hostName : "",
    username: device.username !== '--' ? device.username : "",
    hostIp: device.ipv4,
    hostMac: device.macAddress && device.macAddress.toLowerCase(),
    hostType: device.deviceType,
    connectedNetworkDeviceName: device.connectedDeviceName,
    vlanId: device.vlan,
    lastUpdated: device.lastUpdated,
    accessVLANId: device.vlan,
    hostIps: device.ipv4,
    averageHealthScore_min: device.averageHealthScore_min,
    averageHealthScore_max: device.averageHealthScore_max,
    averageHealthScore_median: device.averageHealthScore_median,
    usage_sum: device.usage_sum,
    frequency: device.frequency,
    rssi_median: device.rssi_median,
    snr_median: device.snr_median,
    site: device.site,
    apGroup: device.apGroup,
    ssid: device.ssid,
    vnid: device.vnid,
    onboardingEventTime: device.onboardingEventTime,
    assocDoneTimestamp: device.assocDoneTimestamp,
    authDoneTimestamp: device.authDoneTimestamp,
    aaaServerIp: device.aaaServerIp,
    dhcpDoneTimestamp: device.dhcpDoneTimestamp,
    maxDhcpDuration_max: device.maxDhcpDuration_max,
    dhcpServerIp: device.dhcpServerIp,
    linkSpeed: device.linkSpeed,
    txRate_min: device.txRate_min,
    txRate_max: device.txRate_max,
    txRate_avg: device.txRate_avg,
    rxRate_min: device.rxRate_min,
    rxRate_max: device.rxRate_max,
    rxRate_avg: device.rxRate_avg,
    txBytes_sum: device.txBytes_sum,
    rxBytes_sum: device.rxBytes_sum,
    dataRate_median: device.dataRate_median,
    dot11Protocol: device.dot11Protocol
  }
}

const getDNACIssueData = async (Token, db, TblData, cronTime) => {
  // try {
    const priorityArr = ['P1', 'P2', 'P3', 'P4'];
    let responseData = [];
    let version;
    const endDateTime = new Date().getTime();
    const startDateTime = endDateTime - (parseInt(cronTime) * 60 * 1000);
    const config = { headers: { "x-auth-token": Token } };
    for (let val of priorityArr) {
      let { data } = await axios.get(`${TblData.DNACIssuesApi}?startTime=${startDateTime}&endTime=${endDateTime}&priority=${val}`, config);
      version = data.version;
      responseData = [...responseData, ...data.response];
      await addDelay(5000);
    }
    const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
      parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
    const newData = { version: version, timeStamp: timeStamp, Data: responseData }
    InsertData(newData, "DnacIssues", db);
    return responseData;
  // } catch (error) {
  //   console.log(error);
  // }
}

const getIssueDrillDownData = async (APIToken, dnacIssueData) => {
  const apiUrl = PackageData[0].DnacIssueEnrichment;
  const siteWiseIssues = [];

  for (let issue of dnacIssueData) {
    const headers = {
      "x-auth-token": APIToken.Token,
      "entity_type": 'issue_id',
      "entity_value": issue.issueId
    };
    const result = await axios.get(apiUrl, { headers: headers });
    if (result) {
      siteWiseIssues.push(...result.data.issueDetails.issue);
    }
    await addDelay(15000)
  }
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
  const finalData = {
    timeStamp: timeStamp,
    Data: siteWiseIssues
  }
  InsertVerification = InsertData(finalData, "DnacIssuesDrillDown", db);
}

const getVipConfigStatus = async () => {
  return await db.collection("TblServiceList").find({ KeyType: "VIPConfigStatus", CurrentlyInUse: 1 },
    { Value: 1 }).toArray();
}

const getVipPostureData = async (config, cronTime) => {
  const macAddressData = await db.collection('Vip_Mapping').find({ "isVip": true }, { userName: 1, hostMac: 1 }).toArray();
  const clientsLocation = await getClientsLocation();
  const vipPostureObj = { Data: [] };
  const vipCliAuthObj = { Data: [] };

  for (let userData of macAddressData) {
    if (userData.hostMac) {
      userData.hostMac = userData.hostMac.toUpperCase();
      const apiUrl = `${PackageData[0].ISEClientPostureApi}/${userData.hostMac}`;
      try {
        const postureData = await axios.get(apiUrl, config);
        if (postureData.status) {
        }
        if (postureData && postureData.data) {
          let jsonObj = xml2JsonParser.parse(postureData.data);

          const clientLocation = await addClientLocation(jsonObj.sessionParameters.calling_station_id, clientsLocation);
          const filterVipPostureData = getFilterVipPostureData(jsonObj.sessionParameters);
          filterVipPostureData.clientLocation = clientLocation;
          vipPostureObj.Data.push(filterVipPostureData);
        }
      } catch (error) {
        console.error('ISEClientPostureApi', error);
      }
      let authArrData = await getVipAuthStatusData(userData, cronTime, config, clientsLocation);
      if (authArrData && authArrData.length > 0) {
        vipCliAuthObj.Data.push(authArrData[0])
      }
    }
  }

  await buildAuthDtaColl(vipPostureObj, "vipClientPosturesDrill", db, "vipClientPostures");
  await buildAuthDtaColl(vipCliAuthObj, "vipClientAuthDrill", db, "vipClientAuthentication");
};

const getVipAuthStatusData = async (userData, cronTime, config, clientsLocation) => {
  const authApiUrl = replaceDnacVal(PackageData[0].ISEAuthStatusApi, userData.hostMac, (parseInt(cronTime) * 60));
  // const authApiUrl = `https://10.18.1.90/admin/API/mnt/AuthStatus/MACAddress/E8:D0:FC:F6:BB:E5/500000/500/All`;
  try {
    let finalData = [];
    const AuthStatusData = await axios.get(authApiUrl, config);
    if (AuthStatusData && AuthStatusData.data) {
      let authEleCallingId = null;
      let authJsonObj = xml2JsonParser.parse(AuthStatusData.data);
      if (authJsonObj.authStatusOutputList.authStatusList && authJsonObj.authStatusOutputList.authStatusList.authStatusElements && authJsonObj.authStatusOutputList.authStatusList.authStatusElements.length) {
        if (authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0] && authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0].calling_station_id) {
          authEleCallingId = authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0].calling_station_id
        }
      }
      const authClientLocation = await addClientLocation(authEleCallingId, clientsLocation);
      let authArr = authJsonObj.authStatusOutputList.authStatusList && authJsonObj.authStatusOutputList.authStatusList.authStatusElements && authJsonObj.authStatusOutputList.authStatusList.authStatusElements.map(ele => {
        return createISEAuthObj(ele, authClientLocation)
      })
      if (authArr && authArr.length) {
        finalData = [...authArr]
      }
    }
    return finalData;
  } catch (error) {
    console.error('ISEAuthStatusApi', error);
  }
}

const buildAuthDtaColl = async (vipObj, collection1, db, collection2) => {
  const timestamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
  vipObj.timestamp = timestamp;
  checkVIPCliFailureCond(vipObj.Data, collection2);
  InsertVerification = await InsertData(vipObj, collection1, db);
  if (InsertVerification) {
    const customVipAuthData = await getCustomVipPostureData(timestamp, collection1);
    InsertVerification = await InsertData(customVipAuthData, collection2, db);
  }
}

const createISEAuthObj = (device, authClientLocation) => {
  return {
    user_name: device.user_name,
    nas_ip_address: device.nas_ip_address,
    calling_station_id: device.calling_station_id,
    posture_status: device.posture_status,
    identity_group: device.identity_group,
    network_device_name: device.network_device_name,
    acs_server: device.acs_server,
    authentication_method: device.authentication_method,
    acs_timestamp: device.acs_timestamp,
    selected_azn_profiles: device.selected_azn_profiles,
    authentication_protocol: device.authentication_protocol,
    clientLocation: authClientLocation
  }
};

const getClientsLocation = async () => {
  const clientsLocation = await db.collection('clientDetails').aggregate([
    { $sort: { timestamp: -1 } }, { $project: { hostMac: 1, location: 1 } },
    {
      $group: {
        _id: '$hostMac', location: { $addToSet: '$location' }
      }
    }, { $unwind: '$location' }
  ]).toArray();
  return clientsLocation;
}

const addClientLocation = async (calling_station_id, clientsLocation) => {
  let clientLocation = '';
  if (calling_station_id) {
    for (let clientLoc of clientsLocation) {
      if (clientLoc._id.toLowerCase() === calling_station_id.toLowerCase()) {
        clientLocation = clientLoc.location;
        break;
      }
    };
  }
  return clientLocation;
}

const getCustomVipPostureData = async (timestamp, collectName) => {
  const locWiseVipPosture = { timestamp: timestamp, Data: [] };
  const data = await db.collection(collectName).aggregate([
    { $match: { timestamp: { $eq: new Date(timestamp) } } },
    { $project: { 'Data.posture_status': 1, 'Data.clientLocation': 1 } }, { $unwind: '$Data' },
    { $project: { posture_status: '$Data.posture_status', location: '$Data.clientLocation' } },
    {
      $group: {
        _id: '$location',
        TotalClient: { $sum: 1 },
        Compliant: { "$sum": { "$cond": [{ $eq: ["$posture_status", 'Compliant'] }, 1, 0] } },
        NonCompliant: { "$sum": { "$cond": [{ $eq: ["$posture_status", 'NonCompliant'] }, 1, 0] } },
        Pending: { "$sum": { "$cond": [{ $eq: ["$posture_status", 'Pending'] }, 1, 0] } },
        Unknown: { "$sum": { "$cond": [{ $eq: ["$posture_status", ''] }, 1, 0] } }
      }
    }
  ]).toArray();

  if (data && data.length) {
    data.forEach(elm => {
      locWiseVipPosture.Data.push({
        clientLocation: elm._id,
        TotalClient: elm.TotalClient,
        Compliant: elm.Compliant,
        NonCompliant: elm.NonCompliant,
        Pending: elm.Pending,
        Unknown: elm.Unknown
      });
    });
  }
  return locWiseVipPosture;
}

const replaceDnacVal = (str, mac, time) => {
  return str.replace("{mac_address}", mac).replace("{timestamp}", time);
}

const getFilterVipPostureData = (jsonObj) => {
  return {
    user_name: jsonObj.user_name,
    nas_ip_address: jsonObj.nas_ip_address,
    calling_station_id: jsonObj.calling_station_id,
    posture_status: jsonObj.posture_status,
    location: jsonObj.location,
    identity_group: jsonObj.identity_group,
    network_device_name: jsonObj.network_device_name,
    acs_server: jsonObj.acs_server,
    authentication_method: jsonObj.authentication_method,
    authentication_protocol: jsonObj.authentication_protocol,
    framed_ip_address: jsonObj.framed_ip_address,
    auth_acs_timestamp: jsonObj.auth_acs_timestamp,
    selected_azn_profiles: jsonObj.selected_azn_profiles,
    identity_store: jsonObj.identity_store,
    device_type: jsonObj.device_type,
    acct_acs_timestamp: jsonObj.acct_acs_timestamp,
    acct_session_time: jsonObj.acct_session_time,
    acct_authentic: jsonObj.acct_authentic,
    endpoint_policy: jsonObj.endpoint_policy
  };
}

const checkVIPCliFailureCond = async (AllData, collection) => {
  let NonComData = AllData.filter(ele => {
    if (collection === "vipClientPostures") {
      return ele.posture_status === "NonCompliant"
    } else {
      return ele.failure_reason;
    }
  });
  if (NonComData.length > 0) {
    if (collection !== "vipClientPostures") {
      const failtReasData = await getFailReasonforAuthUser(NonComData)
      NonComData = [...failtReasData]
    }
    let NonCompSites = [];
    NonComData.forEach(ele => {
      if (!NonCompSites.includes(ele.clientLocation)) {
        NonCompSites.push(ele.clientLocation)
      }
    });
    let AllNonCompSitesData = []
    NonCompSites.map(eachSite => {
      let obj = { siteName: "", Data: [] };
      let arr = [];
      NonComData.forEach(ele => {
        if (ele.clientLocation == eachSite) {
          arr.push(ele)
        }
      });
      obj.siteName = eachSite;
      obj.Data = [...arr];
      AllNonCompSitesData.push(obj);
    })

    let allottedResidentEnggSites = await getResidentEngData();
    for (el of allottedResidentEnggSites) {
      await matchAssignedSitesToEngg(el, AllNonCompSitesData, collection);
    }
  }
}

const getResidentEngData = async () => {
  let residentEngData = [];
  const data = await db
    .collection("tbl_credentials")
    .find({ Id: 3 })
    .project({ Email: 1, _id: 0, sites: 1, FName: 1, LName: 1 })
    .toArray();
  if (data && data.length > 0) {
    residentEngData = [...data];
  }
  return residentEngData;
}

const matchAssignedSitesToEngg = async (data, AllNonCompSitesData, collection) => {
  const intersection = AllNonCompSitesData.filter(element => data.sites.includes(element.siteName));
  if (intersection.length > 0) {
    const username = `${data.FName} ${data.LName}`
    if (collection === "vipClientPostures") {
      const apiName = "Posture"
      await mailer.nonCompDevInfoToResEngg(db, data.Email, intersection, apiName, username);
    } else {
      const apiName = "Authentication";
      await mailer.authFailInfoToResEngg(db, data.Email, intersection, apiName, username);
    }
  }
}

const clientHealthDropEmailer = async () => {
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));

  const resiEngrSites = await dbo.collection('tbl_credentials').aggregate([
    { $match: { Id: 3 } },
    { $addFields: { userName: { $concat: ['$FName', ' ', '$LName'] } } },
    { $project: { _id: '$Email', siteName: '$sites', userName: 1 } }
  ]).toArray();

  const clientDetails = await dbo.collection('clientDetails').aggregate([
    { $match: { timestamp: { $eq: new Date(timeStamp) } } },
    { $project: { healthScore: 1, location: 1, hostMac: 1 } }, { $unwind: '$healthScore' },
    { $match: { 'healthScore.healthType': 'OVERALL' } },
    { $project: { healthType: '$healthScore.healthType', healthScore: '$healthScore.score', location: 1, hostMac: 1 } }
  ]).toArray();

  const macAddrUserData = await dbo.collection('vipClientPosturesDrill').aggregate([
    { $sort: { timestamp: -1 } }, { $unwind: '$Data' },
    { $project: { user_name: '$Data.user_name', macAddr: '$Data.calling_station_id', timestamp: 1 } },
    { $group: { _id: '$macAddr', userName: { $addToSet: '$user_name' } } },
    { $project: { userName: { $arrayElemAt: ['$userName', 0] } } }
  ]).toArray();

  if (resiEngrSites.length > 0 && clientDetails.length > 0) {
    await healthDropEmailer(resiEngrSites, clientDetails, macAddrUserData);
  }
}

const healthDropEmailer = async (resiEngrSites, clientDetails, macAddrUserData) => {
  const healthRange = await dbo.collection("TblServiceList").find({
    KeyType: "VIPConfiguration", Key: 'poor'
  }).project({ Key: 1, Value1: 1, Value2: 1 }).toArray();

  for (let resiEngr of resiEngrSites) {
    if (resiEngr.siteName) {
      for (let site of resiEngr.siteName) {
        let siteMacHealthArr = clientDetails.filter(client => client.location === site && client.healthScore > healthRange[0].Value1 && client.healthScore <= healthRange[0].Value2);
        siteMacHealthArr.map(site => {
          const selectedUser = macAddrUserData.filter(user => user._id.toLowerCase() === site.hostMac.toLowerCase());
          site.userName = selectedUser && selectedUser.length ? selectedUser[0].userName : '';
        });
        if (siteMacHealthArr.length > 0) {
          await mailer.vipClientHealthDrop(db, siteMacHealthArr, resiEngr);
          await addDelay(2000);
        }
      };
    }
  }
}

const getFailReasonforAuthUser = async (NonComData) => {
  for (ele of NonComData) {
    const resaonData = await getISEFailureReason(ele.failure_reason);
    ele.cause = resaonData.cause;
    ele.resolution = resaonData.resolution;
    ele.failureReasonId = resaonData.failureReasonId;
  }
  return NonComData;
}

const getISEFailureReason = async (reason) => {
  let failResaonData = {}
  const data = await db.collection('ISEFailureReasons').aggregate([
    { $sort: { timestamp: -1 } },
    { $limit: 1 },
    { $unwind: '$iseFailureData' },
    { $match: { "iseFailureData.code": reason } },
    { $project: { _id: 0, timestamp: 0 } }
  ]).toArray()
  if (data && data.length > 0) {
    failResaonData = { ...data[0].iseFailureData }
  }
  return failResaonData;
}

const dnacSiteTopologyDataCron = () => {
  dnacSiteTopologyDataTask = cron.schedule(
    '0 0 0 * * 0',
    async () => {
      await createSiteTopologyData();
    },
    { scheduled: false }
  );
  return dnacSiteTopologyDataTask;
};


const createSiteTopologyData = async () => {
  let topologyArr = [];
  APIToken = await GetToken();
  const topologyData = await db.collection('SiteTopology').find().toArray();

  const headers = { "x-auth-token": APIToken.Token };
  const apiUrl = PackageData[0].DnacSiteToplogy;
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));

  const res = await axios.get(apiUrl, { headers: headers });
  if (res && res.data && res.data.response && res.data.response.sites) {
    topologyArr = res.data.response.sites.map(elm => {
      return { ...elm, timeStamp: timeStamp }
    });
  }

  if (topologyArr.length > 0) {
    if (topologyData && topologyData.length === 0) {
      await db.collection('SiteTopology').insertMany(topologyArr);
    } else {
      const existingTplgyData = topologyData.map(site => site.id);

      for (let siteData of topologyArr) {
        if (!existingTplgyData.includes(siteData.id)) {
          result = await db.collection('SiteTopology').insertOne(siteData);
        }
      };
    }
  }
}

const networkIssueEmailer = async () => {
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));

  let prioritiesDataArr = [];
  const prioritiesData = await dbo.collection("TblServiceList").find({ "KeyType": "DnacIssuePriority", "CurrentlyInUse": 1 }).toArray();
  if (prioritiesData && prioritiesData.length > 0) {
    prioritiesDataArr = prioritiesData[0].Value;
  }

  let issuesArr = [];
  if (prioritiesDataArr && prioritiesDataArr.length > 0) {
    issuesArr = await issueDataQuery(timeStamp, prioritiesDataArr);
  }

  if (issuesArr && issuesArr.length > 0) {
    const userData = await dbo.collection("tbl_credentials").find({ Id: { $in: [3, 2] } }).project({ sites: 1, Id: 1, Email: 1, FName: 1, LName: 1 }).toArray();

    for (let user of userData) {

      if (user.Id === 2) {
        for (let issue of issuesArr) {
          if (issue._id === '') {
            await mailer.networkIssueMailer(db, issue.issueData, user);
            await addDelay(2000);
          }
        }
      } else {
        let assignedSiteIssues = [];
        if (userData.sites) {
          let assignedSiteIds = await getAssignedSites(userData);
          if (assignedSiteIds && assignedSiteIds.length > 0) {
            for (let assignedSite of assignedSiteIds) {
              for (let issue of issuesArr) {
                if (issue._id === assignedSite.id) {
                  assignedSiteIssues.push(...issue.issueData);
                }
              }
            }
          }

          if (assignedSiteIssues && assignedSiteIssues.length > 0) {
            await mailer.networkIssueMailer(db, assignedSiteIssues, user.Email);
            await addDelay(2000);
          }
        }
      }
    }
  }
}

const issueDataQuery = async (timeStamp, prioritiesDataArr) => {
  const issuesData = await dbo.collection("DnacIssues").aggregate([
    { $match: { timeStamp: { $eq: new Date(timeStamp) } } },
    { $unwind: '$Data' }, { $match: { 'Data.priority': { $in: prioritiesDataArr } } },
    { $project: { issueId: '$Data.issueId', siteId: '$Data.siteId', priority: '$Data.priority', timeStamp: 1 } },
    {
      $lookup: {
        from: 'DnacIssuesDrillDown', let: { issueId: "$issueId", priority: "$priority" },
        pipeline: [
          { $match: { timeStamp: { $eq: new Date(timeStamp) } } }, { $unwind: '$Data' },
          { $project: { drillIssueId: '$Data.issueId', suggestedActions: '$Data.suggestedActions', drillPriority: '$Data.issuePriority' } },
          { $match: { $expr: { $and: [{ $eq: ['$drillIssueId', '$$issueId'] }, { $eq: ['$drillPriority', '$$priority'] }] } } }],
        as: "issueDetails"
      }
    },
    { $unwind: '$issueDetails' },
    { $project: { timeStamp: 1, issueId: 1, siteId: 1, priority: 1, suggestedActions: '$issueDetails.suggestedActions' } },
    { $group: { _id: '$siteId', issueData: { $push: "$$ROOT" } } }
  ]).toArray();

  return issuesData;
}


const getAssignedSites = async () => {
  let assignedSiteIds = [];
  const siteData = await dbo.collection("SiteTopology").find({}).project({ groupNameHierarchy: 1, id: 1 }).toArray();
  siteData.forEach(site => {
    const customSite = site.groupNameHierarchy.replace('Global/', '');
    if (userData.sites.includes(customSite)) {
      assignedSiteIds.push(site);
    }
  });
  return assignedSiteIds;
}

const buildGlobalToolsArr = async () => {
  const toolsDataArr = await dbo.collection("tbl_configurations").find({}).project({
    _id: 0,
    Name: 1,
    AllowedBySuperAdmin: 1
  }).toArray();
  for (val of toolsDataArr) {
    if (val.Name === "PSIRT" && val.AllowedBySuperAdmin === true) {
      const today = new Date()
      // console.log(today.getDay(), today.getHours(), today.getMinutes())
      if (!(today.getDay() == 4 && today.getHours() == 6 && today.getMinutes() == 0)) {
        val.AllowedBySuperAdmin = false;
      }
    }
  }
  global.toolsArr = toolsDataArr;
}

const connectivityOperations = async () => {
  await dnacConnectivity();
  {
    toolObj["ServiceNow"]
      ? await serviceNowConnectivity()
      : null;
  }
  {
    toolObj["Meraki"]
      ? await merakiConnectivity()
      : null;
  }
  {
    toolObj["The Optimizer"]
      ? await optimizerConnectivity()
      : null;
  }
  {
    toolObj["ISE"]
      ? await iseConnectivity()
      : null;
  }
}

const dnacConnectivity = async () => {
  // try {
    const config = {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            PackageData[0].DnacUserName + ":" + PackageData[0].DnacPassWord
          ).toString("base64"),
      }
    }
    const data = await axios.post(`${PackageData[0].DnacURL}/dna/system/api/v1/auth/token`, {}, config)
    if (data && data.status) {
      helpers.buildStatusForTools(data.status, "DNA-C", db);
    }
  // } catch (error) {
  //   helpers.buildStatusForTools(500, "DNA-C", db);
  // }
}

const serviceNowConnectivity = async () => {
  try {
    const config = {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            PackageData[0].ServiceNowUserName +
            ":" +
            PackageData[0].ServiceNowPassword
          ).toString("base64"),
      }
    }
    const data = await axios.get(`${PackageData[0].ServiceNowAPI}`, config)
    if (data && data.status) {
      helpers.buildStatusForTools(data.status, "ServiceNow", db);
    }
  } catch (error) {
    helpers.buildStatusForTools(500, "ServiceNow", db);
  }
}

const merakiConnectivity = async () => {
  try {
    const config = {
      headers: {
        "X-Cisco-Meraki-API-Key": PackageData[0].MerakiAPIKey,
      }
    }
    const data = await axios.get(`${PackageData[0].MerakiBaseUrl}/${PackageData[0].MerakiAPIVersion}/networks/${NetworkList.id}/devices?timestamp=300`, config)
    if (data && data.status) {
      helpers.buildStatusForTools(data.status, "Meraki", db);
    }
  } catch (error) {
    helpers.buildStatusForTools(500, "Meraki", db);
  }
}

const optimizerConnectivity = async () => {
  try {
    const config = {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            PackageData[0].HardeningUserName + ":" + PackageData[0].HardeningPassword
          ).toString("base64")
      }
    }
    const data = await axios.get(`${PackageData[0].HardeningCommandURl}`, config);
    if (data && data.status) {
      helpers.buildStatusForTools(data.status, "The Optimizer", db);
    }
  } catch (error) {
    helpers.buildStatusForTools(500, "The Optimizer", db);
  }
}

const iseConnectivity = async () => {
  try {
    const config = {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            PackageData[0].ISEUserName + ":" + PackageData[0].ISEPassword
          ).toString("base64"),
      },
    };
    let data = await axios.get(`${PackageData[0].ISEActiveCountApi}`, config);
    if (data && data.status) {
      helpers.buildStatusForTools(data.status, "ISE", db);
    }
  } catch (error) {
    helpers.buildStatusForTools(500, "ISE", db);
  }
}

const buildApplicationHealthData = async (token) => {
  const mainData = { Data: [] }
  const siteData = await getSiteNameId();
  if (siteData && siteData.length > 0) {
    for (value of siteData) {
      let data = {};
      data.dnacLocation = "Others";
      data.site = value.siteName;
      const healthDrillData = await getApplicationHealthRawData(token, value);
      if (Object.keys(healthDrillData).length) {
        data = { ...data, ...healthDrillData }
        mainData.Data.push(data)
      }
    }
    insertApplicationHealthDrillData(mainData)
  }
}

const getSiteNameId = async () => {
  let siteHealthData = []
  const data = await db.collection('SiteHealthTopology').find({})
    .sort({ timestamp: -1 }).limit(1).project({ _id: 0, 'Data.siteName': 1, 'Data.siteId': 1 }).toArray();
  if (data && data.length > 0) {
    siteHealthData = [...data[0].Data]
  }
  return siteHealthData;
}

const getApplicationHealthRawData = async (token, siteData) => {
  let getAppHealthData = {};
  const headers = { "x-auth-token": token }
  const healthData = await axios.get(`${PackageData[0].DnacApplicationHealthAPI}/?siteId=${siteData.siteId}&limit=1000`, { headers })
  if (healthData && Object.keys(healthData.data).length && healthData.data.response.length > 0) {
    getAppHealthData = { ...healthData.data };
  }
  return getAppHealthData;
}

const insertApplicationHealthDrillData = (healthDrillData) => {
  const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
    parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
  healthDrillData.timestamp = timeStamp;
  const filterData = filterApplicationHealthData(healthDrillData);
  healthDrillData = { ...filterData };
  InsertData(healthDrillData, "DnacApplicationHealthDrillData", db);
  buildMainHealthChartData(healthDrillData, timeStamp)
}

const filterApplicationHealthData = (healthData) => {
  for (data of healthData.Data) {
    for (ele of data.response) {
      ele.status = ele.health > 0 && ele.health <= 5 ? 'Poor' : ele.health > 5 && ele.health <= 7 ? 'Fair' : ele.health > 7 ? 'Good' : "Unknown";
    }
  }
  return healthData;
}

const buildMainHealthChartData = (healthdata, timeStamp) => {
  let mainData = {
    AllDataCount: { allTotalCount: 0, allGoodCount: 0, allPoorCount: 0, allFairCount: 0, allUnknownCount: 0 },
    Data: [],
    timestamp: timeStamp
  };
  for (data of healthdata.Data) {
    let poorCount = 0;
    let goodCount = 0;
    let fairCount = 0;
    let unknownCount = 0;
    for (val of data.response) {
      if (val.status === 'Poor') {
        poorCount++
      }
      if (val.status === 'Good') {
        goodCount++
      }
      if (val.status === 'Fair') {
        fairCount++
      }
      if (val.status === 'Unknown') {
        unknownCount++
      }
    }
    let obj = { dnacLocation: data.dnacLocation, totalCount: data.totalCount, site: data.site, poorCount, goodCount, fairCount, unknownCount };
    mainData.AllDataCount.allTotalCount += data.totalCount;
    mainData.AllDataCount.allGoodCount += parseInt(goodCount);
    mainData.AllDataCount.allFairCount += parseInt(fairCount);
    mainData.AllDataCount.allPoorCount += parseInt(poorCount);
    mainData.AllDataCount.allUnknownCount += parseInt(unknownCount);
    mainData.Data.push(obj);
  }
  InsertData(mainData, "DnacApplicationHealth", db);
}

// const GetCWNetworkHealthDrillData = async (Token) => {
//   try {
//     const headers = {
//       "x-auth-token": Token,
//       "role":"core"
//     }
//     console.log("sdds", Math.round(new Date().getTime() / 1000) * 1000)
//     const result = await axios.get(`https://10.122.1.25/dna/intent/api/v1/network-device`, { headers })
//     if (result) {
//       console.log("sdsdfsdfs", result)
//     }
//     const timeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
//       parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
//     const finalData = {
//       timeStamp: timeStamp,
//       recordset: result
//     }
//     InsertVerification = InsertData(finalData, "CWNetwokHealthDrillData", db)
//   } catch (error) {
//     console.log(error)
//   }
// }