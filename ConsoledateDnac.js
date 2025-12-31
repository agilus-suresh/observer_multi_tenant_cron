class ConsolidateDnac {
  //This is main function in the function call all the function which is defined in this class
  async saveConData(db, dnacVersion) {
    try {
      let pkgData = await db.collection("tbl_Package").find({}).toArray();
      let Length = pkgData[0].dnac.length;
      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newtimeStamp;
      if (data.length > 0) {
        newtimeStamp = await data[0].TimeStamp;
      } else {
        newtimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }
      let conNetworkHealth = await db.collection("NetworkHealth").find({ timestamp: new Date(newtimeStamp) }).toArray();
      let netWorkHelthtimeStamp;
      let totalHealthScore = 0;
      let TotalDevices = 0;
      let totalGoodCount = 0;
      let totalFairCount = 0;
      let totalUnmonCount = 0;
      let totalBadCount = 0;
      let totalNoHealthCount = 0;
      let previousObj = {};
      if (dnacVersion === "4") {
        //4 mean dnac version is 2.3.3.6
        conNetworkHealth.map((item, idex) => {
          netWorkHelthtimeStamp = item.timestamp,
            totalHealthScore += item.Data.HealthScore,
            TotalDevices += item.Data.TotalDevices,
            totalGoodCount += item.Data.GoodCount,
            totalFairCount += item.Data.FairCount,
            totalNoHealthCount += item.Data.NoHealthCount,
            totalBadCount += item.Data.BadCount
        })

        previousObj.HealthScore = totalHealthScore / Length;
        previousObj.TotalDevices = TotalDevices;
        previousObj.GoodCount = totalGoodCount;
        previousObj.FairCount = totalFairCount;
        previousObj.BadCount = totalBadCount;
        previousObj.NoHealthcount = totalNoHealthCount;
      } else {
        conNetworkHealth.map((item, idex) => {
          netWorkHelthtimeStamp = item.timestamp,
            totalHealthScore += item.Data.HealthScore,
            TotalDevices += item.Data.TotalDevices,
            totalGoodCount += item.Data.GoodCount,
            totalFairCount += item.Data.FairCount,
            totalUnmonCount += item.Data.UnmonCount,
            totalBadCount += item.Data.BadCount
        })
        previousObj.HealthScore = totalHealthScore / Length;
        previousObj.TotalDevices = TotalDevices;
        previousObj.GoodCount = totalGoodCount;
        previousObj.FairCount = totalFairCount;
        previousObj.BadCount = totalBadCount;
        previousObj.UnmonCount = totalUnmonCount;
      }

      // let previousObj = {
      //   HealthScore: totalHealthScore / Length,
      //   TotalDevices,
      //   GoodCount: totalGoodCount,
      //   FairCount: totalFairCount,
      //   BadCount: totalBadCount,
      //   UnmonCount: totalUnmonCount,
      // }
      let newObj = {
        timestamp: netWorkHelthtimeStamp,
        Data: previousObj
      }
      //This is for consolidate network helth
      if (conNetworkHealth) {
        await this.saveConsolidateData("Con_NetworkHealth", newObj, db);
      }

      //This is for CWNetworkHelth
      await this.saveCWNetworkHealthData(db, newtimeStamp, Length);

      //This is for SWIM Consolidate
      await this.saveSWIMComplianceData(db, newtimeStamp, Length);

      //This is for consolidate ClientHelth
      await this.saveConClienthealthData(db, newtimeStamp, Length);

      //This is for consolidate of ClientheathDataDrill
      await this.saveConClienthealthDataDril(db, newtimeStamp, Length);

      //This is for consolidate of wiredwireless
      await this.saveConWiredWirelessData(db, newtimeStamp, Length);

      //This is for consolidate of criticalDashboard
      await this.saveConCriticalDashboard(db, newtimeStamp, Length);

      await this.saveAccessPortUtilization(db, newtimeStamp, Length);

      await this.saveConSiteHealthData(db, newtimeStamp, Length);

    } catch (error) {
      console.log("error in consolidate", error);
    }
  }


  //------This is for CwNetworkHelth save data
  async saveCWNetworkHealthData(db, timeStamp, dnacLength) {
    try {
      let conCWNetworkHelth = await db.collection("CWNetworkHealth").find({ timestamp: new Date(timeStamp) }).toArray();
      let newtimeStamp;
      let newCore = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };
      let newAccess = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };

      let newDistribution = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };

      let newRouter = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };

      let newWLC = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };

      let newAP = {
        healthScore: 0,
        totalCount: 0,
        goodPercentage: 0,
        fairPercentage: 0,
        badPercentage: 0,
        unmonPercentage: 0
      };

      conCWNetworkHelth.map((item, index) => {
        newtimeStamp = item.timestamp,
        item.Data && item.Data.map((element) => {
            if (element.category == "Core") {
              newCore["category"] = "Core",
                newCore["healthScore"] = newCore.healthScore + element.healthScore,
                newCore["totalCount"] = newCore.totalCount + element.totalCount,
                newCore["goodPercentage"] = newCore.goodPercentage + element.goodPercentage,
                newCore["fairPercentage"] = newCore.fairPercentage + element.fairPercentage,
                newCore["badPercentage"] = newCore.badPercentage + element.badPercentage,
                newCore["unmonPercentage"] = newCore.unmonPercentage + element.unmonPercentage
            }
            else if (element.category == "Access") {
              newAccess["category"] = "Access",
                newAccess["healthScore"] = newAccess.healthScore + element.healthScore,
                newAccess["totalCount"] = newAccess.totalCount + element.totalCount,
                newAccess["goodPercentage"] = newAccess.goodPercentage + element.goodPercentage,
                newAccess["fairPercentage"] = newAccess.fairPercentage + element.fairPercentage,
                newAccess["badPercentage"] = newAccess.badPercentage + element.badPercentage,
                newAccess["unmonPercentage"] = newAccess.unmonPercentage + element.unmonPercentage
            }
            else if (element.category == "Distribution") {
              newDistribution["category"] = "Distribution",
                newDistribution["healthScore"] = newDistribution.healthScore + element.healthScore,
                newDistribution["totalCount"] = newDistribution.totalCount + element.totalCount,
                newDistribution["goodPercentage"] = newDistribution.goodPercentage + element.goodPercentage,
                newDistribution["fairPercentage"] = newDistribution.fairPercentage + element.fairPercentage,
                newDistribution["badPercentage"] = newDistribution.badPercentage + element.badPercentage,
                newDistribution["unmonPercentage"] = newDistribution.unmonPercentage + element.unmonPercentage
            }
            else if (element.category == "Router") {
              newRouter["category"] = "Router",
                newRouter["healthScore"] = newRouter.healthScore + element.healthScore,
                newRouter["totalCount"] = newRouter.totalCount + element.totalCount,
                newRouter["goodPercentage"] = newRouter.goodPercentage + element.goodPercentage,
                newRouter["fairPercentage"] = newRouter.fairPercentage + element.fairPercentage,
                newRouter["badPercentage"] = newRouter.badPercentage + element.badPercentage,
                newRouter["unmonPercentage"] = newRouter.unmonPercentage + element.unmonPercentage
            }
            else if (element.category == "WLC") {
              newWLC["category"] = "WLC",
                newWLC["healthScore"] = newWLC.healthScore + element.healthScore,
                newWLC["totalCount"] = newWLC.totalCount + element.totalCount,
                newWLC["goodPercentage"] = newWLC.goodPercentage + element.goodPercentage,
                newWLC["fairPercentage"] = newWLC.fairPercentage + element.fairPercentage,
                newWLC["badPercentage"] = newWLC.badPercentage + element.badPercentage,
                newWLC["unmonPercentage"] = newWLC.unmonPercentage + element.unmonPercentage
            }
            else if (element.category == "AP") {
              newAP["category"] = "AP",
                newAP["healthScore"] = newAP.healthScore + element.healthScore,
                newAP["totalCount"] = newAP.totalCount + element.totalCount,
                newAP["goodPercentage"] = newAP.goodPercentage + element.goodPercentage,
                newAP["fairPercentage"] = newAP.fairPercentage + element.fairPercentage,
                newAP["badPercentage"] = newAP.badPercentage + element.badPercentage,
                newAP["unmonPercentage"] = newAP.unmonPercentage + element.unmonPercentage
            }
          })
      })

      let mainArr = [newCore, newAccess, newDistribution, newRouter, newWLC, newAP];
      for (let i = 0; i < mainArr.length; i++) {
        mainArr[i].healthScore = mainArr[i].healthScore / dnacLength;
        mainArr[i].goodPercentage = mainArr[i].goodPercentage / dnacLength;
        mainArr[i].fairPercentage = mainArr[i].fairPercentage / dnacLength;
        mainArr[i].badPercentage = mainArr[i].badPercentage / dnacLength;
        mainArr[i].unmonPercentage = mainArr[i].unmonPercentage / dnacLength;
      }

      let newObj = {
        timestamp: newtimeStamp,
        Data: mainArr
      }
      if (conCWNetworkHelth) {
        await this.saveConsolidateData("Con_CWNetworkHealth", newObj, db);
      }
    } catch (error) {
      console.log("getting error in CWNetworkHelth", error);
    }
  }

  //Thsi is for SWIMCompliance consolidate
  async saveSWIMComplianceData(db, timeStamp, dnacLength) {
    try {
      let swimComplianceData = await db.collection("SWIM").find({ timestamp: new Date(timeStamp) }).toArray();
      let swimtime;
      let ComplaintCount = 0;
      let NoncomplaintCount = 0;
      let newObj = {};
      let complaintDevics = [];
      let nonComplaintDevices = [];
      let Devices = [];
      swimComplianceData.map((item) => {
        swimtime = item.timestamp
        ComplaintCount = ComplaintCount + item.Complaint.Count,
          NoncomplaintCount = NoncomplaintCount + item.Noncomplaint.Count
        // newObj["Complaint"] = item.Complaint.Devices
        // newObj["Noncomplaint"] = item.Noncomplaint.Devices
        item.Complaint.Devices.map((Data) => {
          Devices.push(Data),
            Data.location = item.location
        })
        item.Noncomplaint.Devices.map((Data) => {
          Devices.push(Data),
            Data.location = item.location
        })
        complaintDevics.push(...(item.Complaint.Devices));
        nonComplaintDevices.push(...(item.Noncomplaint.Devices));
      });
      // newObj["timestamp"] = swimtime;
      // newObj["Complaintcount"] = ComplaintCount;
      // newObj["NoncomplaintCount"] = NoncomplaintCount;
      let finalObj = {
        timestamp: swimtime,
        Complaint: {
          Count: ComplaintCount,
          Devices: complaintDevics
        },
        Noncomplaint: {
          Count: NoncomplaintCount,
          Devices: nonComplaintDevices
        }
      };

      //This is for consolidate of SWIM data
      if (swimComplianceData) {
        await this.saveConsolidateData("Con_SWIM", finalObj, db);
      }
    } catch (error) {
      console.log("getting error is", error);
    }
  }

  //This lines of code for save consolidated data of ClientHelth
  async saveConClienthealthData(db, timeStamp, dnacLength) {
    try {
      const clientHelthData = await db.collection("clienthealth").find({ timestamp: new Date(timeStamp) }).toArray();
      let timestamp;
      let newObj = {
        All: {
          count: 0,
          score: 0
        },
        Wired: {
          count: 0,
          score: 0
        },
        Wireless: {
          count: 0,
          score: 0
        }
      }
      clientHelthData.map((item, index) => {
        timestamp = item.timestamp;
        newObj.All.count = newObj.All.count + item.Data.All.count,
          newObj.All.score = newObj.All.score + item.Data.All.score,
          newObj.Wired.count = newObj.Wired.count + item.Data.Wired.count,
          newObj.Wired.score = newObj.Wired.score + item.Data.Wired.score,
          newObj.Wireless.count = newObj.Wireless.count + item.Data.Wireless.count,
          newObj.Wireless.score = newObj.Wireless.score + item.Data.Wireless.score

      })
      let finalObj = {
        id: "01",
        timestamp: timestamp,
        Data: newObj
      }
      //This is for consolidate of SWIM data
      if (clientHelthData) {
        await this.saveConsolidateData("Con_clienthealth", finalObj, db);
      }

    } catch (error) {
      console.log("getting error is ", error);
    }
  }


  //This function definition for saveConClienthealthDataDril 09/02/23
  async saveConClienthealthDataDril(db, timeStamp, dnacLength) {
    try {
      const clientHelthData = await db.collection("ClientHealthDataDrill").find({ timestamp: new Date(timeStamp) }).toArray();
      let timestamp;
      let dataFetchFrom;
      let recordset = [];
      clientHelthData.map((item) => {
        timestamp = item.timestamp,
          dataFetchFrom = item.dataFetchFrom,
          item.recordset.map((data) => {
            recordset.push(data),
              data.location = item.location
          })
        // recordset.push(...(item.recordset))
      })
      let newObj = {
        timestamp: timestamp,
        dataFetchFrom,
        recordset
      }
      if (newObj) {
        await this.saveConsolidateData("Con_ClientHealthDataDrill", newObj, db);
      }
    } catch (error) {
      console.log("getting error in the clienthealthDataDrill");
    }
  }

  //This function definition for consolidate of wiredwireless collection
  async saveConWiredWirelessData(db, timeStamp, dnacLength) {
    try {
      let wiredwirelessData = await db.collection("WiredWireless").find({ timestamp: new Date(timeStamp) }).toArray();
      let timestamp;
      let Wired = {
        POOR: 0,
        FAIR: 0,
        GOOD: 0,
        IDLE: 0,
        NODATA: 0,
        NEW: 0
      };
      let Wireless = {
        POOR: 0,
        FAIR: 0,
        GOOD: 0,
        IDLE: 0,
        NODATA: 0,
        NEW: 0
      };
      wiredwirelessData.forEach((item) => {
        timestamp = item.timestamp;
        if(Object.keys(item.Data.Wired).length > 0 ){
          Wired.POOR = Wired.POOR + item.Data.Wired.POOR;
          Wired.FAIR = Wired.FAIR + item.Data.Wired.FAIR;
          Wired.GOOD = Wired.GOOD + item.Data.Wired.GOOD;
          Wired.IDLE = Wired.IDLE + item.Data.Wired.IDLE;
          Wired.NODATA = Wired.NODATA + item.Data.Wired.NODATA;
          Wired.NEW = Wired.NEW + item.Data.Wired.NEW;
        }
        if(Object.keys(item.Data.Wireless).length > 0){
          Wireless.POOR = Wireless.POOR + item.Data.Wireless.POOR;
          Wireless.FAIR = Wireless.FAIR + item.Data.Wireless.FAIR;
          Wireless.GOOD = Wireless.GOOD + item.Data.Wireless.GOOD;
          Wireless.IDLE = Wireless.IDLE + item.Data.Wireless.IDLE;
          Wireless.NODATA = Wireless.NODATA + item.Data.Wireless.NODATA;
          Wireless.NEW = Wireless.NEW + item.Data.Wireless.NEW
        }
      })

      let newObj = {
        timestamp,
        Data: {
          Wired,
          Wireless
        }
      }
      if (wiredwirelessData !== undefined || wiredwirelessData !== null) {
        await this.saveConsolidateData("Con_WiredWireless", newObj, db);
      } else {
        console.log("data not availble for save in the consolidate WiredWireless collection");
      }
    } catch (error) {
      console.log("getting error in the saveConWiredWirelessData function", error);
    }
  }

  //this function for calculation of consolidate of critical dashboard
  async saveConCriticalDashboard(db, timeStamp, dnacLength) {
    try {
      let mixCriticalData = await db.collection("CriticalDashboard").find({ timestamp: new Date(timeStamp && timeStamp) }).toArray();
      let finalDict = {};
      let allDeviceKeys;
      let flag = 0;
      if (mixCriticalData.length > 0) {
        allDeviceKeys = Object.keys(mixCriticalData[0]);
      }

      allDeviceKeys && allDeviceKeys.map((key) => {
        finalDict[key] = mixCriticalData[0][key];
      });

      mixCriticalData && mixCriticalData.map((item, index) => {
        if (!index) return

        finalDict['timestamp'] = timeStamp;
        // Addition logic.
        let access = finalDict['Blocks']['Access'];
        access['Good'] += item.Blocks.Access.Good;
        access['Fair'] += item.Blocks.Access.Fair;
        access['Poor'] += item.Blocks.Access.Poor;
        access['GoodPercentage'] += item.Blocks.Access.GoodPercentage;
        access['FairPercentage'] += item.Blocks.Access.FairPercentage;
        access['PoorPercentage'] += item.Blocks.Access.PoorPercentage;

        let router = finalDict['Blocks']['Router'];
        router['Good'] += item.Blocks.Router.Good;
        router['Fair'] += item.Blocks.Router.Fair;
        router['Poor'] += item.Blocks.Router.Poor;
        router['GoodPercentage'] += item.Blocks.Router.GoodPercentage;
        router['FairPercentage'] += item.Blocks.Router.FairPercentage;
        router['PoorPercentage'] += item.Blocks.Router.PoorPercentage;

        let core = finalDict['Blocks']['Core'];
        core['Good'] += item.Blocks.Core.Good;
        core['Fair'] += item.Blocks.Core.Fair;
        core['Poor'] += item.Blocks.Core.Poor;
        core['GoodPercentage'] += item.Blocks.Core.GoodPercentage;
        core['FairPercentage'] += item.Blocks.Core.FairPercentage;
        core['PoorPercentage'] += item.Blocks.Core.PoorPercentage;

        let disbution = finalDict['Blocks']['Distribution'];
        disbution['Good'] += item.Blocks.Distribution.Good;
        disbution['Fair'] += item.Blocks.Distribution.Fair;
        disbution['Poor'] += item.Blocks.Distribution.Poor;
        disbution['GoodPercentage'] += item.Blocks.Distribution.GoodPercentage;
        disbution['FairPercentage'] += item.Blocks.Distribution.FairPercentage;
        disbution['PoorPercentage'] += item.Blocks.Distribution.PoorPercentage;

        let wlc = finalDict['Blocks']['WLC'];
        wlc['Good'] += item.Blocks.WLC.Good;
        wlc['Fair'] += item.Blocks.WLC.Fair;
        wlc['Poor'] += item.Blocks.WLC.Poor;
        wlc['GoodPercentage'] += item.Blocks.WLC.GoodPercentage;
        wlc['FairPercentage'] += item.Blocks.WLC.FairPercentage;
        wlc['PoorPercentage'] += item.Blocks.WLC.PoorPercentage;

        let ap = finalDict['Blocks']['AP'];
        ap['Good'] += item.Blocks.AP.Good;
        ap['Fair'] += item.Blocks.AP.Fair;
        ap['Poor'] += item.Blocks.AP.Poor;
        ap['GoodPercentage'] += item.Blocks.AP.GoodPercentage;
        ap['FairPercentage'] += item.Blocks.AP.FairPercentage;
        ap['PoorPercentage'] += item.Blocks.AP.PoorPercentage;


        //This is for Charts object
        let overallHealth = finalDict['Charts']['OverallHealth'];
        overallHealth['Good'] += item.Charts.OverallHealth.Good;
        overallHealth['Fair'] += item.Charts.OverallHealth.Fair;
        overallHealth['Poor'] += item.Charts.OverallHealth.Poor;
        overallHealth['GoodPercentage'] += item.Charts.OverallHealth.GoodPercentage;
        overallHealth['FairPercentage'] += item.Charts.OverallHealth.FairPercentage;
        overallHealth['PoorPercentage'] += item.Charts.OverallHealth.PoorPercentage;

        let memoryHealth = finalDict['Charts']['MemoryHealth'];
        memoryHealth['Good'] += item.Charts.MemoryHealth.Good;
        memoryHealth['Fair'] += item.Charts.MemoryHealth.Fair;
        memoryHealth['Poor'] += item.Charts.MemoryHealth.Poor;
        memoryHealth['GoodPercentage'] += item.Charts.MemoryHealth.GoodPercentage;
        memoryHealth['FairPercentage'] += item.Charts.MemoryHealth.FairPercentage;
        memoryHealth['PoorPercentage'] += item.Charts.MemoryHealth.PoorPercentage;

        let cpuHealth = finalDict['Charts']['CPUHealth'];
        cpuHealth['Good'] += item.Charts.CPUHealth.Good;
        cpuHealth['Fair'] += item.Charts.CPUHealth.Fair;
        cpuHealth['Poor'] += item.Charts.CPUHealth.Poor;
        cpuHealth['GoodPercentage'] += item.Charts.CPUHealth.GoodPercentage;
        cpuHealth['FairPercentage'] += item.Charts.CPUHealth.FairPercentage;
        cpuHealth['PoorPercentage'] += item.Charts.CPUHealth.PoorPercentage;

        //this is for DevicesList
        if (item.DevicesList.length > 0) {
          item && item.DevicesList.map((item, index) => {
            finalDict['DevicesList'][index].communicationState = String(finalDict['DevicesList'][index] && finalDict['DevicesList'][index].communicationState).replace(null, item.communicationState)

            finalDict['DevicesList'][index].cpuScore += item.cpuScore;

            finalDict['DevicesList'][index].macAddress = String(finalDict['DevicesList'][index].macAddress).replace(null, item.macAddress)

            finalDict['DevicesList'][index].memoryScore += item.memoryScore;

            finalDict['DevicesList'][index].nwDeviceName = String(finalDict['DevicesList'][index].nwDeviceName).replace(null, item.nwDeviceName)

            finalDict['DevicesList'][index].nwDeviceRole = String(finalDict['DevicesList'][index].nwDeviceRole).replace(null, item.nwDeviceRole)

            finalDict['DevicesList'][index].overallHealth += item.overallHealth;
          })
        }

      })
      const { _id, id, location, ...newObj } = finalDict;
      if (mixCriticalData !== undefined) {
        await this.saveConsolidateData("Con_CriticalDashboard", newObj, db);
      } else {
        console.log("data not availble in the CriticalDashboard for consolidate");
      }
    } catch (error) {
      console.log("getting error in saveConCriticaldashboard", error);
    }
  }


  //This function is used for consolidate of Access Port Utilization
  async saveAccessPortUtilization(db, timeStamp, dnacLength) {
    try {
      let totalData = await db.collection("InterfaceAvailibility").find({ timestamp: new Date(timeStamp) }).toArray();

      let timestamp;
      let newArr = [];

      totalData.map((item) => {
        timestamp = item.timestamp,
          newArr.push(...item.Data)
      })
      let siteTotal = 0;
      let siteUtilized = 0;
      let siteFree = 0;
      newArr.map((item) => {
        siteTotal = siteTotal + item.siteTotal,
          siteUtilized = siteUtilized + item.siteUtilized,
          siteFree = siteFree + item.siteFree
      })
      let total = {
        siteTotal,
        siteUtilized,
        siteFree
      }
      let obj = {
        timestamp: timestamp,
        Data: newArr,
        totalData: total
      }
      if (totalData.length > 0) {
        await this.saveConsolidateData("Con_InterfaceAvailibility", obj, db);
      }
    } catch (err) {
      console.log("getting error in saveAccessPortUtilization", err);
    }
  }

  //This function is used to save data in the conSiteHealth
  async saveConSiteHealthData(db, timeStamp, dnacLength) {
    let mixSiteHealthData = await db.collection("SiteHealth").find({ timestamp: new Date(timeStamp && timeStamp) }).toArray();

    let Data = []
    let allSitelat = ''
    let allSitelong = ''

    mixSiteHealthData.map((item) => {
        item.Data.map((ele) => {
          Data.push(ele)
        })
    })

    let Access = {
      type: '',
      healthScore: 0,
      count: 0
    }

    let Core = {
      type: '',
      healthScore: 0,
      count: 0
    }

    let Router = {
      type: '',
      healthScore: 0,
      count: 0
    }

    let Distributed = {
      type: '',
      healthScore: 0,
      count: 0
    }

    let Wireless = {
      type: '',
      healthScore: 0,
      count: 0
    }

    let healthyNetworkDevices = {
      healthyNetworkDevicesPrecentages: 0,
      healthyNetworkDevices: 0
    }

    let WiredClient = {
      type: '',
      totalCount: 0,
      goodCount: 0
    }

    let WirelessClient = {
      type: '',
      totalCount: 0,
      goodCount: 0
    }


    Data.map((item, index) => {
      if ('All Sites' in item) {
        allSitelat = item['All Sites'].latitude,
          allSitelong = item['All Sites'].longitude

        Access.type = item['All Sites'].Access.type,
          Access.healthScore += item['All Sites'].Access.healthScore,
          Access.count += item['All Sites'].Access.count,
          Access['deviceRole'] = item['All Sites'].Access.deviceRole,

          Core.type = item['All Sites'].Core.type,
          Core.healthScore += item['All Sites'].Core.healthScore,
          Core.count += item['All Sites'].Core.count,
          Core['deviceRole'] = item['All Sites'].Core.deviceRole,

          Router.type = item['All Sites'].Router.type,
          Router.healthScore += item['All Sites'].Router.healthScore,
          Router.count += item['All Sites'].Router.count,
          Router['deviceRole'] = item['All Sites'].Router.deviceRole,

          Distributed.type = item['All Sites'].Distributed.type,
          Distributed.healthScore += item['All Sites'].Distributed.healthScore,
          Distributed.count += item['All Sites'].Distributed.count,
          Distributed['deviceRole'] = item['All Sites'].Distributed.deviceRole,

          Wireless.type = item['All Sites'].Wireless.type,
          Wireless.healthScore += item['All Sites'].Wireless.healthScore,
          Wireless.count += item['All Sites'].Wireless.count,
          Wireless['deviceRole'] = item['All Sites'].Wireless.deviceRole,

          healthyNetworkDevices.healthyNetworkDevicesPrecentages += item['All Sites'].healthyNetworkDevices.healthyNetworkDevicesPrecentages,
          healthyNetworkDevices.healthyNetworkDevices += item['All Sites'].healthyNetworkDevices.healthyNetworkDevices,

          WiredClient.type = item['All Sites'].WiredClient.type,
          WiredClient.totalCount += item['All Sites'].WiredClient.totalCount,
          WiredClient.goodCount += item['All Sites'].WiredClient.goodCount,
          WiredClient['deviceRole'] = item['All Sites'].WiredClient.deviceRole,

          WirelessClient.type = item['All Sites'].WirelessClient.type,
          WirelessClient.totalCount += item['All Sites'].WirelessClient.totalCount,
          WirelessClient.goodCount += item['All Sites'].WirelessClient.goodCount,
          WirelessClient['deviceRole'] = item['All Sites'].WirelessClient.deviceRole

      }
    })
    let finalData = []
    Data.map((item) => {
      if ('All Sites' in item) {

      } else {
        finalData.push(item)
      }
    })


    finalData['All Sites'] = {
      ['All Sites']: {
        latitude: allSitelat,
        longitude: allSitelong,
        Access,
        Core,
        Router,
        Distributed,
        Wireless,
        healthyNetworkDevices,
        WiredClient,
        WirelessClient
      }
    }

    let mainData = [finalData['All Sites'], ...finalData]
    let mainObj = {
      timestamp: timeStamp,
      Data: mainData
    }
    await this.saveConsolidateData("Con_SiteHealth", mainObj, db);
  }


  /***********************************This is for save data in the consolidate table************************************* */
  async saveConsolidateData(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("Consolidate data inseted successfullly");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("getting error ", err);
    }
  }


}

module.exports = new ConsolidateDnac();