class ConsolidateDnac1 {

  async saveConData1(db) {
    try {
      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newTimeStamp;
      if (data.length > 0) {
        newTimeStamp = await data[0].TimeStamp;
      } else {
        newTimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }




      let conInventoryHealth = await db.collection("InventoryHealth")
        .find({ timestamp: new Date(newTimeStamp) }).toArray();

      let IHTimeStamp;
      let Data = {
        Reachable: 0,
        Unreachable: 0
      };

      conInventoryHealth.map((item, index) => {
        IHTimeStamp = item.timestamp,
          Data.Reachable = Data.Reachable + item.Data.Reachable,
          Data.Unreachable = Data.Unreachable + item.Data.Unreachable
      })

      let IHObj = {
        timeStamp: IHTimeStamp,
        Data: Data
      }

      if (conInventoryHealth) {
        await this.saveConInventoryHealthData("Con_InventoryHealth", IHObj, db);
      }
      await this.DnacApplicationHealthData(db)
      await this.DnacInventoryHealthDrillDown(db, newTimeStamp)
      await this.DnacIssues(db)
      await this.DnacIssuesDrilDown(db)
      await this.DnacApplicationHealthDataDril(db)
    } catch (error) {
      console.log(error)
    }

  }

  /******* function of NetWorkHealthDrillDown *******/
  async DnacInventoryHealthDrillDown(db, timeStamp) {
    try {
      let conIHDD = await db.collection("InventoryHealthDrilDown")
        .find({ timestamp: new Date(timeStamp) }).toArray();

      let IHDDTimeStamp;
      let Data = [];

      conIHDD.map((item, index) => {
        IHDDTimeStamp = item.timestamp,
          item.Data.map((element) => {
            Data.push(element),
              element.location = item.location,
              element.id = item.id
          })
      })

      let IHDDObj = {
        timestamp: IHDDTimeStamp,
        Data: Data,
      }

      if (IHDDObj) {
        await this.saveConInventoryHealthDrillDown("Con_InventoryHealthDrilDown", IHDDObj, db);
      }
    } catch (error) {
      console.log(error)
    }
  }

  /******* function of DnacApplicationHealthData *******/
  async DnacApplicationHealthData(db) {
    try {
      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newTimeStamp;
      if (data.length > 0) {
        newTimeStamp = await data[0].TimeStamp;
      } else {
        newTimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }


      let conDnacAppHealth = await db.collection("DnacApplicationHealth")
        .find({ timestamp: new Date(newTimeStamp) }).toArray();
      let appHealthTimeStamp;
      let appHealthData = [];
      let AllDataCount = {
        allTotalCount: 0,
        allGoodCount: 0,
        allPoorCount: 0,
        allFairCount: 0,
        allUnknownCount: 0,
      };

      conDnacAppHealth && conDnacAppHealth.map((item, index) => {
        AllDataCount.allTotalCount = AllDataCount.allTotalCount + item.AllDataCount.allTotalCount,
        AllDataCount.allGoodCount = AllDataCount.allGoodCount + item.AllDataCount.allGoodCount,
        AllDataCount.allPoorCount = AllDataCount.allPoorCount + item.AllDataCount.allPoorCount,
        AllDataCount.allFairCount = AllDataCount.allFairCount + item.AllDataCount.allFairCount,
        AllDataCount.allUnknownCount = AllDataCount.allUnknownCount + item.AllDataCount.allUnknownCount,
        appHealthData = item.Data,
        appHealthTimeStamp = item.timestamp
      })

      let appHealthObj = {
        timeStamp: appHealthTimeStamp,
        AllDataCount,
        Data: appHealthData
      }

      if (conDnacAppHealth) {
        await this.saveDnacApplicatinHealthData("Con_DnacApplicationHealth", appHealthObj, db);
      }

    } catch (error) {
      console.log(error)
    }
  }

  /******* DnacApplicationHealthDataDril *******/
  async DnacApplicationHealthDataDril(db) {
    try {
      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newTimeStamp;
      if (data.length > 0) {
        newTimeStamp = await data[0].TimeStamp;
      } else {
        newTimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }

      let conDnacAppHeathDril = await db.collection("DnacApplicationHealthDrillData")
        .find({ timestamp: new Date(newTimeStamp) }).toArray();
      // let conTimeStamp;
      // let conId;
      // let conLocation;
      // let conData = [];

      // conDnacAppHeathDril.map((item, index) => {
      //   // console.log(item);
      //   conData = item.Data,
      //   conData["location"] = item.location,
      //     conId = item.id,
      //     // conLocation = item.location,
      //     conTimeStamp = item.timestamp
      // })

      // let conDnacAppHealthDataDril = {
      //   timestamp: conTimeStamp,
      //   id: conId,
      //   // location: conLocation,
      //   Data: conData
      // }
      let conTimeStamp = "";
      let dnacLocation = "";
      let site = "";
      let version = "";
      let totalCount = 0;

      let response = []

      conDnacAppHeathDril.map((item,index) => {
        conTimeStamp = item.timestamp
        if(item.Data.length >0){ 
          dnacLocation = item.Data[0] && item.Data[0].dnacLocation,
          site = item.Data[0] && item.Data[0].site,
          version = item.Data[0] && item.Data[0].version
        }
        totalCount +=  item.Data.length > 0 ? item.Data[0].totalCount : 0
        item.Data[0] && item.Data[0].response.map((ele) => {
          ele['location'] = item.location,
            response.push(ele)
        })
      })

      let finalObj = {
        dnacLocation,
        site,
        version,
        totalCount,
        response
      }

      let mainObj = {
        timestamp: conTimeStamp,
        Data: [
          finalObj
        ]
      }

      if (mainObj) {
        await this.saveConDnacApplicationHealthDataDril("Con_DnacApplicationHealthDrillData", mainObj, db);
      }

    } catch (error) {
      console.log(error)
    }
  }

  /******* function of DnacIssues *******/
  async DnacIssues(db) {
    try {

      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newTimeStamp;
      if (data.length > 0) {
        newTimeStamp = await data[0].TimeStamp;
      } else {
        newTimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }
      const endDateTime = newTimeStamp;
      const startDateTime = new Date(new Date(endDateTime).getTime() - (24 * 60 * 60 * 1000))
      let conDnacIssues = await db.collection("DnacIssues")
        .find({ timeStamp: { $gte: new Date(startDateTime), $lte: new Date(endDateTime) } }).toArray();
      let conTimeStamp;
      let conVerison;
      let conId;
      // let conLocation;
      let Data = [];

      // await conDnacIssues.map((item, index) => 
      for(let item of conDnacIssues){
        conTimeStamp = item.timeStamp
        conVerison = item.version
          // conId = item.id,
          // conLocation = item.location,
          // item.Data.map((element) => 
        for(let element of item.Data){
          element.location = item.location
          Data.push(element)
        }
        // Data.push(...(item.Data))
      }

      let DnacIssuesObj = {
        version: conVerison,
        timeStamp: newTimeStamp,
        // id: conId,
        // location :conLocation,
        Data
      }

      if (DnacIssuesObj) {
        await this.saveDnacIssues("Con_DnacIssues", DnacIssuesObj, db);
      }
    } catch (error) {
      console.log(error)
    }
  }

  /******* function of DnacIssuesDrillDown *******/
  async DnacIssuesDrilDown(db) {
    try {

      const data = await db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
      let newTimeStamp;
      if (data.length > 0) {
        newTimeStamp = await data[0].TimeStamp;
      } else {
        newTimeStamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
          parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
      }

      let conDnacIssuesDrillDownObj = await db.collection("DnacIssuesDrillDown")
        .find({ timeStamp: new Date(newTimeStamp) }).toArray();
      let conTimeStamp;
      let conId;
      let Data = [];

      // await conDnacIssuesDrillDownObj.map((item, index) => 
      for(let item of conDnacIssuesDrillDownObj){
        conTimeStamp = item.timeStamp
        conId = item.id
          // item.Data.map((element) => 
        for(let element of item.Data){
          element.location = item.location
          Data.push(element)
        }
        // Data.push(...(item.Data))
      }

      // await conDnacIssuesDrillDownObj.map((item, index) => {
      //   conTimeStamp = item.timeStamp,
      //     conId = item.id,
      //     item.Data.map((element) => {
      //       element.location = item.location
      //     })
      //   Data.push(...(item.Data))
      // })

      let DnacIssuesDrillDownObj = {
        timeStamp: conTimeStamp,
        id: conId,
        Data
      }

      console.log("DnacIssuesDrillDownObj => ",DnacIssuesDrillDownObj.Data.length)
      if (DnacIssuesDrillDownObj) {
        await this.saveDnacIssuesDrilDown("Con_DnacIssuesDrillDown", DnacIssuesDrillDownObj, db);
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*******  Con DnacApplicationHealthData  *******/
  async saveDnacApplicatinHealthData(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("data inserted successfullly in ConApplicatinHealthData");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }

  async saveConDnacApplicationHealthDataDril(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("data inserted successfullly in ConDnacApplicationHealthDataDril");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }

  /******* Con InventoryHealth Data  ******/
  async saveConInventoryHealthData(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("data inserted successfullly in ConInventoryHealthData");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }

  /******* Con of NetWorkHealthDrillDown *******/
  async saveConInventoryHealthDrillDown(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("data inserted successfullly in ConInventoryHealthDrillDown");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }

  /******* Con of Dnac Issues *******/
  async saveDnacIssues(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        // console.log("data inserted successfullly in ConDnacIssues");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }

  /******* Con of DnacIssues DrilDown ******/
  async saveDnacIssuesDrilDown(collection, data, db) {
    try {
      const result = await db.collection(collection).insertOne(data);
      if (result) {
        console.log("data inserted successfullly in ConDnacIssuesDrilDown");
      } else {
        console.log("something went wrong");
      }
    } catch (err) {
      console.log("Unable to save", err);
    }
  }
}

module.exports = new ConsolidateDnac1();