
exports.getPackageDetails = async(db)=>{
    try{
        const packageData = await db.collection('tbl_Package').findOne({});
        return packageData;
    }catch(error){
        console.error("Error in getPackageDetails : ",error);
        return {};
    }
}
exports.insertSdwanHardwareHealth = async(db, hardwareList)=>{
    try{
        let res = await db.collection('SDWANEdgeHardwareHealth').insertOne(hardwareList);
    }catch(error){
        console.error("Error inserting SdwanHardwareHealth : ",error);
    }
}

exports.insertSdwanDeviceInventory = async(db, deviceData)=>{
    try{
        await db.collection('SDWANInventory').insertOne(deviceData);
    }catch(error){
        console.error("Error inserting SdwanDeviceInventory : ",error);
    }
}

exports.insertSdwanSiteHealth = async(db, connectivityList)=>{
    try{
        await db.collection('SDWANSiteHealth').insertOne(connectivityList);
    }catch(error){
        console.error("Error inserting SdwanSiteHealth : ",error);
    }
}

exports.insert_data_sdwan_link_performance_table = async(db, wanDevicesData)=>{
    try{
        await db.collection('SDWANWandevices').insertMany(wanDevicesData);
    }catch(error){
        console.error("Error inserting SdwanLinkPerformanceTable : ",error);
    }
}

exports.insertDataSdwanAlarmTable = async(db, alarmReportsData)=>{
    try{
        await db.collection('SDWANAlarmReport').insertMany(alarmReportsData);
    }catch(error){
        console.error("Error inserting SdwanAlarmTable : ",error);
    }
}

exports.insertDataSdwanAlarmTableRealTime = async(db, realTimeAlarmData)=>{
    try{
        await db.collection('SDWANRealTimeAlarmReport').insertOne(realTimeAlarmData);
    }catch(error){
        console.error("Error inserting SdwanAlarmTable : ",error);
    }
}

exports.insertMostUsesLinkPerformanceTable = async(db, tunnelData)=>{
    try{
        await db.collection('SDWANMostUsesLinks').insertMany(tunnelData);
    }catch(error){
        console.error("Error in InsertMostUsesLinkPerformanceTable : ",error);
    }
}

exports.insertDataIntrusionPrevention = async(db, intrusionPrevAlertData)=>{
    try{
        await db.collection('SDWANintrusionPrevAlert').insertMany(intrusionPrevAlertData);
    }catch(error){
        console.error("Error in InsertDataIntrusionPrevention : ",error);
    }
}

exports.insertDataSdwanSiteWiseTopUtilizedTable = async(db,topAppUsages)=>{
    try{
        await db.collection('SDWANTopAppUsages').insertOne(topAppUsages);
    }catch(error){
        console.error("Error in InsertDataSdwanSiteWiseTopUt",error);
    }
}

exports.insertDataSdwanSiteAvailable = async(db, wanDevicesData)=>{
    try{
        await db.collection('SDWANSiteAvailability').insertMany(wanDevicesData);
    }catch(error){
        console.error("Error in InsertDataSdwanSite",error);
    }
}

exports.insertSdwanSiteTopology = async(db, dataList)=>{
    try{
        await db.collection('SDWANTopology').insertOne(dataList);
    }catch(error){
        console.error("Error in InsertSdwanSiteTopology",error);
    }
}

exports.insertDataSdwanDeviceHealthMonitoringTable = async(db, devicesList)=>{
    try{
        await db.collection('SDWANAvgDeviceHealth').insertOne(devicesList);
    }catch(error){
        console.error("Error in InsertDataSdwanDeviceHealthMonitoringTable",error);
    }
}