var sql = require("mssql");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var fs = require("fs");
const axios = require("axios");
const helpers = require("./Utilities/helper");

// (async () => {
//   var objConfigDetails = await GetConfigDetails2();
//   //var PackageData = await GetPackageDetailFromDB();

//   mongoose.connect(
//     `mongodb://${objConfigDetails.MongoConnectionString}:${objConfigDetails.MongoPort}/${objConfigDetails.MongoDataBase}`,
//     { useNewUrlParser: true, useUnifiedTopology: true },
//     function (err, db) {
//       dbo = db;
//     }
//   );

//   mongoose.connection.on("connected", () => console.log("Connected"));
//   mongoose.connection.on("error", () =>
//     console.log("Connection failed with - ", err)
//   );
// })();

//this is for days computaion
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function connectSQL(PackageData, db) {
  return new Promise((resolve) => {
    const PackageConnection = (async () => {
      var objConfigDetails = await ConnectNow(PackageData, db);
      resolve(1);
    })();
  });
}
async function ConnectNow(PackageData, db) {
  return new Promise((resolve) => {
    var config = {
      user: PackageData.SolarWindDbUserName,
      password: PackageData.SolarWindDbPassword,
      // server: '192.168.100.207\\SQLEXPRESS',//PackageData[0].SolarWindDataSourceName.replace('\\','\\'),
      // database: 'solarwinddemo' //PackageData[0].SolarWinddbDataBaseName
      server: PackageData.SolarWindDataSourceName.replace("\\", "\\"),
      database: PackageData.SolarWinddbDataBaseName,
      options: {
        encrypt: false,
        trustServerCertificate: false, // change to true for self-signed certificates
        cryptoCredentialsDetails: {
          minVersion: 'TLSv1.2', // enforce TLS 1.2 or higher
        }
      }
    };
    
    // Connect to the database
    sql.connect(config,(error) => {
      if (error) {
        helpers.buildStatusForTools(500, "SolarWinds", db);
      } else {
        helpers.buildStatusForTools(200, "SolarWinds", db);
        resolve("ok");
      }
    });
  });
}

function getCPUutilizationData(ServiceListCPU, ServiceListMemory,clientCtx) {

  let normalCpuCondition = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateCpuCondition2 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  let normalMemoryCondition = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateMemoryCondition2 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "risk")[0]["Value1"]
  );


  return new Promise(async (resolve) => {
    var request = new sql.Request();
    var normalCount = 0;
    var normalCount = 0;
    var riskCount = 0;
    var moderateCount = 0;
    var element = [];
    var memorydata = [];
    var normalCount1 = 0;
    var riskCount1 = 0;
    var moderateCount1 = 0;

    let results = await request.query(
      //"select [CPULoad],[PercentMemoryUsed],[Site_Type],[Device_Type],[Locations],[status],[Caption],[IP_Address],[MachineType] from Nodes where Device_Type != 'server'",
      "select [CPULoad],[PercentMemoryUsed],[Device_Type],[Location],[status],[Caption],[IP_Address],[MachineType] from Nodes where Device_Type != 'server'");
      if (results && results.recordset && results.recordset.length != 0) {
        results.recordset.forEach((item) => {
          if (item.CPULoad <= normalCpuCondition) {
            normalCount++;
          } else if (
            item.CPULoad >= moderateCpuCondition1 &&
            item.CPULoad <= moderateCpuCondition2
          ) {
            moderateCount++;
          }
          if (item.CPULoad >= riskCpuCondition1) {
            riskCount++;
          }

          if (item.PercentMemoryUsed <= normalMemoryCondition) {
            normalCount1++;
          } else if (
            item.PercentMemoryUsed >= moderateMemoryCondition1 &&
            item.PercentMemoryUsed <= moderateMemoryCondition2
          ) {
            moderateCount1++;
          }
          if (item.PercentMemoryUsed >= riskMemoryCondition1) {
            riskCount1++;
          }

          element.push({
            normal: normalCount,
            moderate: moderateCount,
            risk: riskCount,
            timestamp: new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            ),
          });
          memorydata.push({
            normal: normalCount1,
            moderate: moderateCount1,
            risk: riskCount1,
            timestamp: new Date(
              new Date(
                new Date(
                  new Date(Date.now()).setMinutes(
                    parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                  )
                ).setSeconds(0)
              ).setMilliseconds(0)
            ),
          });
        });

        let finalData = element[element.length - 1];
        let memoryutzData = memorydata[memorydata.length - 1];

        let resultData = [];
        resultData.push({
          normal: finalData.normal,
          moderate: finalData.moderate,
          risk: finalData.risk,
        });

        let resultData1 = [];
        resultData1.push({
          normal: memoryutzData.normal,
          moderate: memoryutzData.moderate,
          risk: memoryutzData.risk,
        });
        let object = {};
        object.cpu_utilization = resultData;
        object.memory_utilization = resultData1;
        object.timestamp = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        //save data
        // cpuutilization.insertMany(object).then(async (docs) => { });
        await clientCtx.db.collection("cpuutilizationschemas").insertMany([object]);
        resolve(results);
      } else {
        console.log("Database not connected");
      }
  });
}
function getWanlink(clientCtx) {
  return new Promise((resolve) => {
    var req = new sql.Request();
    req.query(
      //"select [Caption],[Status],[Inbps],[Outbps] from Interfaces where NodeID=1 and InterfaceID in (1,2)",
      "select [FullName],[Status],[Inbps],[Outbps] from Interfaces where Status in (1,2)",
      function (err, results) {
        if (err) console.log(err);
        let upStatus = 0;
        let downStatus = 0;
        results.recordsets[0].forEach((values) => {
          if (values.Status == 1) {
            upStatus++;
          } else {
            downStatus++;
          }
        });
        let obj = {
          up: upStatus,
          down: downStatus,
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
        // wanlinkSchema.insertMany(obj).then(async (docs) => { });
        clientCtx.db.collection("wanlinkschemas").insertMany([obj]);
        resolve(results.recordsets[0]);
      }
    );
  });
}
function getWanlinkDrillDown(data,clientCtx) {
  return new Promise((resolve) => {
    let wanLinkData = [];
    let wanDataobj = {};
    data.map((items) => {
      let obj = {
        status: items.Status,
        device_name: items.FullName,
        inmbps: items.Inbps,
        outmbps: items.Outbps,
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
      wanLinkData.push(obj);
    });
    wanDataobj["wanData"] = wanLinkData;
    wanDataobj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );

    // wanlinkdrill.insertMany(wanDataobj).then(async (docs) => {
    //   //   })
    // });
    clientCtx.db.collection("wanlinkdrills").insertMany([wanDataobj]);

    resolve(data);
  });
}
function getInventry(results,clientCtx) {
  return new Promise((resolve) => {
    let upCount = results.recordset.filter((a) => a.status == 1).length;
    let downCount = results.recordset.filter((a) => a.status == 2).length;

    let inventoryCount = {};
    inventoryCount.upCount = upCount;
    inventoryCount.downCount = downCount;
    inventoryCount["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    // inventorySchema.insertMany(inventoryCount).then(async (docs) => {
    // });
    clientCtx.db.collection("inventorycounts").insertMany([inventoryCount]);
    resolve(results);
  });
}
function getInventryDrill(results,clientCtx) {
  return new Promise((resolve) => {
    let inventData = [];
    let invntObj = {};

    let InventoruDrillData = results.recordset.map(function (value) {
      let obj = {
        ip_address: value.IP_Address,
        status: value.status,
        device_name: value.Caption,
        device_type: value.Device_Type,
        memory_utilization: value.PercentMemoryUsed,
        machine_type: value.MachineType,
      };
      return inventData.push(obj);
    });
    invntObj["inventryData"] = inventData;
    invntObj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    // inventorydrill.insertMany(invntObj).then(async (docs) => {
    // });
    clientCtx.db.collection("inventorydrills").insertMany([invntObj]);
    resolve(results);
  });
}
function getCpuDrill(results, ServiceListCPU, ServiceListMemory,clientCtx) {
  let normalCpuCondition = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateCpuCondition2 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  let normalMemoryCondition = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateMemoryCondition2 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  return new Promise(async (resolve) => {
    let normalData = results.recordset.filter(
      (a) => a.CPULoad <= normalCpuCondition
    );
    let cpuNormalUsedData = [];
    let cpuModerateUsedData = [];
    let cpuRiskUsedData = [];
    normalData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return cpuNormalUsedData.push(obj);
    });
    let moderateData = results.recordset.filter(
      (a) =>
        a.CPULoad >= moderateCpuCondition1 && a.CPULoad <= moderateCpuCondition2
    );
    moderateData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return cpuModerateUsedData.push(obj);
    });
    let riskData = results.recordset.filter(
      (a) => a.CPULoad >= riskCpuCondition1
    );
    riskData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return cpuRiskUsedData.push(obj);
    });
    let cpu_utilization = {};
    cpu_utilization["normal"] = cpuNormalUsedData;
    cpu_utilization["moderate"] = cpuModerateUsedData;
    cpu_utilization["risk"] = cpuRiskUsedData;

    let momoryNormalData = results.recordset.filter(
      (a) => a.PercentMemoryUsed <= normalMemoryCondition
    );
    let memoryNormalUsedData = [];
    let memoryModerateUsedData = [];
    let memoryRiskUsedData = [];
    momoryNormalData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return memoryNormalUsedData.push(obj);
    });
    let memoryModerateData = results.recordset.filter(
      (a) =>
        a.PercentMemoryUsed >= moderateMemoryCondition1 &&
        a.PercentMemoryUsed <= moderateMemoryCondition2
    );
    memoryModerateData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return memoryModerateUsedData.push(obj);
    });
    let memoryRiskData = results.recordset.filter(
      (a) => a.PercentMemoryUsed >= riskMemoryCondition1
    );
    memoryRiskData.map(function (value) {
      let obj = {
        IP_Address: value.IP_Address,
        CPULoad: value.CPULoad,
        Caption: value.Caption,
        Device_Type: value.Device_Type,
        PercentMemoryUsed: value.PercentMemoryUsed,
        MachineType: value.MachineType,
      };
      return memoryRiskUsedData.push(obj);
    });
    let memory_utilization = {};
    memory_utilization["normal"] = memoryNormalUsedData;
    memory_utilization["moderate"] = memoryModerateUsedData;
    memory_utilization["risk"] = memoryRiskUsedData;

    // cpudrill
    //   .insertMany({
    //     timestamp: new Date(
    //       new Date(
    //         new Date(
    //           new Date(Date.now()).setMinutes(
    //             parseInt(new Date(Date.now()).getMinutes() / 5) * 5
    //           )
    //         ).setSeconds(0)
    //       ).setMilliseconds(0)
    //     ),
    //     cpu_utilization: cpu_utilization,
    //     memory_utilization: memory_utilization,
    //   })
    //   .then(async (docs) => {
    //     // console.log("getting cpuDrill data",docs);
    //   });
    await clientCtx.db.collection("cpudrills").insertOne({
      timestamp: new Date(
        new Date(
          new Date(
            new Date(Date.now()).setMinutes(
              Math.floor(new Date().getMinutes() / 5) * 5
            )
          ).setSeconds(0)
        ).setMilliseconds(0)
      ),
      cpu_utilization,
      memory_utilization
    });

    resolve(results);
  });
}
function getnetworkHealth(results, ServiceListCPU, ServiceListMemory,clientCtx) {
  let normalCpuCondition = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateCpuCondition2 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  let normalMemoryCondition = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateMemoryCondition2 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  return new Promise((resolve) => {
    let platinumData = results.recordset.filter(
      (a) => a.Site_Type == "Platinum"
    );

    let pNormal = platinumData.filter(
      (a) =>
        a.CPULoad <= normalCpuCondition &&
        a.PercentMemoryUsed <= normalMemoryCondition
    ).length;
    let pModerate = platinumData.filter(
      (a) =>
        (a.CPULoad <= normalCpuCondition &&
          a.PercentMemoryUsed >= moderateMemoryCondition1 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2) ||
        (a.CPULoad > moderateCpuCondition1 &&
          a.CPULoad <= moderateCpuCondition2 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2)
    ).length;
    let pRisk = platinumData.filter(
      (a) =>
        a.CPULoad >= riskCpuCondition1 ||
        a.PercentMemoryUsed >= riskMemoryCondition1
    ).length;

    let goldData = results.recordset.filter((a) => a.Site_Type == "Gold");

    let gNormal = goldData.filter(
      (a) =>
        a.CPULoad <= normalCpuCondition &&
        a.PercentMemoryUsed <= normalMemoryCondition
    ).length;
    let gModerate = goldData.filter(
      (a) =>
        (a.CPULoad <= normalCpuCondition &&
          a.PercentMemoryUsed >= moderateMemoryCondition1 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2) ||
        (a.CPULoad >= moderateCpuCondition1 &&
          a.CPULoad <= moderateCpuCondition2 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2)
    ).length;
    let gRisk = goldData.filter(
      (a) =>
        a.CPULoad >= riskCpuCondition1 ||
        a.PercentMemoryUsed >= riskMemoryCondition1
    ).length;

    let silverData = results.recordset.filter((a) => a.Site_Type == "Silver");

    let sNormal = silverData.filter(
      (a) =>
        a.CPULoad <= normalCpuCondition &&
        a.PercentMemoryUsed <= normalMemoryCondition
    ).length;

    let sModerate = silverData.filter(
      (a) =>
        (a.CPULoad <= normalCpuCondition &&
          a.PercentMemoryUsed >= moderateMemoryCondition1 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2) ||
        (a.CPULoad >= moderateCpuCondition1 &&
          a.CPULoad <= moderateCpuCondition2 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2)
    ).length;
    let sRisk = silverData.filter(
      (a) =>
        a.CPULoad >= riskCpuCondition1 ||
        a.PercentMemoryUsed >= riskMemoryCondition1
    ).length;

    let bronzeData = results.recordset.filter((a) => a.Site_Type == "Bronze");

    let bNormal = bronzeData.filter(
      (a) =>
        a.CPULoad <= normalCpuCondition &&
        a.PercentMemoryUsed <= normalMemoryCondition
    ).length;
    let bModerate = bronzeData.filter(
      (a) =>
        (a.CPULoad <= normalCpuCondition &&
          a.PercentMemoryUsed >= moderateMemoryCondition1 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2) ||
        (a.CPULoad >= moderateCpuCondition1 &&
          a.CPULoad <= moderateCpuCondition2 &&
          a.PercentMemoryUsed <= moderateMemoryCondition2)
    ).length;
    let bRisk = bronzeData.filter(
      (a) =>
        a.CPULoad >= riskCpuCondition1 ||
        a.PercentMemoryUsed >= riskMemoryCondition1
    ).length;

    let oNormal = bNormal + sNormal + gNormal + pNormal;
    let oModerate = bModerate + sModerate + gModerate + pModerate;
    let oRisk = bRisk + sRisk + gRisk + pRisk;

    let newObj = {};
    newObj["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    let arrData = [];
    arrData.push({
      normal: oNormal,
      moderate: oModerate,
      risk: oRisk,
      site_type: "Overall",
    });
    arrData.push({
      normal: pNormal,
      moderate: pModerate,
      risk: pRisk,
      site_type: platinumData && platinumData.length > 0 ? platinumData[0].Site_Type : '',
    });
    arrData.push({
      normal: gNormal,
      moderate: gModerate,
      risk: gRisk,
      site_type: goldData && goldData.length > 0 ? goldData[0].Site_Type : '',
    });
    arrData.push({
      normal: sNormal,
      moderate: sModerate,
      risk: sRisk,
      site_type: silverData && silverData.length > 0 ? silverData[0].Site_Type : '',
    });
    arrData.push({
      normal: bNormal,
      moderate: bModerate,
      risk: bRisk,
      site_type: bronzeData && bronzeData.length > 0 ? bronzeData[0].Site_Type : '',
    });

    newObj["Data"] = arrData;
    // getnetworkSchema.insertMany(newObj).then(async (docs) => {
    // });
    clientCtx.db.collection("getnetworkhealths").insertMany([newObj]);

    resolve(results);
  });
}

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
function getnetworkHealthDrillData(results, ServiceListCPU, ServiceListMemory, db) {
  let normalCpuCondition = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateCpuCondition2 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskCpuCondition1 = Number.parseInt(
    ServiceListCPU.filter((a) => a.Key == "risk")[0]["Value1"]
  );

  let normalMemoryCondition = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "normal")[0]["Value2"]
  );
  let moderateMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value1"]
  );
  let moderateMemoryCondition2 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "moderate")[0]["Value2"]
  );
  let riskMemoryCondition1 = Number.parseInt(
    ServiceListMemory.filter((a) => a.Key == "risk")[0]["Value1"]
  );
  return new Promise(async(resolve) => {

    let networkHealthData = results.recordset;
    let filterNetworkData = groupBy(networkHealthData, function (item) {
      // return [item.Locations]; change for USL 12-August-2022
      return [item.Location];
    });
    let deviceTypeData;
    let dataDeviceType = [];
    filterNetworkData.forEach((items) => {
      deviceTypeData = groupBy(items, function (item) {
        return [item.Device_Type];
      });
      dataDeviceType.push({ Data: deviceTypeData });
    });
    let goodCount = 0;
    let moderateCount = 0;
    let riskCount = 0;
    let overallDataCount = [];
    let Locations;
    let device_type;
    let objDataForHealthCount = {};
    // let totalCount=0

    // let goodPercentage=0;
    // let riskPercentage=0;

    dataDeviceType.forEach((item) => {
      item.Data.forEach((itemData) => {
        let totalCount = 0;
        totalCount = itemData.length;
        for (let i = 0; i < itemData.length; i++) {

          Locations = itemData[0].Location;
          device_type = itemData[0].Device_Type;

          if (
            itemData[i].CPULoad <= normalCpuCondition &&
            itemData[i].PercentMemoryUsed <= normalMemoryCondition
          )
            goodCount = goodCount + 1;

          if (
            (itemData[i].CPULoad <= normalCpuCondition &&
              itemData[i].PercentMemoryUsed >= moderateMemoryCondition1 &&
              itemData[i].PercentMemoryUsed <= moderateMemoryCondition2) ||
            (itemData[i].CPULoad > moderateCpuCondition1 &&
              itemData[i].CPULoad <= moderateCpuCondition2 &&
              itemData[i].PercentMemoryUsed <= moderateMemoryCondition2)
          )
            moderateCount = moderateCount + 1;

          if (itemData[i].CPULoad >= 71 || itemData[i].PercentMemoryUsed >= 71)
            riskCount = riskCount + 1;
        }

        objDataForHealthCount = {
          Locations: Locations,
          device_type: device_type,
          goodCount: goodCount,
          moderateCount: moderateCount,
          riskCount: riskCount,
          totalCount: totalCount,
          goodPercentage: (goodCount / totalCount) * 100,
          moderatePercentage: (moderateCount / totalCount) * 100,
          riskPercentage: (riskCount / totalCount) * 100,
        };
        overallDataCount.push(objDataForHealthCount);

        goodCount = 0;
        moderateCount = 0;
        riskCount = 0;
      });
    });

    let devicewiseData = groupBy(overallDataCount, function (item) {
      return [item.device_type];
    });

    let deviceTypeForAll;

    let overallTotalCount = 0;
    let overallNormalCount = 0;
    let overallmoderateCount = 0;
    let overallRiskData = 0;
    let saveData = []
    for (i = 0; i < devicewiseData.length; i++) {
      let obj = {};
      devicewiseData[i].forEach((item) => {
        deviceTypeForAll = item.device_type;

        overallNormalCount = overallNormalCount + item.goodCount;
        overallmoderateCount = overallmoderateCount + item.moderateCount;
        overallRiskData = overallRiskData + item.riskCount;
        overallTotalCount = overallTotalCount + item.totalCount;
      });

      obj = {
        Locations: "All Locations",
        device_type: deviceTypeForAll,
        goodCount: overallNormalCount,
        moderateCount: overallmoderateCount,
        riskCount: overallRiskData,
        totalCount: overallTotalCount,
        goodPercentage: (overallNormalCount / overallTotalCount) * 100,
        moderatePercentage: (overallmoderateCount / overallTotalCount) * 100,
        riskPercentage: (overallRiskData / overallTotalCount) * 100,
      };

      overallDataCount.push(obj);
      // saveData.push(obj);

      overallTotalCount = 0;
      overallNormalCount = 0;
      overallmoderateCount = 0;
      overallRiskData = 0;
    }

    let networkHealthDevicewiseData = {};
    networkHealthDevicewiseData["recordset"] = overallDataCount;
    networkHealthDevicewiseData["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );
    await db.collection("NetworkHealthDevicewiseClassic").insertOne(
      networkHealthDevicewiseData
    );
    resolve("");
    

//     let platinumData = results.recordset.filter(
//       (a) => a.Site_Type == "Platinum"
//     );
//     //  platinumValues = [];
//     let pNormalitems = platinumData.filter(
//       (a) =>
//         a.CPULoad <= normalCpuCondition &&
//         a.PercentMemoryUsed <= normalMemoryCondition
//     );
//     pNormalitems = pNormalitems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022 
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
//         cpu_utilization: item.CPULoad,

//         performance: "Normal",
//       };
//       return obj;
//     });

//     let pModerateItems = platinumData.filter(
//       (a) =>
//         (a.CPULoad <= normalCpuCondition &&
//           a.PercentMemoryUsed >= moderateMemoryCondition1 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2) ||
//         (a.CPULoad > moderateCpuCondition1 &&
//           a.CPULoad <= moderateCpuCondition2 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2)
//     );
//     pModerateItems = pModerateItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Moderate",
//       };
//       return obj;
//     });

//     let pRiskItems = platinumData.filter(
//       (a) =>
//         a.CPULoad >= riskCpuCondition1 ||
//         a.PercentMemoryUsed >= riskMemoryCondition1
//     );
//     pRiskItems = pRiskItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Risk",
//       };
//       return obj;
//     });

//     let goldData = results.recordset.filter((a) => a.Site_Type == "Gold");
//     //goldValues = [];
//     let gNormalItems = goldData.filter(
//       (a) =>
//         a.CPULoad <= normalCpuCondition &&
//         a.PercentMemoryUsed <= normalMemoryCondition
//     );
//     gNormalItems = gNormalItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Normal",
//       };
//       return obj;
//     });

//     let gModerateItems = goldData.filter(
//       (a) =>
//         (a.CPULoad <= normalCpuCondition &&
//           a.PercentMemoryUsed >= moderateMemoryCondition1 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2) ||
//         (a.CPULoad >= moderateCpuCondition1 &&
//           a.CPULoad <= moderateCpuCondition2 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2)
//     );
//     gModerateItems = gModerateItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Moderate",
//       };
//       return obj;
//     });

//     let gRiskItems = goldData.filter(
//       (a) =>
//         a.CPULoad >= riskCpuCondition1 ||
//         a.PercentMemoryUsed >= riskMemoryCondition1
//     );
//     gRiskItems = gRiskItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,
//         performance: "Risk",
//       };
//       return obj;
//     });

//     let silverData = results.recordset.filter((a) => a.Site_Type == "Silver");
//     //silverValues = [];
//     let sNormalItems = silverData.filter(
//       (a) =>
//         a.CPULoad <= normalCpuCondition &&
//         a.PercentMemoryUsed <= normalMemoryCondition
//     );
//     sNormalItems = sNormalItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Normal",
//       };
//       return obj;
//     });
//     let sModerateItems = silverData.filter(
//       (a) =>
//         (a.CPULoad <= normalCpuCondition &&
//           a.PercentMemoryUsed >= moderateMemoryCondition1 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2) ||
//         (a.CPULoad >= moderateCpuCondition1 &&
//           a.CPULoad <= moderateCpuCondition2 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2)
//     );

//     sModerateItems = sModerateItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,

//         performance: "Moderate",
//       };
//       return obj;
//     });

//     let sRiskItems = silverData.filter(
//       (a) =>
//         a.CPULoad >= riskCpuCondition1 ||
//         a.PercentMemoryUsed >= riskMemoryCondition1
//     );
//     sRiskItems = sRiskItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,
//         performance: "Risk",
//       };
//       return obj;
//     });

//     let bronzeData = results.recordset.filter((a) => a.Site_Type == "Bronze");

//     let bNormalitems = bronzeData.filter(
//       (a) =>
//         a.CPULoad <= normalCpuCondition &&
//         a.PercentMemoryUsed <= normalMemoryCondition
//     );
//     bNormalitems = bNormalitems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,
//         performance: "Normal",
//       };
//       return obj;
//     });

//     let bModerateItems = bronzeData.filter(
//       (a) =>
//         (a.CPULoad <= normalCpuCondition &&
//           a.PercentMemoryUsed >= moderateMemoryCondition1 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2) ||
//         (a.CPULoad >= moderateCpuCondition1 &&
//           a.CPULoad <= moderateCpuCondition2 &&
//           a.PercentMemoryUsed <= moderateMemoryCondition2)
//     );
//     bModerateItems = bModerateItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,
//         performance: "Moderate",
//       };
//       return obj;
//     });

//     let bRiskItems = bronzeData.filter(
//       (a) =>
//         a.CPULoad >= riskCpuCondition1 ||
//         a.PercentMemoryUsed >= riskMemoryCondition1
//     );
//     bRiskItems = bRiskItems.map(function (item) {
//       let obj = {
//         ip_address: item.IP_Address,
//         // category: item.Site_Type, chage for USL 12-August-2022
//         // device_name: item.Caption, chage for USL 12-August-2022
//         device_name: item.FullName,
//         machine_type: item.MachineType,
//         device_type: item.Device_Type,
//         memory_utilization: item.PercentMemoryUsed,
//         // location: item.Location, chage for USL 12-August-2022
//         location: item.Location,
// cpu_utilization: item.CPULoad,
//         performance: "Risk",
//       };
//       return obj;
//     });
//     let networkArray = [];
//     let networkArray1 = [];
//     let networkArray2 = [];
//     let networkArray3 = [];
//     overallData = [];
//     networkArray = networkArray
//       .concat(pNormalitems)
//       .concat(pModerateItems)
//       .concat(pRiskItems);
//     networkArray1 = networkArray1
//       .concat(sNormalItems)
//       .concat(sModerateItems)
//       .concat(sRiskItems);
//     networkArray2 = networkArray2
//       .concat(gNormalItems)
//       .concat(gModerateItems)
//       .concat(gRiskItems);
//     networkArray3 = networkArray3
//       .concat(bNormalitems)
//       .concat(bModerateItems)
//       .concat(bRiskItems);
//     overallData = overallData
//       .concat(networkArray)
//       .concat(networkArray1)
//       .concat(networkArray2)
//       .concat(networkArray3);


let normalItems = results.recordset.filter(
  (a) =>
    a.CPULoad <= normalCpuCondition &&
    a.PercentMemoryUsed <= normalMemoryCondition
);
normalItems = normalItems.map(function (item) {
  let obj = {
    ip_address: item.IP_Address,
    device_name: item.Caption,
    machine_type: item.MachineType,
    device_type: item.Device_Type,
    memory_utilization: item.PercentMemoryUsed,
    location: item.Location,
    cpu_utilization: item.CPULoad,

    performance: "Normal",
  };
  return obj;
});

let moderateItems = results.recordset.filter(
  (a) =>
    (a.CPULoad <= normalCpuCondition &&
      a.PercentMemoryUsed >= moderateMemoryCondition1 &&
      a.PercentMemoryUsed <= moderateMemoryCondition2) ||
    (a.CPULoad > moderateCpuCondition1 &&
      a.CPULoad <= moderateCpuCondition2 &&
      a.PercentMemoryUsed <= moderateMemoryCondition2)
);
moderateItems = moderateItems.map(function (item) {
  let obj = {
    ip_address: item.IP_Address,
    device_name: item.Caption,
    machine_type: item.MachineType,
    device_type: item.Device_Type,
    memory_utilization: item.PercentMemoryUsed,
    location: item.Location,
    cpu_utilization: item.CPULoad,

    performance: "Moderate",
  };
  return obj;
});

let riskItems = results.recordset.filter(
  (a) =>
    a.CPULoad >= riskCpuCondition1 ||
    a.PercentMemoryUsed >= riskMemoryCondition1
);
riskItems = riskItems.map(function (item) {
  let obj = {
    ip_address: item.IP_Address,
    device_name: item.Caption,
    machine_type: item.MachineType,
    device_type: item.Device_Type,
    memory_utilization: item.PercentMemoryUsed,
    location: item.Location,
    cpu_utilization: item.CPULoad,

    performance: "Risk",
  };
  return obj;
});

let networkData = {};
networkData["overallData"] = [...normalItems,...moderateItems,...riskItems];
    networkData["timestamp"] = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            parseInt(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );

    // cwnetworkhealthDrill.insertMany(networkData).then(async (docs) => {
    // });
    db.collection("networkhealthdrills").insertMany([networkData]);
    resolve(results);
  });
}
function createCPUMemoryTrend(data, db) {
  return new Promise(async(resolve) => {
    let lastDay = new Date(
      new Date(
        new Date(new Date(Date.now()).addDays(-1).setHours(0)).setMinutes(0)
      ).setSeconds(0)
    );
    let Today = new Date(
      new Date(
        new Date(new Date(Date.now()).setHours(0)).setMinutes(0)
      ).setSeconds(0)
    );
    let query = [
      { $match: { timestamp: { $lt: Today, $gte: lastDay } } },
      { $unwind: "$overallData" },
      {
        $project: {
          device_name: "$overallData.device_name",
          memory_utilization: "$overallData.memory_utilization",
          cpu_utilization: "$overallData.cpu_utilization",
        },
      },
      {
        $group: {
          _id: "$device_name",
          maxmemory: { $max: "$memory_utilization" },
          minmemory: { $min: "$memory_utilization" },
          avgmemory: { $avg: "$memory_utilization" },
          maxcpu: { $max: "$cpu_utilization" },
          mincpu: { $min: "$cpu_utilization" },
          avgcpu: { $avg: "$cpu_utilization" },
        },
      },
    ];

    let result = await db.collection("cwnetworkhealthdrills")
      .aggregate(query)
      .toArray();
      if (result.length > 0) {
        let obj = {};
        obj["Devices"] = result;
        obj["timestamp"] = new Date(
          new Date(
            new Date(
              new Date(Date.now()).setMinutes(
                parseInt(new Date(Date.now()).getMinutes() / 5) * 5
              )
            ).setSeconds(0)
          ).setMilliseconds(0)
        );
        db.collection("SolarWindCPUMemoryTrend").insertOne(
          obj,
          function (error, result) {
            if (error) throw error;
            resolve("");
          }
        );
      }
  });
}
function GetConfigDetails2() {
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
            var Dec_Pass = decrypt(response.data, helpers.KeyPhrase);

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
function decrypt(encryptedText, key) {
  var crypto = require("crypto");
  var alg = "des-ede-cbc";
  var key = new Buffer(key, "utf-8");
  var iv = new Buffer("QUJDREVGR0g=", "base64"); //This is from c# cipher iv

  var encrypted = new Buffer(encryptedText, "base64");
  var decipher = crypto.createDecipheriv(alg, key, iv);
  var decoded = decipher.update(encrypted, "binary", "ascii");
  decoded += decipher.final("ascii");

  return decoded;
}

var cpuUtilizationSchema = new Schema({
  cpu_utilization: [
    {
      normal: String,
      moderate: String,
      risk: String,
    },
  ],
  memory_utilization: [
    {
      normal: String,
      moderate: String,
      risk: String,
    },
  ],
  timestamp: { type: Date, default: new Date() },
  // Site_Type:String
});
var wanLinkSchema = new Schema({
  up: Number,
  down: Number,
  timestamp: { type: Date, default: new Date() },
});
wanLinkDrill = new Schema({
  wanData: [
    {
      inmbps: String,
      status: Number,
      device_name: String,
      outmbps: String,
    },
  ],
  timestamp: { type: Date, default: new Date() },
});
inventoryCount = new Schema({
  upCount: Number,
  downCount: Number,
  timestamp: { type: Date, default: new Date() },
});
inventoryDrill = new Schema({
  inventryData: [
    {
      ip_address: String,
      status: Number,
      device_name: String,
      machine_type: String,
      device_type: String,
      memory_utilization: Number,
    },
  ],
  timestamp: { type: Date, default: new Date() },
});
cpuDrill = new Schema({
  cpu_utilization: {
    moderate: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
    normal: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
    risk: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
  },
  memory_utilization: {
    moderate: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
    normal: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
    risk: [
      {
        IP_Address: String,
        CPULoad: Number,
        Caption: String,
        Device_Type: String,
        PercentMemoryUsed: Number,
        MachineType: String,
      },
    ],
  },
  timestamp: { type: Date, default: new Date() },
});
var getNetworkSchema = new Schema({
  Data: [
    {
      normal: Number,
      moderate: Number,
      risk: Number,
      site_type: String,
    },
  ],
  timestamp: { type: Date, default: new Date() },
});
cwNetworkHealthDrill = new Schema({
  overallData: [
    {
      ip_address: String,
      category: String,
      device_name: String,
      machine_type: String,
      device_type: String,
      memory_utilization: Number,
      cpu_utilization: Number,
      location: String,
      performance: String,
      mac_address: String,
    },
  ],
  timestamp: { type: Date, default: new Date() },
});
const cpuutilization = mongoose.model(
  "cpuUtilizationSchema",
  cpuUtilizationSchema
);
const wanlinkSchema = mongoose.model("wanLinkSchema", wanLinkSchema);
const wanlinkdrill = mongoose.model("wanLinkDrill", wanLinkDrill);
const inventorySchema = mongoose.model("inventoryCount", inventoryCount);
const inventorydrill = mongoose.model("inventoryDrill", inventoryDrill);
const cpudrill = mongoose.model("cpuDrill", cpuDrill);
const getnetworkSchema = mongoose.model("getNetworkHealth", getNetworkSchema);
const cwnetworkhealthDrill = mongoose.model(
  "cwNetworkHealthDrill",
  cwNetworkHealthDrill
);

exports.getWanlink = getWanlink;
exports.getCPUutilizationData = getCPUutilizationData;
exports.getWanlinkDrillDown = getWanlinkDrillDown;
exports.getInventry = getInventry;
exports.getInventryDrill = getInventryDrill;
exports.getCpuDrill = getCpuDrill;
exports.getnetworkHealth = getnetworkHealth;
exports.getnetworkHealthDrillData = getnetworkHealthDrillData;
exports.connectSQL = connectSQL;
exports.createCPUMemoryTrend = createCPUMemoryTrend;
