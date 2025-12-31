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
var ThausandEyes = require("./Thausandeyes.js");
const to_json = require("xmljson").to_json;
const Schema = mongoose.Schema;
const ProductSchema = new Schema({}, { strict: false });
const Product = mongoose.model("Product", ProductSchema, "products");
const helpers = require("./Utilities/helper");
const msal = require("@azure/msal-node");
const consoleDataDnac = require("./ConsoledateDnac");
const consoleDataDnac1 = require("./consolidateDnac1");
var dbo = null;
var db = null;
let cliDetConfig = "";
var http = require("http");
var querystring = require("querystring");
var xml2JsonParser = require("fast-xml-parser");
const { Exception } = require("handlebars");
const { createCipheriv } = require("crypto");
var xmlOptions = {
	attributeNamePrefix: "",
	ignoreAttributes: false,
	ignoreNameSpace: false,
};
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
const { sdwanDeviceInventory, sdwanSiteHealth, sdwanHardwareHealth, downloadMonthlyUsesTunnel, downloadOpenAlarmReport, getSessionId, getSdwanToken } = require("./ciscoSDWAN/ciscoSdwan.js");
const DownloadMonthlyUsesDevicesDb = require("./ciscoSDWAN/avgDeviceHealth.js");
const MostUsesTunnelDb = require("./ciscoSDWAN/mostUsesTunnel.js");
const IntrusionPreventionAlertSchedule = require("./ciscoSDWAN/preventionAlert.js");
const DownloadAlarmReportForRealTimeStatus = require("./ciscoSDWAN/realTimeAlarmReport.js");
const SiteAvailabilityDb = require("./ciscoSDWAN/siteAvailibity.js");
const SDWANTopology = require("./ciscoSDWAN/topology.js");
const SDWANTopUtilizedApps = require("./ciscoSDWAN/topUtilizedApp.js");
const { getPackageDetails } = require("./ciscoSDWAN/databaseOperation.js");
const { syncEverestIncidents } = require("./everest.js");
// const writeJsonToFile = require("./app.js");

var StartTime = ""; //new Date("2019-12-12T18:10:00");


// var Pkg = mongoose.model("Pkg", new Schema(), "tbl_Package");
// var ServiceListData = mongoose.model("ServiceList", new Schema(), "TblServiceList");
// var Criticl = mongoose.model("Criticl", new Schema(), "tbl_CriticalDevices");
// var criticalTrend = mongoose.model("criticalTrend", new Schema(), "CriticalDashboard");
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
var dnacVersion = "";
var InterfaceAvailibilityData = "";
var SWIMData = "";
var CriticalDashboardData = "";
var FormattedDeviceTopologyHealthData = null;
var PackageData = null;
let IsePostureCount = null;
let IseActiveList = null;
let IseAuthList = null;
let IseUserNameApi = null;
var merakiNetworkList = null;
var activeDnacLenght = null;
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
	ThousandEyes: false,
	"Compliance Engine": false,
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
let ThausandEyesTask;
let SolarwindTask;
let CriticalTask;
let ArchieveServiceNowTask;
let ServiceNowTask;
let sdwanTask;
let TimeInsertTask;
let MerakiTrafficTrendTask;
let IseTask;
let IseFailureReasonTask;
let UpdateAtMidNightTask;
let licenseExpiryNotificationTask;
let cliRepDetailUpdateTask;
let dnacSiteTopologyDataTask;
let usageThFilterData;

(async () => {
	let objConfigDetails = await GetConfigDetails();
	let fileRead = await GetConstantDetails();

	StartTime = fileRead;

	// await mongoose
	// 	.connect(
	// 		`mongodb://${objConfigDetails.MongoUserName}:${objConfigDetails.MongoPassword}@${objConfigDetails.MongoConnectionString}/${objConfigDetails.MongoDataBase}?authMechanism=SCRAM-SHA-256`
	// 	)
	// 	.then((data) => {
	// 		// console.log("Database connected");
	// 	})
	// 	.catch((error) => {
	// 		console.log("error", error);
	// 	});

	// MongoClient.connect(
    // `mongodb://${objConfigDetails.MongoUserName}:${objConfigDetails.MongoPassword}@${objConfigDetails.MongoConnectionString}/${objConfigDetails.MongoDataBase}?authMechanism=SCRAM-SHA-256`
    // )
	// 	.then(async(data) => {
	// 		dbo = data.db(objConfigDetails.MongoDataBase);
    //   // dbo = dbs;
    //   db = dbo;
    
    //   fetchToolConfig();
    //   checkHostOrReport();
    //   licenseExpiryNotificationCron().schedule = true;
    //   licenseExpiryNotificationCron().start();
    //   dnacSiteTopologyDataCron().schedule = true;
    //   dnacSiteTopologyDataCron().start();
    //   usageThousandApiCron().schedule = true;
    //   usageThousandApiCron().start();
    //   // Email auth type check. Only generate OAuth Tokens if OAuth 2.0 is enabled at client.
    
    //   const emailType = await db.collection("tbl_Package").find({}, { EmailAuthType: 1 }).toArray();
    //   // console.log("emailType", emailType);
    
    //   if (emailType[0].EmailAuthType === "OAuth 2.0") {
    //     funcUpdateOauth2Tokens();
    //     updateOauth2AccessTokenCron().schedule = true;
    //     updateOauth2AccessTokenCron().start();
    //   }
	// 	})
	// 	.catch((err) => {
	// 		console.log("err", err);
	// 	});

	// mongoose.connection.on("error", (err) => console.log(err));
	// mongoose.connection.on("connected", () => {});

	// new code for multi tenant implementation

	const clients = await loadClientsFromControlDB();

	for (const client of clients) {
		const ctx = await createClientContext(client);
		// console.log("ctx", ctx);
		
		await startClientCrons(ctx);
	}

})();

async function loadClientsFromControlDB() {
		let details = await GetConfigData();
		return details;
}


async function createClientContext(clientConfig) {
	
  const conn = await mongoose.createConnection(clientConfig.dbUri);
  return {
    clientId: clientConfig.clientId,
    db: conn,
	tools: clientConfig.tools
 };
}


async function startClientCrons(clientCtx) {
	setTimeout(() => {
		clientCtx.db.on("error", (err) => console.log(err));
		clientCtx.db.on("connected", () => {});
	},5000)
//   if (clientCtx.tools["DNA-C"]) {	
        await fetchToolConfig(clientCtx);
	    // checkHostOrReport(clientCtx);
		// licenseExpiryNotificationCron(clientCtx).schedule = true;
		// licenseExpiryNotificationCron(clientCtx).start();
		// dnacSiteTopologyDataCron(clientCtx).schedule = true;
		// dnacSiteTopologyDataCron(clientCtx).start();
		// usageThousandApiCron(clientCtx).schedule = true;
		// usageThousandApiCron(clientCtx).start();
		// everestIncidentsCron(clientCtx).schedule = true;
		// everestIncidentsCron(clientCtx).start()
		// everestIndividualIncidentsCron(clientCtx).schedule = true;
		// everestIndividualIncidentsCron(clientCtx).start();
 

		// Email auth type check. Only generate OAuth Tokens if OAuth 2.0 is enabled at client.
//   }
}



const checkHostOrReport = async (clientCtx) => {
	try {
		let cliDetConfig = await getCliDetaConfig(clientCtx);
		if (cliDetConfig === "Report") {
			// const data = await Pkg.find({});
			const data = await clientCtx.db.collection("tbl_Package").find({}).toArray();
			const multidnac = data && data[0]._doc && data[0]._doc.dnac;
			fetchCliRepoData(multidnac[0]);
		}
		cliRepDetailUpdateCron().schedule = true;
		cliRepDetailUpdateCron().start();
	} catch (error) {
		console.log(error);
	}
};

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
			return true;
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
// Work for checking today date is date for sending mailer or not ,starts.
//////////////////////////////////////////////////////////////////////////

// cron scheduled at 7AM daily for checking today date is date for sending mailer or not.

const licenseExpiryNotificationCron = (clientCtx) => {
	licenseExpiryNotificationTask = cron.schedule(
		`0 7 * * *`,
		// `*/1 * * * *`,
		async () => {
			let thrChk = await licenseExpiryFirstNotificationCheck(clientCtx);
			if (!thrChk) {
				let secChk = await licenseExpirySecondNotificationCheck(clientCtx);
				if (!secChk) {
					await licenseExpiryThirdNotificationCheck(clientCtx);
				}
			}
		},
		{ scheduled: false }
	);
	return licenseExpiryNotificationTask;
};

// functions for fetching expiry days from TblServiceList and triggering the mailer function.
const licenseExpiryFirstNotificationCheck = async (clientCtx) => {
	let expiryDays = await fetchExpiryDays(clientCtx);
	// console.log(`Running a job for ${expiryDays[0].Value1} days check`);
	let data = mailerFunction(expiryDays[0].Value1,clientCtx);
	return data;
};

const licenseExpirySecondNotificationCheck = async (clientCtx) => {
	let expiryDays = await fetchExpiryDays(clientCtx);
	// console.log(`Running a job for ${expiryDays[0].Value2} days check`);
	let data = mailerFunction(expiryDays[0].Value2);
	return data;
};

const licenseExpiryThirdNotificationCheck = async (clientCtx) => {
	let expiryDays = await fetchExpiryDays(clientCtx);
	// console.log(`Running a job for ${expiryDays[0].Value3} days check`);
	let data = mailerFunction(expiryDays[0].Value3);
	return data;
};

// fn to fetch expiry days interval from TblServiceList.
const fetchExpiryDays = async (clientCtx) => {
	let expiryDays = await clientCtx.db
		.collection("TblServiceList")
		.find({ KeyType: "LicenseExpiry", CurrentlyInUse: 1 })
		.toArray();
	return expiryDays;
};

// fn for fetching the expiry date from tbl_Package.
const fetchExpiryDate = async (clientCtx) => {
	let expiryDate = null;
	let tblPackageData = await clientCtx.db.collection("tbl_Package").find({}, { LCdata: 1 }).toArray();
	if (tblPackageData[0].LCdata) {
		expiryDate = helpers.decrypt(tblPackageData[0].LCdata, helpers.KeyPhrase);
	}
	return expiryDate;
};

// fn to calculate the difference of the 30, 15 or 2 days.
const mailerFunction = async (expiryDays,clientCtx) => {
	let finalChk = 0;
	let expiryDate = await fetchExpiryDate();
	let date = new Date(expiryDate);
	date.setDate(date.getDate() - expiryDays);
	let newDate = moment(date).format("YYYY-MM-DD");
	let currentDate = moment(new Date()).format("YYYY-MM-DD");
	if (currentDate == newDate) {
		let value = await mailer.licenseExpiryNotificationEmail(clientCtx.db);
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
const fetchToolConfig = async (clientCtx) => {
	// const toolsData = await db.collection("tbl_configurations").find({}).toArray();
	const toolsData = await clientCtx.db.collection("tbl_configurations").find({});

	toolsData.forEach((ele) => {
		if (ele.AllowedBySuperAdmin === true) {
			toolObj[ele.Name] = ele.AllowedBySuperAdmin;
		}
	});
	toolObj2 = { ...toolObj };
	// console.log(toolObj2)
	// getCronTimeInterval(data._doc);
	await getCronTimeInterval(clientCtx);
	await checkHostOrReport(clientCtx);
	licenseExpiryNotificationCron(clientCtx).schedule = true;
	licenseExpiryNotificationCron(clientCtx).start();
	dnacSiteTopologyDataCron(clientCtx).schedule = true;
	dnacSiteTopologyDataCron(clientCtx).start();
	usageThousandApiCron(clientCtx).schedule = true;
	usageThousandApiCron(clientCtx).start();
	everestIncidentsCron(clientCtx).schedule = true;
    everestIncidentsCron(clientCtx).start()
    everestIndividualIncidentsCron(clientCtx).schedule = true;
    everestIndividualIncidentsCron(clientCtx).start();

	const emailType = await clientCtx.db.collection("tbl_Package").find({}, { projection: { EmailAuthType: 1 } }).toArray();

	// console.log("emailType", emailType);

	if (emailType[0].EmailAuthType === "OAuth 2.0") {
		funcUpdateOauth2Tokens(clientCtx);
		updateOauth2AccessTokenCron(clientCtx).schedule = true;
		updateOauth2AccessTokenCron().start();
	}
};

// start the cron according to cron time for first time.
const getCronTimeInterval = async (clientCtx) => {
	try {
		// const data = await Pkg.find({});
		const data = await clientCtx.db.collection("tbl_Package").find({}).toArray();
		cliDetConfig = await getCliDetaConfig(clientCtx);
		if (data) {			
			cronRunTime = parseFunction(data[0]);
			
			cronTesting(cronRunTime).schedule = true;
			cronTesting(cronRunTime).start();
			{
				toolObj["DNA-C"]
					? ((dnacTaskCron(cronRunTime,clientCtx).schedule = true),
					  dnacTaskCron(cronRunTime,clientCtx).start(),
					  (criticalTaskCron(cronRunTime,clientCtx).schedule = true),
					  criticalTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			{
				toolObj["ServiceNow"]
					? ((archieveServiceNowTaskCron(cronRunTime,clientCtx).schedule = true),
					  archieveServiceNowTaskCron(cronRunTime,clientCtx).start(),
					  (serviceNowTaskCron(cronRunTime,clientCtx).schedule = true),
					  serviceNowTaskCron(cronRunTime,clientCtx).start(),
					  (dailySlaTaskCron(cronRunTime,clientCtx).schedule = true),
					  dailySlaTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			{
				toolObj["SolarWinds"]
					? ((solarwindTaskCron(cronRunTime,clientCtx).schedule = true),
					  solarwindTaskCron(cronRunTime,clientCtx).start(),
					  (solarwindCPUMemoryTrendTaskCron(cronRunTime,clientCtx).schedule = true),
					  solarwindCPUMemoryTrendTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			{
				toolObj["Meraki"]
					? ((merakiTaskCron(cronRunTime,clientCtx).schedule = true),
					  merakiTaskCron(cronRunTime,clientCtx).start(),
					  (merakiTrafficTrendTaskCron(cronRunTime,clientCtx).schedule = true),
					  merakiTrafficTrendTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			{
				toolObj["PSIRT"]
					? ((psirtTaskCron(cronRunTime,clientCtx).schedule = true),
					  psirtTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			{
				toolObj["ThousandEyes"]
					? ((thausandEyesTaskCron(cronRunTime,clientCtx).schedule = true),
					  thausandEyesTaskCron(cronRunTime,clientCtx).start(),
					  (thAgentsAndMonitorsTaskCron(cronRunTime,clientCtx).schedule = true),
					  thAgentsAndMonitorsTaskCron(cronRunTime,clientCtx).start(),
					  (thEndPointAgentTaskCron(cronRunTime,clientCtx).schedule = true),
					  thEndPointAgentTaskCron(cronRunTime,clientCtx).start(),
					  (thUsageTaskCron(cronRunTime,clientCtx).schedule = true),
					  thUsageTaskCron(cronRunTime,clientCtx).start())
					: null;
			}
			// {
			// 	toolObj["The Optimizer"]
			// 		? ((hardningiTaskCron(cronRunTime,clientCtx).schedule = true),
			// 		  hardningiTaskCron(cronRunTime,clientCtx).start())
			// 		: null;
			// }
			// {
			// 	toolObj["Prime"]
			// 		? ((primeTaskCron(cronRunTime,clientCtx).schedule = true),
			// 		  primeTaskCron(cronRunTime,clientCtx).start())
			// 		: null;
			// }
			// {
			// 	toolObj["ISE"]
			// 		? ((iseTaskCron(cronRunTime,clientCtx).schedule = true),
			// 		  iseTaskCron(cronRunTime,clientCtx).start(),
			// 		  (iseFailureReasonTaskCron(clientCtx).schedule = true),
			// 		  iseFailureReasonTaskCron(clientCtx).start())
			// 		: null;
			// }
			// {
			// 	toolObj["Cisco SDWAN"]
			// 	?(ciscoSdwanTaskCron(cronRunTime,clientCtx).schedule = true,
			// 	  ciscoSdwanTaskCron(cronRunTime,clientCtx).start())
			// 	: null;
			// }
			timeInsertTaskCron(cronRunTime,clientCtx).schedule = true;
			timeInsertTaskCron(cronRunTime,clientCtx).start();

			cronUpdateAtMidNight(cronRunTime,clientCtx).schedule = true;
			cronUpdateAtMidNight(cronRunTime,clientCtx).start();
		}
	} catch (error) {
		console.log("getting error is", error);
	}
};

// fn to check for any change in tool config.
const checkToolAtMidNight = async () => {
	const toolsData = await db.collection("tbl_configurations").find({}).toArray();
	let arr = toolsData.filter((ele) => ele.AllowedBySuperAdmin !== toolObj[ele.Name]);
	if (arr.length > 0) {
		for (const property in toolObj) {
			toolObj[property] = false;
		}
		toolsData.forEach((ele) => {
			if (ele.AllowedBySuperAdmin === true) {
				toolObj[ele.Name] = ele.AllowedBySuperAdmin;
			}
		});
		// console.log("toolObj mid night", toolObj);
		flag = true;
	}
};

const removeInvalidTokens = async () => {
	try {
		let time = new Date(new Date().setHours(0, 0, 0, 0));
		const deletedTime = time.setDate(time.getDate() - 2);
		await db.collection("InvalidTokens").deleteMany();
	} catch (error) {
		console.log("Error in removing invalid tokens", error);
	}
};

// cron for checking the change in tool config and in cron time.
const cronUpdateAtMidNight = (cronRunTime,clientCtx) => {
	UpdateAtMidNightTask = cron.schedule(
		// `*/10 * * * * *`,
		`0 0 * * *`,
		async () => {
			try {
				let expired = await killTheServer();
				if (expired) {
					console.log(
						"The expiry period has reached. The cron has been stopped permanently. Please contact administrator for the same."
					);
					return;
				}
				await checkToolAtMidNight();
				// const data = await Pkg.find({});
				const data = await clientCtx.db.collection("tbl_Package").find({}).toArray();

				//this line for set the "host" or "report" in the cliDelConfig variable, which is selected in the general configuration
				cliDetConfig = await getCliDetaConfig();
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
							toolObj2["The Optimizer"] === true ? HardningiTask.destroy() : null;
						}
						{
							toolObj2["SolarWinds"] === true
								? (SolarwindTask.destroy(), SolarwindCPUMemoryTrendTask.destroy())
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
						{
							toolObj2["ThousandEyes"] === true ? ThausandEyesTask.destroy() : null;
						}
						{
							toolObj2["Cisco SDWAN"] ? sdwanTask.destroy() : null;
						}
						toolObj2 = { ...toolObj };

						cronRunTime = UpdatedCronTime;
						cronTesting(cronRunTime).schedule = true;
						cronTesting(cronRunTime).start();
						{
							toolObj["DNA-C"] === true
								? ((dnacTaskCron(cronRunTime,clientCtx).schedule = true),
								  dnacTaskCron(cronRunTime,clientCtx).start(),
								  (criticalTaskCron(cronRunTime,clientCtx).schedule = true),
								  criticalTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						{
							toolObj["ServiceNow"] === true
								? ((archieveServiceNowTaskCron(cronRunTime,clientCtx).schedule = true),
								  archieveServiceNowTaskCron(cronRunTime,clientCtx).start(),
								  (serviceNowTaskCron(cronRunTime,clientCtx).schedule = true),
								  serviceNowTaskCron(cronRunTime,clientCtx).start(),
								  (dailySlaTaskCron(cronRunTime,clientCtx).schedule = true),
								  dailySlaTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						{
							toolObj["SolarWinds"] === true
								? ((solarwindTaskCron(cronRunTime,clientCtx).schedule = true),
								  solarwindTaskCron(cronRunTime,clientCtx).start(),
								  (solarwindCPUMemoryTrendTaskCron(cronRunTime,clientCtx).schedule = true),
								  solarwindCPUMemoryTrendTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						{
							toolObj["Meraki"] === true
								? ((merakiTaskCron(cronRunTime,clientCtx).schedule = true),
								  merakiTaskCron(cronRunTime,clientCtx).start(),
								  (merakiTrafficTrendTaskCron(cronRunTime,clientCtx).schedule = true),
								  merakiTrafficTrendTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						{
							toolObj["PSIRT"] === true
								? ((psirtTaskCron(cronRunTime,clientCtx).schedule = true),
								  psirtTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						// {
						// 	toolObj["The Optimizer"] === true
						// 		? ((hardningiTaskCron(cronRunTime,clientCtx).schedule = true),
						// 		  hardningiTaskCron(cronRunTime,clientCtx).start())
						// 		: null;
						// }
						// {
						// 	toolObj["Prime"] === true
						// 		? ((primeTaskCron(cronRunTime,clientCtx).schedule = true),
						// 		  primeTaskCron(cronRunTime,clientCtx).start())
						// 		: null;
						// }
						// {
						// 	toolObj["ISE"] === true
						// 		? ((iseTaskCron(cronRunTime,clientCtx).schedule = true),
						// 		  iseTaskCron(cronRunTime,clientCtx).start(),
						// 		  (iseFailureReasonTaskCron(clientCtx).schedule = true),
						// 		  iseFailureReasonTaskCron(clientCtx).start())
						// 		: null;
						// }
						{
							toolObj["ThousandEyes"] === true
								? ((thausandEyesTaskCron(cronRunTime,clientCtx).schedule = true),
								  thausandEyesTaskCron(cronRunTime,clientCtx).start(),
								  (thAgentsAndMonitorsTaskCron(cronRunTime,clientCtx).schedule = true),
								  thAgentsAndMonitorsTaskCron(cronRunTime,clientCtx).start(),
								  (thEndPointAgentTaskCron(cronRunTime,clientCtx).schedule = true),
								  thEndPointAgentTaskCron(cronRunTime,clientCtx).start(),
								  (thUsageTaskCron(cronRunTime,clientCtx).schedule = true),
								  thUsageTaskCron(cronRunTime,clientCtx).start())
								: null;
						}
						// {
						// 	toolObj["Cisco SDWAN"]
						// 	?(ciscoSdwanTaskCron(cronRunTime,clientCtx).schedule = true,
						// 	  ciscoSdwanTaskCron(cronRunTime,clientCtx).start())
						// 	: null;
						// }

						timeInsertTaskCron(cronRunTime,clientCtx).schedule = true;
						timeInsertTaskCron(cronRunTime,clientCtx).start();
						flag = false;
					}
				}
				// await removeInvalidTokens();
			} catch (error) {}
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
	MainTaskWithVariableTime = cron.schedule(
		`*/${a} * * * *`,
		() => {
			console.log(`Running a job after ${a} ${new Date().getTime()} ${moment().format()}`);
		},
		{ scheduled: false }
	);
	return MainTaskWithVariableTime;
};

const destroyAllCron = async () => {
	MainTaskWithVariableTime.destroy();
	TimeInsertTask.destroy();
	{
		toolObj["DNA-C"] === true ? (MainTask.destroy(), CriticalTask.destroy()) : null;
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
			? (DailySlaTask.destroy(), ArchieveServiceNowTask.destroy(), ServiceNowTask.destroy())
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
		toolObj["ISE"] === true ? (IseTask.destroy(), IseFailureReasonTask.destroy()) : null;
	}
	{
		toolObj["ThousandEyes"] === true ? ThausandEyesTask.destroy() : null;
	}
	licenseExpiryNotificationTask.destroy();
	cliRepDetailUpdateTask && cliRepDetailUpdateTask.destroy();
	UpdateAtMidNightTask.destroy();
};
////////////////////////////////////////////////////////////////////////////
// Process to fetch tool config  and the cron update time ends.
////////////////////////////////////////////////////////////////////////////

function GetConfigDetails() {
	return new Promise((resolve) => {
		fs.readFile("observer_node_url.txt", { encoding: "utf-8" }, function (err, data) {
			axios
				.get(JSON.parse(data).ConfigUrl, {
					headers: { __runsync: "true", __timeout: "10" },
				})
				.then(function (response) {
					let Dec_Pass = helpers.decrypt(response.data, helpers.KeyPhrase);
					resolve(JSON.parse(Dec_Pass));
				})
				.catch(function (error) {
					console.log("Error in GetConfigDetails => ",error);
					resolve("");
				});
		});
	});
}

function GetConfigData() {
	return new Promise((resolve) => {
		fs.readFile("observer_node_url.txt", { encoding: "utf-8" }, function (err, data) {
			axios
				.get(JSON.parse(data).ClientUrl, {
					headers: { __runsync: "true", __timeout: "10" },
				})
				.then(function (response) {
					resolve(response.data.data);
				})
				.catch(function (error) {
					console.log("Error in GetConfigDetails => ",error);
					resolve("");
				});
		});
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

const CriticalDevice = mongoose.model("tbl_criticaldevices", CriticalDeviceSchema);
// connect to your database

function getMinCpuScore(data) {
	if (data.length > 0) {
		return data.reduce((min, p) => (p?.cpuScore < min ? p?.cpuScore : min), data[0]?.cpuScore);
	} else return 0;
}
function getMaxCpuScore(data) {
	if (data.length > 0) {
		return data.reduce((max, p) => (p?.cpuScore > max ? p?.cpuScore : max), data[0]?.cpuScore);
	} else return 0;
}
function getMinMemoryScore(data) {
	if (data.length > 0) {
		return data.reduce(
			(min, p) => (p?.memoryScore < min ? p?.memoryScore : min),
			data[0]?.memoryScore
		);
	} else return 0;
}
function getMaxMemoryScore(data) {
	if (data.length > 0) {
		return data.reduce(
			(max, p) => (p?.memoryScore > max ? p?.memoryScore : max),
			data[0]?.memoryScore
		);
	} else return 0;
}
function getMinOverallHealth(data) {
	if (data.length > 0) {
		return data.reduce(
			(min, p) => (p?.overallHealth < min ? p?.overallHealth : min),
			data[0]?.overallHealth
		);
	} else return 0;
}
function getMaxOverallHealth(data) {
	if (data.length > 0) {
		return data.reduce(
			(max, p) => (p?.overallHealth > max ? p?.overallHealth : max),
			data[0]?.overallHealth
		);
	} else return 0;
}
function getAvgCpuScore(data) {
	if (data.length > 0) {
		var sum = data.map((item) => item?.cpuScore).reduce((prev, next) => prev + next);
		if (sum > 0) {
			return sum / data.length;
		} else return 0;
	} else return 0;
}
function getAvgmemoryScore(data) {
	var sum = 0;
	if (data.length > 0) {
		sum = data.map((item) => item?.memoryScore).reduce((prev, next) => prev + next);
	}
	if (sum > 0) {
		return sum / data.length;
	} else return 0;
}
function getAvgOverallHealth(data) {
	var sum = 0;
	if (data.length > 0) {
		sum = data.map((item) => item?.overallHealth).reduce((prev, next) => prev + next);
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
	element["Role"] = item[0]?.nwDeviceRole;
	element["DeviceName"] = item[0]?.nwDeviceName;
	element["MACAddress"] = item[0]?.macAddress;
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

const iseFailureReasonTaskCron = (clientCtx) => {
	IseFailureReasonTask = cron.schedule(
		// `*/5 * * * * *`,
		`0 0 1 * *`,
		// `*/${2} * * * *`,
		async () => {
			// console.log("Inside Failure ISE tool");
			let PackageData = await GetPackageDetailFromDB(null, clientCtx);
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
			await InsertData(IseFailureReasons, "ISEFailureReasons", clientCtx.db);
		},
		{
			scheduled: false,
		}
	);
	return IseFailureReasonTask;
};

const iseTaskCron = (a,clientCtx) => {
	IseTask = cron.schedule(
		`*/${a} * * * *`,
		async () => {
			// console.log("Inside ISE tool");
			let PackageData = await GetPackageDetailFromDB(null, clientCtx);
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

			const vipConfigStatus = await getVipConfigStatus(clientCtx.db);

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

const dnacTaskCron = (a, clientCtx) => {
	MainTask = cron.schedule(
		`*/${a} * * * *`,
		async () => {
			// const data = await Pkg.find({}).lean();
			// const data = await Pkg.aggregate([
			// 	{ $unwind: "$dnac" },
			// 	{
			// 		$match: {
			// 			"dnac.isActive": true,
			// 		},
			// 	},
			// ]);
	
			const data = await clientCtx.db.collection("tbl_Package").aggregate([
				{ $unwind: "$dnac" },
				{
					$match: {
						"dnac.isActive": true,
					},
				},
			]).toArray();
			

			let finalData = [];
			let deviceHealth = [];
			const criticalDeviceMacNotMatch = [];
			data.map((item) => {
				finalData.push(item.dnac);
			});
			let results = finalData;
			activeDnacLenght = results.length;
			await buildGlobalToolsArr(clientCtx);
			let count = 0;
			await connectivityOperations(clientCtx);
			await dnacConnectivity(results,clientCtx);

			for (let i = 0; i < results.length; i++) {
				//  Promise.all([
				// (async () => {
				let PackageData = await GetPackageDetailFromDB(results[i], clientCtx);
				// const Main = (async () => {
				try {
					// let cliDetConfig = await getCliDetaConfig();
					APIToken = await GetToken(results[i]);
					// console.log("APIToken", APIToken);
					RawNetworkHealthDevices = await GetDeviceFromAPI(APIToken, results[i]);
					// await writeJsonToFile({"step":"After filter networkDevices",data : RawNetworkHealthDevices}, 'accessPortUtilizationdata.txt');
					// console.log("After filter networkDevices => ",RawNetworkHealthDevices);
					RawPhysicalTopologyData = await GetPhysicalTopologyData(
						APIToken,
						clientCtx.db,
						results[i]
					);
					// await writeJsonToFile({"step":"After filter TopologyData => ",data : RawPhysicalTopologyData}, 'accessPortUtilizationdata.txt');
					// console.log("After filter TopologyData => ",RawPhysicalTopologyData);
					RawSiteHealthData = await GetRawSiteHealthData(APIToken, clientCtx.db, results[i]);
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
					SiteHealthRadarObj["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					SiteHealthRadarObj["location"] = results[i] && results[i].location;
					SiteHealthRadarObj["recordSet"] = SiteHealthRadar;
					InsertVerification = await InsertData(
						SiteHealthRadarObj,
						"SiteHealthRadar",
						clientCtx.db
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
					RawSiteHealthDataObj["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					RawSiteHealthDataObj["location"] = results[i].location && results[i].location;
					RawSiteHealthDataObj["Data"] = RawSiteHealthData;
					InsertVerification = await InsertData(
						RawSiteHealthDataObj,
						"SiteHealthTopology",
						clientCtx.db
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

					// await writeJsonToFile({"step":"after mac address match data : ",data : DataNew2}, 'accessPortUtilizationdata.txt');

					// console.log("after mac address match data : ",DataNew2);

					const FormattedJoinedData = DataNew2.map(createDeviceTopologyFormating);
					// console.log("after the formating data : ",FormattedJoinedData);
					// await writeJsonToFile({"step":"after the formating data : ",data : FormattedJoinedData}, 'accessPortUtilizationdata.txt');

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

					// console.log("after the site id filter ",DataNew3);
					// await writeJsonToFile({"step":"after the site id filter ",data : DataNew3}, 'accessPortUtilizationdata.txt');

					FormattedDeviceTopologyHealthData = await DataNew3.map(
						createDeviceTopologyHealthFormating
					);

					// console.log("after the formating data",FormattedDeviceTopologyHealthData);
					// await writeJsonToFile({"step":"after the formating data",data : FormattedDeviceTopologyHealthData}, 'accessPortUtilizationdata.txt');

					InterfaceAvailibilityData = await GetInterfaceAvailibility(
						APIToken,
						FormattedDeviceTopologyHealthData,
						results[i]
					);

					InterfaceAvailibilityData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					InterfaceAvailibilityData["location"] = results[i].location && results[i].location;
					InsertVerification = await InsertData(
						InterfaceAvailibilityData,
						"InterfaceAvailibility",
						clientCtx.db
					);
					SWIMData = await GetSWIMData(APIToken, results[i]);

					SWIMData["id"] = results[i].locationId && results[i].locationId;
					SWIMData["location"] = results[i].location && results[i].location;
					InsertVerification = await InsertData(SWIMData, "SWIM", clientCtx.db);

					/* 	ListCriticalDevicesFromAPI=await GetDeviceFromAPI(APIToken);
						ListCriticalDevicesFromDB=await GetDeviceFromDB();
						UpdateDataInCriticalDevices();
					*/
		 
					var InsertVerification = null;
					ClientHealthData = await GetClientBreakUp_Health(APIToken);
					console.log(ClientHealthData,"ClientHealthData ClientHealthData");
					

					ClientHealthData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					ClientHealthData["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(ClientHealthData, "clienthealth", clientCtx.db);

					WiredWirelessData = await GetWiredWireless(APIToken);

					WiredWirelessData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					WiredWirelessData["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(WiredWirelessData, "WiredWireless", clientCtx.db);

					NetworkHealthData = await GetNetworkHealth(APIToken);
					NetworkHealthData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					NetworkHealthData["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(NetworkHealthData, "NetworkHealth", clientCtx.db);

					CWNetworkHealthData = await GetCWNetworkHealth(APIToken);

					CWNetworkHealthData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					CWNetworkHealthData["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(
						CWNetworkHealthData,
						"CWNetworkHealth",
						clientCtx.db
					);

					// await GetCWNetworkHealthDrillData(APIToken.Token);

					InventoryHealthData = await GetInventoryHealth(APIToken);

					InventoryHealthData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					InventoryHealthData["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(
						InventoryHealthData,
						"InventoryHealth",
						clientCtx.db
					);

					InventoryHealthDataDrilldown = await GetInventoryHealthDrillDown(APIToken);

					InventoryHealthDataDrilldown["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					InventoryHealthDataDrilldown["location"] = results[i].location && results[i].location;

					InsertVerification = await InsertData(
						InventoryHealthDataDrilldown,
						"InventoryHealthDrilDown",
						clientCtx.db
					);

					/*
					var siteHealthdata = await GetSiteHealthData(APIToken);
					*/

					var siteHealthdata = await GetSiteHealthData(clientCtx,APIToken);

					siteHealthdata["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					siteHealthdata["location"] = results[i].location;

					InsertVerification = await InsertData(siteHealthdata, "SiteHealth", clientCtx.db);
					/*
					SWIMData=await GetSWIMData(APIToken);
					InsertVerification=await InsertData(SWIMData,'SWIM',db);
					*/

					ListAllDevicesFromDB = await GetAllDevicesFromDB(clientCtx);
					//////////////////////////////////
					CriticalDevicesFromDB = await GetCriticalDevicesFromDB(clientCtx,APIToken);
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

					deviceHealth = await getAllDeviceHealth(results[i], APIToken);

					CriticalDevicesFromDB.forEach((element) => {
						if (element.dlocation.toLowerCase() == results[i].location.toLowerCase()) {
							let isMacExits = false;
							let macMatchIndex = -1;

							deviceHealth &&
								deviceHealth.forEach((item, index) => {
									if (item.macAddress && item.macAddress == element.macAddress) {
										isMacExits = true;
										macMatchIndex = index;
										return;
									}
								});

							if (isMacExits) {
								deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() !==
								"REACHABLE".toLowerCase()
									? (isMacExits = false)
									: (isMacExits = true);
								// in case the reachabilityHealth status is UP and DOWN
								if (
									deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() ==
										"UP".toLowerCase() ||
									deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() ==
										"DOWN".toLowerCase()
								) {
									deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() !==
									"UP".toLowerCase()
										? (isMacExits = false)
										: (isMacExits = true);
								}
							}

							if (isMacExits) {
								if (
									deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() ===
										"REACHABLE".toLowerCase() ||
									deviceHealth[macMatchIndex].reachabilityHealth.toLowerCase() ===
										"UP".toLowerCase()
								) {
									InventoryHealthDataDrilldown.Data &&
										InventoryHealthDataDrilldown.Data.forEach(
											(networkDeviceItem) => {
												if (
													typeof networkDeviceItem.errorCode == "string"
												) {
													if (
														networkDeviceItem.macAddress ===
															deviceHealth[macMatchIndex]
																.macAddress &&
														networkDeviceItem.errorCode !== "null"
													) {
														isMacExits = false;
													}
												} else {
													if (
														networkDeviceItem.macAddress ===
															deviceHealth[macMatchIndex]
																.macAddress &&
														networkDeviceItem.errorCode != null
													) {
														isMacExits = false;
													}
												}
											}
										);
								}
							}

							if (!isMacExits) {
								let obj = {
									ip: element.managementIpAddress,
									macAddress: element.macAddress,
									deviceName: element.hostname,
									dnacName: results[i].DnacURL,
								};
								criticalDeviceMacNotMatch.push(obj);
							}
						}
					});

					for (var bb = 0; bb < CriticalDevicesFromDB.length; bb++) {
						// var tempdata = await GetCriticalDeviceDetailByAPI(
						//   CriticalDevicesFromDB[bb]
						// );
						var tempdata = await GetCriticalDeviceDetailByAPI2(
							CriticalDevicesFromDB[bb],
							deviceHealth
						);
						if (tempdata != undefined) CriticalDeviceDetail.push(tempdata);
					}
					var CriticalDashboardData = await createCriticalDashboardData(
						CriticalDeviceDetail,
						GlobalTimestamp
					);

					CriticalDashboardData["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					CriticalDashboardData["location"] = results[i].location;
					InsertVerification = await InsertData(
						CriticalDashboardData,
						"CriticalDashboard",
						clientCtx.db
					);

					UpdateDataInDeviceList(results[i].location,clientCtx);
					// UpdateDataInCriDeviceList(APIToken, results[i]);
					let ClientHealthDataDrill = {};
					if (cliDetConfig && cliDetConfig === "Host") {
						ClientHealthDataDrill = await GetClientBreakUp_HealthDrillDown(
							APIToken,
							cliDetConfig
						);
					} else if (cliDetConfig && cliDetConfig === "Report") {
						ClientHealthDataDrill = await clientReportExecApis(
							APIToken,
							PackageData,
							a,
							cliDetConfig
						);
					}

					ClientHealthDataDrill["id"] = results[i] && results[i]?.locationId && results[i]?.locationId;
					ClientHealthDataDrill["location"] = results[i].location;
					InsertVerification = await InsertData(
						ClientHealthDataDrill,
						"ClientHealthDataDrill",
						clientCtx.db
					);
					const vipConfigStatus = await getVipConfigStatus(clientCtx.db);
					if (
						vipConfigStatus &&
						vipConfigStatus[0] &&
						vipConfigStatus[0].Value === true
					) {
						if (ClientHealthDataDrill) {
							await updateVipMappingData(ClientHealthDataDrill,clientCtx);
						}
						await getClientDetails(results[i], clientCtx);
						await clientHealthDropEmailer(clientCtx);
					}

					const dnacIssueData = await getDNACIssueData(
						APIToken.Token,
						clientCtx.db,
						PackageData,
						a
					);
					await getIssueDrillDownData(APIToken, dnacIssueData, clientCtx);
					await networkIssueEmailer(clientCtx);

					await buildApplicationHealthData(APIToken.Token,clientCtx);
				} catch (error) {
					console.log("error in multithredding block of multidnac :- ", error);
				}
				count = count + 1;
			}
			if (criticalDeviceMacNotMatch.length > 0) {
				await mailer.criticalDeviceHealthNotGetMailSender(criticalDeviceMacNotMatch, db);
			}
			let conDnac = setInterval(async () => {
				if (count == results.length) {
					clearInterval(conDnac);
					await consoleDataDnac.saveConData(clientCtx.db, dnacVersion);
					await consoleDataDnac1.saveConData1(clientCtx.db);
					console.log("All Dnac Task successfully executed",clientCtx.db.name);
				} else {
					console.log("Waiting for dnac task to complete");
				}
			}, 3000);
		},
		{
			scheduled: false,
		}
	);
	return MainTask;
};

const hardningiTaskCron = (a,clientCtx) => {
	HardningiTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside Hardening tool");
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					var HardeningDataList = null;
					var ClientList = [];
					var DeviceList = [];
					try {
						HardeningDataList = await hardening.GetHardeningData(PackageData, clientCtx.db);
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
							clientCtx.db
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
						InsertVerification = await InsertData(object, "HardeningCompilance", clientCtx.db);
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

const primeTaskCron = (a,clientCtx) => {
	PrimeTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside Prime tool");
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					var APWiseDataList = null;
					var RoguedAPInter = [];
					var DeviceList = [];
					try {
						APWiseDataList = await prime.GetAPwiseAvgPeakThroughput(PackageData);
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
							clientCtx.db
						);
						InsertVerification = await InsertData(
							objectthroughputData,
							"APwiseAvgPeakThroughputDrillDown",
							clientCtx.db
						);

						RoguedAPInter = await prime.RoguedAPInterferenceReport(PackageData, clientCtx.db);
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
							clientCtx.db
						);
						InsertVerification = await InsertData(
							obj,
							"RoguedAPInterferenceReportDrillDown",
							clientCtx.db
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

const getUniqueAdvisoryData = (data) => {
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

const psirtTaskExecutor = (clientCtx) => {
	const PackageConnection = (async () => {
		// console.log("Inside PSIRT Cron");
		var PackageData = await GetPackageDetailFromDB(null, clientCtx);
		const Main = (async () => {
			var APWiseDataList = null;
			var RoguedAPInter = [];
			var DeviceList = [];
			let resultData;
			try {
				let PsirtWiseDataList = await Psirt.GetTokenPSIRT(PackageData, clientCtx.db);
				let PsirtDataList = await Psirt.GetAdvisoryPSIRT(PackageData, PsirtWiseDataList);
				// let PsirtDataList = JSON.parse(require("fs").readFileSync("psirt_json_data.json"));


				//just blow line is commented only for psirt it must be a dnac all data
				// let RawNetworkHealthDevices = await GetDeviceFromAPI(APIToken);
				let commonArray = [];
				let devicelist = [];

				// let IncidentDetailsData = await Psirt.GetIncidentDetailsPSIRT(PackageData);

				// let collectionData = await db
				// 	.collection("PSIRTAdvisoriesDeviceWiseDrillDown")
				// 	.find({})
				// 	.toArray();

				// const deviceData = await db.collection("InventoryHealthDrilDown").find({}).sort({ timestamp: -1 }).limit(1).toArray();
				const deviceData = await clientCtx.db
					.collection("Con_InventoryHealthDrilDown")
					.find({})
					.sort({ timestamp: -1 })
					.limit(1)
					.toArray();

				deviceData[0] &&
					deviceData[0]?.Data?.forEach((item) => {
						// for (let i = 0; i < PsirtDataList && PsirtDataList.length; i++) {
						PsirtDataList.forEach((element) => {
							const advisoryData = element;
							if (
								advisoryData.productNames.join("##").includes(item.series) ||
								advisoryData.productNames.join("##").includes(item.softwareVersion)
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
									hostname: item.hostname && item.hostname,
									platformId: item.platformId,
									reachabilityStatus: item.reachabilityStatus,
									role: item.role,
									// incidentId: IncidentDetailsData.result.number,
									// incident_state: IncidentDetailsData.result.incident_state
								};
								// console.log("================================obj================================",obj);
								commonArray.push(obj);
							}
						});
					});
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
				// }

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
					clientCtx.db
				);
				//....END.....

				//Fetching all device details
				const allDeviceData = [];
				commonArray.map((element) => {
					let deviceData = element.deviceData;
					deviceData.map((ele) => (ele.sir = element.sir));
					allDeviceData.push(...deviceData);
				});

				var commonArrayData = groupBy(allDeviceData /* commonArray */, function (item) {
					return [item.series];
				});

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

				InsertVerification = await InsertData(data, "PSIRTAdvisoriesDeviceWise", clientCtx.db);
			} catch (err) {
				console.error("error in psirt", err);
			}
		})();
	})();
};

const psirtTaskCron = (a,clientCtx) => {
	PsirtTask = cron.schedule(
		"0 6 * * 4",
		// `*/${a} * * * *`,
		// "30 12 * * 3",
		// console.log("Inside psirt tool"),
		psirtTaskExecutor(clientCtx),
		{
			scheduled: false,
		}
	);
	return PsirtTask;
};

//Here start the work for Thausand api
const thAgentsAndMonitorsTaskCron = (crontime,clientCtx) => {
	agentsAndMonitors = cron.schedule(
		"0 10 * * *",
		() => {
			ThausandEyes.findAgentsAndMonitorsDetails(clientCtx.db);
		},
		{
			scheduled: false,
		}
	);
	return agentsAndMonitors;
};

const thEndPointAgentTaskCron = (a,clientCtx) => {
	endPointsagents = cron.schedule(
		"0 10 * * *",
		() => {
			ThausandEyes.findEndPointAgents(clientCtx.db);
		},
		{
			scheduled: false,
		}
	);
	return endPointsagents;
};

//This is for usage
const thUsageTaskCron = (a,clientCtx) => {
	usages = cron.schedule(
		`*/${a} * * * *`,
		() => {
			ThausandEyes.findUsages(clientCtx.db);
		},
		{
			scheduled: false,
		}
	);
	return usages;
};

//for Thausandeyes
const thausandEyesTaskCron = (a,clientCtx) => {
	ThausandEyesTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			const thausandData = (async () => {
				try {
					// const base_url = "api.thousandeyes.com";
					const pagckageDetail =await clientCtx.db.collection("tbl_Package").findOne({});
					await thausandEyesConnectivity(pagckageDetail, clientCtx.db);
					const api_url = `https://${pagckageDetail.thUrl}/v6/alerts.json`;					
					let token = pagckageDetail.thAuthrization;
					let config = {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					};
					let data = await axios.get(`${api_url}`, config);
					let mainData = data.data;
					// console.log("my Data is ", data.data);
					// await ThausandEyes.findAgentsAndMonitorsDetails(db);
					// await ThausandEyes.findEndPointAgents(db);

					function subtractMinutes(date, minutes) {
						date.setMinutes(date.getMinutes() - parseInt(minutes));

						return date;
					}

					// 2:20 pm on May 18, 2022
					let time = new Date(
						new Date(
							new Date(
								new Date(Date.now()).setMinutes(
									parseInt(new Date(Date.now()).getMinutes() / 5) * 5
								)
							).setSeconds(0)
						).setMilliseconds(0)
					);
					const currentTime = new Date(time.toISOString());

					let secondTime = new Date(
						new Date(
							new Date(
								new Date(Date.now()).setMinutes(
									parseInt(new Date(Date.now()).getMinutes() / 5) * 5
								)
							).setSeconds(0)
						).setMilliseconds(0)
					);

					const newDate = subtractMinutes(currentTime, a);

					let startTime = newDate.toISOString().replace("T", " ");
					let endTime = secondTime.toISOString().replace("T", " ");
					startTime = startTime.substring(0, startTime.length - 5);
					endTime = endTime.substring(0, endTime.length - 5);

					let activeData = mainData.alert.filter(
						(item) => item.dateStart <= endTime && item.dateStart >= startTime
					);

					mainData.alert = activeData;
					mainData["timestamp"] = new Date(
						new Date(
							new Date(
								new Date(Date.now()).setMinutes(
									parseInt(new Date(Date.now()).getMinutes() / 5) * 5
								)
							).setSeconds(0)
						).setMilliseconds(0)
					);
					InsertVerification = await InsertData(mainData, "Th_ActiveAlerts", clientCtx.db);
				} catch (err) {
					console.log("getting error in Thausand active alerts", err);
				}
			})();
		},
		{
			scheduled: false,
		}
	);
	return ThausandEyesTask;
};

const merakiTaskCron = (a,clientCtx) => {
	MerakiTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside Meraki tool");
			const PackageConnection = (async () => {
				let PackageData = await GetPackageDetailFromDB(null,clientCtx);
				const Main = (async () => {
					var NetworkList = null;
					var ClientList = [];
					var DeviceList = [];
					var trafficDetails = [];
                    var merakiChannelUtilization = [];
					try {
						NetworkList = await meraki.GetNetwork(PackageData, clientCtx.db);
						NetworkList = NetworkList.filter((a) => a.type != "systems manager");

						merakiNetworkList = NetworkList;
						// DeviceList=await meraki.GetNetworkDevices(NetworkList);
						for (var count = 0; count < NetworkList.length; count++) {
							var tempdata = await meraki.GetNetworkDevices(
								NetworkList[count],
								PackageData,
								clientCtx
							);
							DeviceList = DeviceList.concat(tempdata);
						}
						for (var count = 0; count < DeviceList.length; count++) {
							var tempdata = await meraki.GetPrefferedScore(
								DeviceList[count],
								PackageData,
								clientCtx
							);
							DeviceList[count]["Prefscore"] = tempdata.perfScore;
						}
						DeviceList = DeviceList.map(meraki.LimitDeviceListColumns);

						for (var count = 0; count < NetworkList.length; count++) {
							// if (NetworkList[count].name == "Noida") {
								// this is the temporary condition to get data for specific organization
						        await new Promise(res => setTimeout(res, 2000));
								var tempdata = await meraki.GetNetworkClients(
									NetworkList[count],
									PackageData
								);
								ClientList = ClientList.concat(tempdata);
							// }
							var trafficeTempdata = await meraki.GetTraffic(
                                NetworkList[count],
                                PackageData
                            );
                            trafficDetails = trafficDetails.concat(trafficeTempdata);
                            let merakiDeviceChannelUtilization = await meraki.GetmerakiDeviceChannelUtilization(NetworkList[count], PackageData);
 
                            merakiChannelUtilization = merakiChannelUtilization.concat(merakiDeviceChannelUtilization)
 
						}
						const combinedResult = ClientList.reduce((acc, item) => {
                            if (!acc[item.status]) {
                                acc[item.status] = {
                                    count: 0,
                                    data: []
                                };
                            }
                            acc[item.status].count += 1;
                            acc[item.status].data.push(item);
                            return acc;
                        }, {});
                        var merakiClientDetails = {};
                        merakiClientDetails["Data"] = combinedResult || {};
                        merakiClientDetails["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
                        // await DeleteData("merakiClients", db);
                        InsertVerification = await InsertData(merakiClientDetails, "merakiClients", clientCtx.db); // insert MerakiClient
 
                        //traffic data
                        trafficDetails = trafficDetails
                            .map(item => ({
                                ...item,
                                activeTimeHours: (item.activeTime / 3600).toFixed(2) // convert to hours
                            }))
                            .sort((a, b) => b.numClients - a.numClients); // descending order
 
                        const combinedTrafficResult = trafficDetails.reduce((acc, item) => {
                            if (!acc[item.networkid]) {
                                acc[item.networkid] = {
                                    networkId: item.networkid,
                                    networkname: item.networkname,
                                    count: 0,
                                    data: []
                                };
                            }
 
                            acc[item.networkid].count += 1;
                            acc[item.networkid].data.push(item);
 
                            return acc;
                        }, {});
                        var merakitrafficDetails = {};
                        merakitrafficDetails["Data"] = combinedTrafficResult || {};
                        merakitrafficDetails["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
                        InsertVerification = await InsertData(merakitrafficDetails, "merakiTrafficDetails", clientCtx.db);
                       
 
                        // const updatedChannelUtilizationData = merakiChannelUtilization.map(device => {
                        //     const wifiKeys = Object.keys(device).filter(
                        //         key => key.startsWith('wifi') && Array.isArray(device[key])
                        //     );
                        //     const wifiStatus = {};
                        //     wifiKeys.forEach(key => {
                        //         const radios = device[key] || [];
 
                        //         const maxUtilization = radios.reduce((max, r) => {
                        //             const value = r.utilizationTotal ?? r.utilization ?? 0;
                        //             return value > max ? value : max;
                        //         }, 0);
 
                        //         wifiStatus[key] = {
                        //             maxUtilization,
                        //             highUtilization: maxUtilization > 60
                        //         };
                        //     });
 
                        //     const highUtilization = Object.values(wifiStatus)
                        //         .some(radio => radio.highUtilization);
 
                        //     // ✅ RETURN is required
                        //     return {
                        //         ...device,
                        //         wifiStatus,
                        //         highUtilization
                        //     };
                        // });
                        async function getUtilizationSummary(data, highThreshold = 60) {
                            const summary = {
                                totalHighUtilizationCount: 0,
                                totalLowUtilizationCount: 0,
                                highUtilizationData: [],
                                lowUtilizationData: []
                            };
 
                            data.forEach(device => {
                                // dynamically get all wifi* arrays
                                Object.keys(device)
                                    .filter(k => k.startsWith("wifi") && Array.isArray(device[k]))
                                    .forEach(radio => {
                                        device[radio].forEach(entry => {
                                            const record = {
                                                serial: device.serial,
                                                model: device.model,
                                                radio,
                                                utilization: entry.utilization,
                                                start_ts: entry.start_ts,
                                                end_ts: entry.end_ts,
                                                networkid: device.networkid,
                                                networkname: device.networkname
                                            };
 
                                            if (entry.utilization > highThreshold) {
                                                summary.totalHighUtilizationCount++;
                                                summary.highUtilizationData.push(record);
                                            } else {
                                                summary.totalLowUtilizationCount++;
                                                summary.lowUtilizationData.push(record);
                                            }
                                        });
                                    });
                            });
 
                            return summary;
                        }
 
                        const updatedChannelUtilizationData = await getUtilizationSummary(merakiChannelUtilization, 60);
 
						var merakiChannelDetails = {};
                        merakiChannelDetails["Data"] = updatedChannelUtilizationData || [];
                        merakiChannelDetails["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
 
                        InsertVerification = await InsertData(merakiChannelDetails, "merakiDeviceChannelUtilization", clientCtx.db);

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

						ClientListWithModelAndPrefScore = ClientListWithModelAndPrefScore.map(
							function (item) {
								item.ClientList["model"] = item._DeviceList[0].model;
								item.ClientList["PrefScore"] = item._DeviceList[0].Prefscore;
								return item;
							}
						);
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

						DeviceList = DevicesWithNoOfClients.map(meraki.FormatDeviceWithClients);

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
							clientCtx.db
						);

						let TopTenUsers = await meraki.GetTopTenUsers(ClientList);
						InsertVerification = await InsertData(TopTenUsers, "TopTenUsers", clientCtx.db);

						let OSWiseClients = await meraki.GetOSWiseClients(ClientList);
						InsertVerification = await InsertData(OSWiseClients, "OSWiseClients", clientCtx.db);

						let SSIDWiseClients = await meraki.GetSSIDWiseClients(ClientList);
						InsertVerification = await InsertData(
							SSIDWiseClients,
							"SSIDWiseClients",
							clientCtx.db
						);

						let OEMWiseClients = await meraki.GetOEMWiseClients(ClientList);
						InsertVerification = await InsertData(OEMWiseClients, "OEMWiseClients", clientCtx.db);
						let merakiDeviceAvailability = await meraki.GetMerakiDeviceAvailability(
                            PackageData.OrganizationId, PackageData);
                        const combinedResults = merakiDeviceAvailability.reduce((acc, item) => {
                            if (!acc[item.productType]) {
                                acc[item.productType] = {
                                    count: 0,
                                    data: []
                                };
                            }
                            acc[item.productType].count += 1;
                            acc[item.productType].data.push(item);
                            return acc;
                        }, {});
 
                        var merakiDeviceDetails = {};
                        merakiDeviceDetails["Data"] = combinedResults || {};
                        merakiDeviceDetails["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
 
                        InsertVerification = await InsertData(merakiDeviceDetails, "merakiDeviceDetails", clientCtx.db);
 
                        let merakiDeviceAlert = await meraki.GetmerakiDeviceAlert(
                            PackageData.OrganizationId, PackageData);
                        var merakiDeviceAlerts = {};
                        merakiDeviceAlerts["Data"] = merakiDeviceAlert?.items || [];
                        merakiDeviceAlerts["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
 
                        InsertVerification = await InsertData(merakiDeviceAlerts, "merakiDeviceAlerts", clientCtx.db);
                        let merakiDeviceUplinkStatus =await meraki.GetMerakiDeviceUplinkStatuses(
                            PackageData.OrganizationId, PackageData);
 
                        async function summarizeUplinks(devices) {
                            return devices.reduce((summary, device) => {
                                device.uplinks.forEach(uplink => {
                                    const status = uplink.status;
                                    if (!summary[status]) {
                                        summary[status] = { count: 0, data: [] };
                                    }
                                    summary[status].count += 1;
 
                                    // Include uplink data along with device info
                                    summary[status].data.push({
                                        networkId: device.networkId,
                                        serial: device.serial,
                                        model: device.model,
                                        ...uplink
                                    });
                                });
                                return summary;
                            }, {});
                        }
 
                        const merakiDeviceUplinkStatusData = await summarizeUplinks(merakiDeviceUplinkStatus);
                       
                        var merakiDeviceUplinkStatuss = {};
                        merakiDeviceUplinkStatuss["Data"] = merakiDeviceUplinkStatusData || [];
                        merakiDeviceUplinkStatuss["timestamp"] = new Date(
                            new Date(
                                new Date(
                                    new Date(Date.now()).setMinutes(
                                        parseInt(new Date(Date.now()).getMinutes() / 5) * 5
                                    )
                                ).setSeconds(0)
                            ).setMilliseconds(0)
                        );
 
                        InsertVerification = await InsertData(merakiDeviceUplinkStatuss, "merakiDeviceUplinkStatus", clientCtx.db);
						let LicenseDetails = await meraki.GetLicenseDetails(
							PackageData.OrganizationId,
							NetworkList.length,
							PackageData
						);
						InsertVerification = await InsertData(LicenseDetails, "LicenseDetails", clientCtx.db);
						// var DeviceWiseDetailedReportData=DataNew2.map(meraki.FormatDeviceWiseDetailedReportData);
					} catch (err) {
						console.log("getting error in meraki", err);
					}
				})();
			})();
		},
		{
			scheduled: false,
		}
	);
	return MerakiTask;
};

const serviceNowTaskCron = (a,clientCtx) => {
	ServiceNowTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			const PackageConnection = (async () => {
				const Main = (async () => {
					try {
						let PackageData = await GetPackageDetailFromDB(null, clientCtx);
						let IncidentDetails = await servicesnow.GetIncidentDetails(PackageData, clientCtx.db);

						let CriticalTickets = IncidentDetails.filter((a) =>!(a.state === "6") && !(a.state === "7") && a.priority === "1" && a.impact === "1" && a.urgency === "1");

						let OnHoldTickets = IncidentDetails.filter((a) => a.state === "3");
						let CRDetails = await servicesnow.GetCRDetails(PackageData);
						let CRTickets = CRDetails.filter((a) => a.type === "emergency");

						let TaskSlaDetails = await servicesnow.GetTaskSLADetails(PackageData);
						// let TaskSlaTickets = TaskSlaDetails.filter((a) => a.type === "emergency");

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
						objTicketSummary["Breached"] = BreachedTickets.filter((item)=> item.IncidentDetails.state == "6" || item.IncidentDetails.state == "7").length;

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
							clientCtx.db
						);

						InsertVerification = await InsertData(
							objTicketSummary,
							"TicketSummary",
							clientCtx.db
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
							clientCtx.db
						);

						let OnHoldTicketDrillDown = OnHoldTickets.map(function (item) {
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
							clientCtx.db
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
							data["TestPlan"] = item.test_plan;
							data["Type"] = item.type;
							data["Impact"] = item.impact;
							data["BackoutPlan"] = item.backout_plan;
							data["ChangePlan"] = item.change_plan;
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
							clientCtx.db
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
						objBreachedTicketsDrillDown["Data"] = BreachedTicketsDrillDown.filter((item) => item.Status === "Closed" || item.Status === "Resolved");
						InsertVerification = await InsertData(
							objBreachedTicketsDrillDown,
							"BreachedTicketsDrillDown",
							clientCtx.db
						);

						let NonClosedResolvedTicket = IncidentDetails.filter(
							(a) => a.state != "Closed" && a.state != "Resolved"
						);

						//Removed Code from here
						let TicketBreakUpCatData = await servicesnow.GetCategorywiseTicketBreakUp(
							NonClosedResolvedTicket
						);
						InsertVerification = await InsertData(
							TicketBreakUpCatData,
							"TicketBreakUpCategoryWise",
							clientCtx.db
						);

						let TicketBreakUpPriorityData =
							await servicesnow.GetPrioritywiseTicketBreakUp(NonClosedResolvedTicket);
						InsertVerification = await InsertData(
							TicketBreakUpPriorityData,
							"TicketBreakupPriorityStateWise",
							clientCtx.db
						);
						let AllNonClosedResolvedData = NonClosedResolvedTicket.map(function (item) {
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
						});
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
							clientCtx.db
						);
						// let CategorywiseTicketBreakUp=await servicesnow.GetCategorywiseTicketBreakUp(IncidentDetails);
						let QuarterlySLAData = await servicesnow.GetQuarterlySLA(TaskSlaDetails);
						InsertVerification = await InsertData(
							QuarterlySLAData,
							"QuaterlySLAAchievement",
							clientCtx.db
						);
						// let DailySLAData = await servicesnow.GetDailySLA(TaskSlaDetails);
						//InsertVerification = await InsertData(DailySLAData, "DailySLAData", db);

						let VerifyMonthlySLA = await servicesnow.CalculateAndInsertMonthlySLA(
							clientCtx.db,
							TaskSlaDetails
						);
					} catch (err) {
						console.log("Error in ServiceNow Scheduler : ", err);
					}
				})();
			})();
		},
		{
			scheduled: false,
		}
	);
	return ServiceNowTask;
};

const solarwindTaskCron = (a, clientCtx) => {
	SolarwindTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside SolarWind tool");
			const PackageConnection = (async () => {
				let PackageData = await GetPackageDetailFromDB(null, clientCtx);
				let ServiceListCPU = await GetServiceListCPU(clientCtx);
				let ServiceListMemory = await GetServiceListMemory(clientCtx);
				const Main = (async () => {
					var NetworkList = null;
					var ClientList = [];
					var DeviceList = [];
					try {
						let con = await SolarWind.connectSQL(PackageData, clientCtx.db);
						if (con === 1) {
							let CPUutilizationData = await SolarWind.getCPUutilizationData(
								ServiceListCPU,
								ServiceListMemory,
								clientCtx
							);
							let getWanlinkData = await SolarWind.getWanlink(clientCtx);
							let getWanlinkDrillDownData = await SolarWind.getWanlinkDrillDown(
								getWanlinkData,
								clientCtx
							);
							let getInventry = await SolarWind.getInventry(CPUutilizationData,
								clientCtx);
							let getInventryDrill = await SolarWind.getInventryDrill(
								CPUutilizationData,
								clientCtx
							);
							let getCpuDrill = await SolarWind.getCpuDrill(
								CPUutilizationData,
								ServiceListCPU,
								ServiceListMemory,
								clientCtx
							);
							let getnetworkHealth = await SolarWind.getnetworkHealth(
								CPUutilizationData,
								ServiceListCPU,
								ServiceListMemory,
								clientCtx
							);
							let getnetworkHealthDrillData =
								await SolarWind.getnetworkHealthDrillData(
									CPUutilizationData,
									ServiceListCPU,
									ServiceListMemory,
									clientCtx.db
								);
						}
					} catch (err) {
						console.log("Error in SolerWindTaskCron", err);
					}
				})();
			})();
		},
		{
			scheduled: false,
		}
	);
	return SolarwindTask;
};

const solarwindCPUMemoryTrendTaskCron = (a,clientCtx) => {
	SolarwindCPUMemoryTrendTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside SloarwindCpu Memory trend tool");
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					try {
						let IncidentDetails = await SolarWind.createCPUMemoryTrend(PackageData, clientCtx.db);
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
	return SolarwindCPUMemoryTrendTask;
};

const archieveServiceNowTaskCron = (a,clientCtx) => {
	ArchieveServiceNowTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside archieveServiceNowTaskCron");
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					try {
						let IncidentDetails = await servicesnow.ArchieveServiceNow(clientCtx.db, PackageData);
					} catch (err) {}
				})();
			})();
		},
		{
			scheduled: false,
		}
	);
	return ArchieveServiceNowTask;
};

const dailySlaTaskCron = (a,clientCtx) => {
	DailySlaTask = cron.schedule(
		"05 22 * * *",
		() => {
			// console.log("Inside daily Sla Task tool");
			// console.log("archieveServiceNowTaskCron", archieveServiceNowTaskCron);
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					try {
						//let IncidentDetails = await servicesnow.ArchieveServiceNow(db, PackageData);

						let TaskSlaDetails = await servicesnow.GetTaskSLADetails(PackageData);
						// let TaskSlaTickets = TaskSlaDetails.filter(a => a.type === "emergency");

						let DailySLAData = await servicesnow.GetDailySLA(TaskSlaDetails);
						InsertVerification = await InsertData(DailySLAData, "DailySLAData", clientCtx.db);
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

const merakiTrafficTrendTaskCron = (a,clientCtx) => {
	MerakiTrafficTrendTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			//MerakiTrafficTrendTask.stop();
			// console.log("Inside Meraki Traffic trend tool");
			const PackageConnection = (async () => {
				var PackageData = await GetPackageDetailFromDB(null, clientCtx);
				const Main = (async () => {
					let NetworkList = null;
					let ClientList = [];
					let TrafficHistory = [];
					let AppCategory = [];
					try {
						let CheckData = await meraki.CheckUsageData(PackageData, clientCtx.db);
						if (CheckData == 0) {
							NetworkList = await meraki.GetNetwork(PackageData);
							NetworkList = NetworkList.filter((a) => a.type != "systems manager");
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
								let Total = item.reduce((a, { totalUsage }) => a + totalUsage, 0);
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
								clientCtx.db
							);
							InsertVerification = await InsertData(
								DataDrillDown,
								"DataUsageByAppCategoryDrillDown",
								clientCtx.db
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

const timeInsertTaskCron = (a, clientCtx) => {
	TimeInsertTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside Time");
			const PackageConnection = (async () => {
				//var PackageData = await GetPackageDetailFromDB();
				const Main = (async () => {
					try {
						let collectionData = await clientCtx.db
							.collection("TopTwoTimestamp")
							.find({})
							.toArray();
						let data = await clientCtx.db.collection("tbl_Package").find({}).toArray();
						let dataForCronTimeInterval = data[0].cronUpdateTime;

						if (collectionData.length == 0) {
							// {
							// 	toolObj["PSIRT"] ? psirtTaskExecutor(clientCtx) : null;
							// }
							await createSiteTopologyData(clientCtx);
							await clientCtx.db.collection("TopTwoTimestamp").insertOne(
								{
									TimeStamp: new Date(
										new Date(
											new Date(
												new Date(Date.now()).setMinutes(
													parseInt(
														new Date(Date.now()).getMinutes() / 5
													) * 5
												)
											).setSeconds(0)
										).setMilliseconds(0)
									),
									IsFirstTimeStamp: true,
									timeInterval: dataForCronTimeInterval,
								}
							);
						} else if (collectionData.length == 1) {
							await clientCtx.db.collection("TopTwoTimestamp").insertOne(
								{
									TimeStamp: new Date(
										new Date(
											new Date(
												new Date(Date.now()).setMinutes(
													parseInt(
														new Date(Date.now()).getMinutes() / 5
													) * 5
												)
											).setSeconds(0)
										).setMilliseconds(0)
									),
									IsFirstTimeStamp: false,
									timeInterval: dataForCronTimeInterval,
								}
							);
						} else {
							await clientCtx.db.collection("TopTwoTimestamp").deleteOne(
								{ IsFirstTimeStamp: false }
							);
							await clientCtx.db.collection("TopTwoTimestamp").insertOne(
								{
									TimeStamp: new Date(
										new Date(
											new Date(
												new Date(Date.now()).setMinutes(
													parseInt(
														new Date(Date.now()).getMinutes() /
															5
													) * 5
												)
											).setSeconds(0)
										).setMilliseconds(0)
									),
									IsFirstTimeStamp: false,
									// timeInterval:dataForCronTimeInterval

									//here a is for change for we want not change the interval time istant
									timeInterval: a,
								}
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
	return TimeInsertTask;
};

const criticalTaskCron = (a,clientCtx) => {
	CriticalTask = cron.schedule(
		`*/${a} * * * *`,
		() => {
			// console.log("Inside Critical task tool");
			const Main2 = (async () => {
				var DataToSend = {};
				var allDevices = [];
				var CriticalDashboardDataDB = await GetCriticalDashboardDataDB(clientCtx,APIToken);
				CriticalDashboardDataDB.forEach((element) => {
					let elem = element._doc && element._doc.DevicesList || element.DevicesList;
					allDevices = [...allDevices,...elem];
				});

				var groupedByMac = Object.values(
					allDevices.reduce((grouping, item) => {
						grouping[item?.macAddress] = [...(grouping[item?.macAddress] || []), item];
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
					clientCtx.db
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
			json.failureReasonList.failureReason.forEach((value) => {
				delete Object.assign(value, { ["failureReasonId"]: value["id"] })["id"];
				ar.iseFailureData.push(value);
			});
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

function GetDeviceFromAPI(APIToken, dnacData) {
	return new Promise(async(resolve) => {
		try {
			let AllData = [];
			let offset = 1;
			let limit = 500;

			while(true){
				let response = await axios.get(dnacData && dnacData.DnacNetworkDeviceAPI + `?offset=${offset}&limit=${limit}`, {
						headers: { "x-auth-token": APIToken.Token },
				})
				// console.log("response.data.response in GetDeviceFromAPI => ",response.data.response.length);
				if(response && response.data.response.length > 0) {
					let data = response && response.data.response
					.filter((a) => a.family)
					.filter(
						(a) =>
							a.family.toLowerCase().indexOf("meraki") === -1 &&
							a.family != null
					);

					AllData = [...AllData,...data];

					offset = offset + limit;
				}else{
					break;
				}
			}

			// writeJsonToFile({"step":"All data from network device api ",data : AllData}, 'accessPortUtilizationdata.txt');
			// console.log("All data from network device api :",AllData);

			resolve(AllData);
		} catch (err) {
			console.log("getting error in GetDeviceFromAPI ", err);
			resolve([]);
		}
	});
}
function GetDeviceFromDB(APIToken) {
	return new Promise(async(resolve) => {
		var Test = mongoose.model("Test", new Schema(), "tbl_criticaldevices");
		let doc = await Test.find({})
    resolve(doc);
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
	let ClientBreakUp = {};
	return new Promise(async(resolve, reject) => {
		try{
			let AllData = [];
			let offset = 1;
			let limit = 500;

			while(true){
				const response = await axios.get(PackageData.DnacHostAPI + `?offset=${offset}&limit=${limit}`, {
					headers: {
						"x-auth-token": APIToken.Token,
					},
				})

				if(response && response.data.response.length > 0) {

					response.data.response.forEach((el) => {
						el.hostMac = el.hostMac.toLowerCase();
					});

					AllData = [...AllData,...response.data.response]
					
					offset = offset + limit;
				}else{
					break;
				}
			}

			RawDataClientHealth = AllData;
			ClientBreakUp["recordset"] = AllData;
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
		}catch(error){
			console.log("errro in GetClientBreakUp_HealthDrillDown",error);
			RawDataClientHealth = [];
			resolve({});
		}
	});
}
function GetClientBreakUp_Health(APIToken) {
	var ClientBreakUp = {};
	return new Promise(async(resolve, reject) => {
		let time = await Math.round(new Date().getTime() / 1000) * 1000;
		console.log("time in GetClientBreakUp : ", time);
		await addDelay(20000)
		await axios.get(PackageData.DnacClientHealthAPI + time, {
				headers: {
					"x-auth-token": APIToken.Token,
					__runsync: "true",
					__timeout: "10",
				},
			})
			.then(function (response) {
				RawDataClientHealth = response.data.response;

				let clientBreakData = {
					All : {
						count: 0,
						score: 0,
						},
					Wired :  {
						count: 0,
						score: 0,
					},
					Wireless :  {
						count: 0,
						score: 0,
					}
				}

				ClientBreakUp["timestamp"] = new Date(
					new Date(
						new Date(
							new Date(Date.now()).setMinutes(
								parseInt(new Date(Date.now()).getMinutes() / 5) * 5
							)
						).setSeconds(0)
					).setMilliseconds(0)
				);
				
				if (response.data.response[0]) {
					// ClientBreakUp["Data"] = {
					// 	All: {
					// 		count: response.data.response[0].scoreDetail[0].clientCount,
					// 		score: response.data.response[0].scoreDetail[0].scoreValue,
					// 	},
					// 	Wired: {
					// 		count: response.data.response[0].scoreDetail[1].clientCount,
					// 		score: response.data.response[0].scoreDetail[1].scoreValue,
					// 	},
					// 	Wireless: {
					// 		count: response.data.response[0].scoreDetail[2].clientCount,
					// 		score: response.data.response[0].scoreDetail[2].scoreValue,
					// 	},
					// };

					// this is specific to titan

					clientBreakData.All.score = response.data.response[0].scoreDetail[0].scoreValue;
					clientBreakData.Wired.score = response.data.response[0].scoreDetail[1].scoreValue;
					clientBreakData.Wireless.score = response.data.response[0].scoreDetail[2].scoreValue;

					if (RawDataClientHealth && RawDataClientHealth?.length > 0 && RawDataClientHealth[0] && RawDataClientHealth[0]?.scoreDetail) {
						let wiredCount = 0;
						for (let count = 0; count < RawDataClientHealth[0]?.scoreDetail[1]?.scoreList.length; count++) {
							wiredCount = wiredCount + RawDataClientHealth[0]?.scoreDetail[1]?.scoreList[count]?.clientCount;
						}

						let wirelessCount = 0;
						for (let count = 0; count < RawDataClientHealth[0]?.scoreDetail[2]?.scoreList?.length; count++) {
							wirelessCount = wirelessCount + RawDataClientHealth[0]?.scoreDetail[2]?.scoreList[count]?.clientCount;;
						}

						clientBreakData.All.count = wiredCount + wirelessCount;
						clientBreakData.Wired.count = wiredCount;
						clientBreakData.Wireless.count = wirelessCount;
					}
				}

				ClientBreakUp["Data"] = clientBreakData;
				// console.log("ClientBreakUp => ",ClientBreakUp);
				resolve(ClientBreakUp);
			})
			.catch(function (error) {
				// handle error
				console.log("error in GetClientBreakUp_Health", error);
				resolve({});
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
	return new Promise((resolve, reject) => {
		try{
			if (RawDataClientHealth && RawDataClientHealth?.length > 0 && RawDataClientHealth[0] && RawDataClientHealth[0]?.scoreDetail) {
				for (
					var count = 0;
					count < RawDataClientHealth[0]?.scoreDetail[1]?.scoreList.length;
					count++
				) {
					Wired[RawDataClientHealth[0]?.scoreDetail[1]?.scoreList[count]?.scoreCategory.value] =
						RawDataClientHealth[0]?.scoreDetail[1]?.scoreList[count]?.clientCount;
				}
	
				// WiredWirelessBreakUp={Wired};
				for (
					var count = 0;
					count < RawDataClientHealth[0]?.scoreDetail[2]?.scoreList?.length;
					count++
				) {
					Wireless[
						RawDataClientHealth[0]?.scoreDetail[2]?.scoreList[count]?.scoreCategory.value
					] = RawDataClientHealth[0]?.scoreDetail[2]?.scoreList[count]?.clientCount;
				}
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
		}catch(error){
			console.error("error in GetWiredWireless", error);
			resolve({});
		}
	})
	// .catch((error) => {
	// 	console.error("error in GetWiredWireless", error);
	// 	resolve({});
	// });
}

function GetNetworkHealth(APIToken) {
	try {
		var NetworkHealth = {};
		return new Promise(async(resolve, reject) => {
			let time = await Math.round(new Date().getTime() / 1000) * 1000;
			console.log("time : ",time);
			await axios.get(PackageData.DnacNetworkHealthAPI + time,
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
					if (dnacVersion === "4") {
						NetworkHealth["Data"] = {
							HealthScore: response.data.response[0].healthScore,
							TotalDevices: response.data.response[0].totalCount,
							GoodCount: response.data.response[0].goodCount,
							FairCount: response.data.response[0].fairCount,
							BadCount: response.data.response[0].badCount,
							NoHealthCount: response.data.response[0].noHealthCount,
						};
					} else {
						NetworkHealth["Data"] = {
							HealthScore: response.data.response[0].healthScore,
							TotalDevices: response.data.response[0].totalCount,
							GoodCount: response.data.response[0].goodCount,
							FairCount: response.data.response[0].fairCount,
							BadCount: response.data.response[0].badCount,
							UnmonCount: response.data.response[0].unmonCount,
						};
					}
					resolve(NetworkHealth);
				})
				.catch(function (error) {
					console.log("error in GetNetworkHealth : ",error);

					let NetworkHealth = {}
					NetworkHealth["timestamp"] = new Date(
					new Date(
						new Date(
						new Date(Date.now()).setMinutes(
							parseInt(new Date(Date.now()).getMinutes() / 5) * 5
						)
						).setSeconds(0)
					).setMilliseconds(0)
					);

					NetworkHealth["Data"] ={
						HealthScore: 0,
						TotalDevices: 0,
						GoodCount: 0,
						FairCount: 0,
						BadCount: 0,
						UnmonCount: 0,
					};
					RawNetworkHealthData = []
					resolve(NetworkHealth);
				})
				.finally(function () {});
		});
	} catch (err) {
		console.log("getting error in GetNetWorkHealth", err);
	}
}

function GetCWNetworkHealth(APIToken) {
	var CWNetworkHealth = {};
	// var arrCategory = [];

	return new Promise((resolve) => {
		const Data =
			RawNetworkHealthData?.data != undefined &&
			RawNetworkHealthData?.data?.healthDistirubution != undefined &&
			RawNetworkHealthData?.data?.healthDistirubution.map(createCWNHDList);

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
	return new Promise(async(resolve, reject) => {
		try{
			let allReachable = [];
			let allUnreachable = [];
			let offset = 1;
			let limit = 500;

			while(true){
				let response = await axios.get(PackageData.DnacNetworkDeviceAPI + `?offset=${offset}&limit=${limit}`, {
					headers: { "x-auth-token": APIToken.Token },
				})
				// console.log("response.data.response in GetInventoryHealth => ",response.data.response.length);

				if(response && response.data.response.length > 0) {
					
					//GetInventoryHealthDrillDown(response.data.response)
					let Reachable = response.data.response.filter(
						(a) => a.reachabilityStatus === "Reachable"
					);
					allReachable = [...allReachable,...Reachable];

					let Unreachable = response.data.response.filter(
						// (a) => a.reachabilityStatus === "Unreachable"
						(a) => a.reachabilityStatus !== "Reachable"
					);
					allUnreachable = [...allUnreachable,...Unreachable];

					offset = offset + limit;
				}else{
					break;
				}
			}

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
				Reachable: allReachable.length,
				Unreachable: allUnreachable.length,
			};

			resolve(InventoryHealth);

		}catch(error){
			console.log("error in GetInventoryHealth", error);
			resolve({});
		}
	});
}
function GetInventoryHealthDrillDown(APIToken) {
	var InventoryHealth = {};
	return new Promise(async(resolve, reject) => {
		try{		
			let AllData = [];
			let offset = 1;
			let limit = 500;

			while(true){
				let response = await axios.get(PackageData.DnacNetworkDeviceAPI + `?offset=${offset}&limit=${limit}`, {
					headers: { "x-auth-token": APIToken.Token },
				})

				// console.log("response.data.response in GetInventoryHealthDrillDown => ",response.data.response.length);
				if(response && response.data.response.length > 0) {
					AllData = [...AllData,...response.data.response];

					offset = offset + limit;
				}else{
					break;
				}
			}

			// var Reachable = response.data.response.filter(
			// 	(a) => a.reachabilityStatus === "Reachable"
			// );
			// var Unreachable = response.data.response.filter(
			// 	(a) => a.reachabilityStatus === "Unreachable"
			// );

			InventoryHealth["timestamp"] = new Date(
				new Date(
					new Date(
						new Date(Date.now()).setMinutes(
							parseInt(new Date(Date.now()).getMinutes() / 5) * 5
						)
					).setSeconds(0)
				).setMilliseconds(0)
			);

			InventoryHealth["Data"] = AllData;
			resolve(InventoryHealth);
		}catch(error){
			console.log("error in GetInventoryHealthDrillDown", error.message, error.config);
			resolve({});
		}
	});
}

function encryptAES(text, key) {
	const cipher = createCipheriv("aes-256-ecb", Buffer.from(key), null);
	let encrypted = cipher.update(text, "utf8", "base64");
	encrypted += cipher.final("base64");
	return encrypted;
}

function GetToken(dnacData) {
	try {
		if (dnacData && dnacData !== undefined) {
			const data = dnacData.DnacTokenAPI.split("/");
			const ip = data[2];

			// const ip = dnacData.DnacURL;
			if (dnacData.aesAuthEnabled) {
				const username = dnacData.DnacUserName;
				const password = dnacData.DnacPassWord;
				const auth = `${username}:${password}`;

				const cipherBase64 = encryptAES(auth, dnacData.apiEncriptionKey);
				var options = {
					hostname: ip /* '10.122.1.25' */,
					path: "/dna/system/api/v1/auth/token",
					method: "POST",
					headers: {
						Authorization: `CSCO-AES-256 credentials=${cipherBase64}`,
					},
				};
			} else {
				var options = {
					hostname: ip /* '10.122.1.25' */,
					path: "/dna/system/api/v1/auth/token",
					method: "POST",
					headers: {
						Authorization:
							"Basic " +
							Buffer.from(
								dnacData.DnacUserName + ":" + dnacData.DnacPassWord
							).toString("base64"),
					},
				};
			}
		} else {
			const data = PackageData[0] && PackageData[0].dnac[0].DnacTokenAPI.split("/");
			const ip = data[2];

			if (PackageData[0].dnac[0].aesAuthEnabled) {
				const username = PackageData[0].dnac[0].DnacUserName;
				const password = PackageData[0].dnac[0].DnacPassWord;
				const auth = `${username}:${password}`;

				const cipherBase64 = encryptAES(auth, PackageData[0].dnac[0].apiEncriptionKey);
				console.log("Encrypted Base64 key:", cipherBase64);
				var options = {
					hostname: ip /* '10.122.1.25' */,
					path: "/dna/system/api/v1/auth/token",
					method: "POST",
					headers: {
						Authorization: `CSCO-AES-256 credentials=${cipherBase64}`,
					},
				};
			} else {
				var options = {
					hostname: ip /* '10.122.1.25' */,
					path: "/dna/system/api/v1/auth/token",
					method: "POST",
					headers: {
						Authorization:
							"Basic " +
							Buffer.from(
								// PackageData[0].DnacUserName + ":" + PackageData[0].DnacPassWord
								PackageData[0].dnac[0].DnacUserName +
									":" +
									PackageData[0].dnac[0].DnacPassWord
							).toString("base64"),
					},
				};
			}
		}

		return new Promise((resolve) => {
			var req = https.request(options, function (res) {
				var data = [];
				res.on("data", function (chunk) {
					data.push(chunk);
				}).on("end", function () {
					var buffer = Buffer.concat(data);
					var str = iconv.decode(buffer, "windows-1252");
					resolve(JSON.parse(str));
				});
			});
			req.end();
			req.on("error", function (e) {
				console.error("error while token gen", e);
			});
		});
	} catch (err) {
		console.log("error occured in getoken", err);
	}
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
		reachabilityFailureReason: item.RawNetworkHealthDevice.reachabilityFailureReason,
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
		siteName: item.SiteHealthData.length != 0 ? item.SiteHealthData[0].siteName : "",
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

function GetInterfaceAvailibility(APIToken, FormattedData, dnacData) {
	var InterfaceAvailibility = {};
	let data;
	if (dnacData) {
		data = dnacData.DnacTokenAPI.split("/");
	} else {
		data = PackageData.DnacTokenAPI.split("/");
	}
	const hostname = data[0] + "//" + data[2];
	return new Promise((resolve, reject) => {
		axios
			.get(hostname /* '10.122.1.25' */ + "/api/v1/interface", {
				headers: { "x-auth-token": APIToken.Token },
			})
			.then(function (response) {
				// console.log("All data from interface api : ",response.data.response);
				// writeJsonToFile({"step":"All data from interface api : ",data : response.data.response}, 'accessPortUtilizationdata.txt');

				let data =
					response.data &&
					response.data.response.filter((ele) => ele.interfaceType == "Physical");
				var interfaceData = data;
				//upper two line add for the filter the by only interfaceType is "Physical"
				// var interfaceData = response.data.response;
				// console.log("after the interfaceType is physical filter : ",data);
				// writeJsonToFile({"step":"after the interfaceType is physical filter : ",data : data}, 'accessPortUtilizationdata.txt');
				var DataNew3 = interfaceData.reduce(
					(result, IF) =>
						result.concat([
							{
								_interface: IF,
								_FormattedData: FormattedData.filter((a) => a.id === IF.deviceId),
							},
						]),
					[]
				);

				// console.log("after the device id filter : ",DataNew3);
				// writeJsonToFile({"step":"after the device id filter : ",data : DataNew3}, 'accessPortUtilizationdata.txt');


				// DataNew3 = DataNew3.filter((ele) => ele.interfaceType === "Physical")
				// console.log("getting DataNew3",DataNew3)
				var FormattedInterfaceData = DataNew3.map(createInterfaceFormating);
				// console.log("getting formatedData", FormattedInterfaceData)
				// console.log("after the formating data : ",FormattedInterfaceData);
				// writeJsonToFile({"step":"after the formating data : ",data : FormattedInterfaceData}, 'accessPortUtilizationdata.txt');

				FormattedInterfaceData = FormattedInterfaceData.filter((i) => {
					if (i) {
						return i;
					}
				});
				FormattedInterfaceData = FormattedInterfaceData.filter((a) => a.role === "ACCESS");
				// console.log("After the filter role access : ",FormattedInterfaceData);
				// writeJsonToFile({"step":"After the filter role access : ",data : FormattedInterfaceData}, 'accessPortUtilizationdata.txt');

				var uniqueSites = FormattedInterfaceData.filter(
					(e, i) =>
						FormattedInterfaceData.findIndex((a) => a["siteName"] === e["siteName"]) ===
						i
				);

				// console.log("after the match site name : ",uniqueSites);
				// writeJsonToFile({"step":"after the match site name : ",data : uniqueSites}, 'accessPortUtilizationdata.txt');


				var arrSiteWiseDetails = uniqueSites.map(
					createSiteWiseDetails(FormattedInterfaceData)
				);
				// console.log("the final data : ",arrSiteWiseDetails);
				// writeJsonToFile({"step":"the final data : ",data : arrSiteWiseDetails}, 'accessPortUtilizationdata.txt');

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
				console.log("error in GetInterfaceAvailibility", error);
				resolve({});
			})
			.finally(function () {});
	});
}

function createInterfaceFormating(item) {
	if (item && item._FormattedData.length) {
		var element = {
			siteName: item._FormattedData[0].siteName,
			siteid: item._FormattedData[0].siteid,
			role: item._FormattedData[0].role,
			hostname: item._FormattedData[0].hostname,
			hostmac: item._FormattedData[0].macAddress,
			macAddress: item._interface.macAddress,
			status: item._interface.status,
			adminStatus: item._interface.adminStatus,
		};
		return element;
	}
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
		var data = _FormattedInterfaceData.filter((a) => a.siteid === uniqueSite.siteid);
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
			//this filter according adminStatus isted of status, it was discussed with the vishal sir and amit sir at coe lab

			// site["utilized"] = ele.filter((a) => a.status === "up");
			// site["free"] = ele.filter((a) => a.status === "down");
			site["utilized"] = ele.filter((a) => a.adminStatus === "UP");
			site["free"] = ele.filter((a) => a.adminStatus === "DOWN");

			arrSite.push(site);
			site = {};
			siteTotal = siteTotal + ele.length;
			// siteUtilized = siteUtilized + ele.filter((a) => a.status === "up").length;
			// siteFree = siteFree + ele.filter((a) => a.status === "down").length;

			siteUtilized = siteUtilized + ele.filter((a) => a.adminStatus === "UP").length;
			siteFree = siteFree + ele.filter((a) => a.adminStatus === "DOWN").length;
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
}

function GetPhysicalTopologyData(APIToken, db, dnacData) {
	try {
		let locationDetail = {
			location: dnacData.location,
			locationId: dnacData.locationId,
		};
		const data = dnacData && dnacData.DnacTokenAPI.split("/");
		const hostname = data[0] + "//" + data[2];
		var PhysicalTopology = {};
		return new Promise((resolve) => {
			axios
				.get(hostname /* '10.122.1.25' */ + "/api/v1/topology/physical-topology", {
					headers: {
						"x-auth-token": APIToken.Token,
						__runsync: "true",
						__timeout: "10",
					},
				})
				.then(function (response) {
					// writeJsonToFile({"step":"All data from physical-topology : ",data : response.data.response}, 'accessPortUtilizationdata.txt');
					// console.log("All data from physical-topology : ",response.data.response);
					getSiteTopologyData(response.data.response, db, locationDetail);
					var RawPhysicalTopologyData = response.data.response.nodes.filter(
						(a) => a.additionalInfo != undefined
					);
					var FormattedPhysicalTopologyData = RawPhysicalTopologyData.map(
						createFormattedPhysicalTopologyData
					);
					resolve(FormattedPhysicalTopologyData);
				})
				.catch(function (error) {
					console.log("error in GetPhysicalTopologyData", error.message);
					resolve([]);
				})
				.finally(function () {});
		});
	} catch (err) {
		console.log("getting error ", err);
	}
}

function GetSWIMData(APIToken, dnacData) {
	var GetSWIMData = {};
	if (dnacData !== undefined) {
		PackageData = dnacData;
	}
	return new Promise((resolve, reject) => {
		axios
			.get(PackageData.DnacSwimInfoAPI, {
				headers: {
					"x-auth-token": APIToken.Token,
					__runsync: "true",
					__timeout: "10",
				},
			})
			.then(function (response) {
				RawSWIMData = response.data.response;

				var DevicesWithComplianceCheck =
					FormattedDeviceTopologyHealthData.map(createComplianceNonCom);
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
				console.log("Error in GetSWIMData", error);
				resolve({});
			})
			.finally(function () {});
	});
}
function createComplianceNonCom(item) {
	var element = {
		macAddress: item.macAddress,
		ipAddress: item.managementIpAddress,
		hostname: item.hostname,
		family: item.family,
		softwareVersion: item.softwareVersion,
		isTaggedGolden: "",
		status: "",
	};
	var CompliantDevices = RawSWIMData.filter(function (obj) {
		if(obj && obj.applicableDevicesForImage && obj.applicableDevicesForImage.length > 0 && obj.applicableDevicesForImage[0].productName)
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

async function GetRawSiteHealthData(APIToken, db, dnacData) {
	try {
		// const data = await Pkg.find({});
		const data = await db.collection("tbl_Package").find({}).toArray();
		const version = data && data[0]._doc && data[0]._doc.DNacVersion;
		// const dnacVersion = dnacData.DNacVersion;
		dnacVersion = version;
		switch (version) {
			// 1 means case '2.2.2.3':
			case "1":
				return getRawSiteHealthData_3(APIToken, dnacData);
			case "2":
				return getRawSiteHealthData_5(APIToken, dnacData);
			case "3":
				return getRawSiteHealthData_5(APIToken, dnacData);
			case "4":
				return getRawSiteHealthData_5(APIToken, dnacData);
			default:
				return getRawSiteHealthData_3(APIToken, dnacData);
		}
	} catch (err) {
		console.log(`getting error in GetRawSiteHealthData`, err);
	}
}

const getRawSiteHealthData_3 = (APIToken, dnacData) => {
	return new Promise((resolve) => {
		axios
			.get(dnacData.DnacSiteHealthAPI + Math.round(new Date().getTime() / 1000) * 1000, {
				headers: {
					"x-auth-token": APIToken.Token,
					__runsync: "true",
					__timeout: "10",
				},
			})
			.then(function (response) {
				resolve(response.data.response);
			})
			.catch(function (error) {})
			.finally(function () {});
	});
};

const getRawSiteHealthData_5 = async (APIToken, dnacData) => {
	try {
		const baseUrl = `${dnacData.DnacSiteHealthAPI}${
			Math.round(new Date().getTime() / 1000) * 1000
		}`;
		const areaData = await fetchAreaData(baseUrl, APIToken);
		const bulidingData = await fetchBuildingData(baseUrl, APIToken);
		const allData = [...areaData, ...bulidingData];
		return allData;
	} catch (error) {
		console.log("error in DnacSiteHealthAPI", error);
	}
};

function SiteHealthRadarData(filterData) {
	try {
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
	} catch (error) {
		console.log("SiteHealthRadarData getting error", error);
	}
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
			healthScore: item.networkHealthDistribution > 0 ? item.networkHealthDistribution : 0,
			count: item.distributionTotalCount > 0 ? item.distributionTotalCount : 0,
			deviceRole: "Distributed",
		},
		Wireless: {
			type: "Devices",
			healthScore: item.networkHealthWireless > 0 ? item.networkHealthWireless : 0,
			count: item.wirelessDeviceTotalCount > 0 ? item.wirelessDeviceTotalCount : 0,
			deviceRole: "Wireless",
		},
		healthyNetworkDevices: {
			healthyNetworkDevicesPrecentages:
				item.healthyNetworkDevicePercentage > 0 ? item.healthyNetworkDevicePercentage : 0,
			healthyNetworkDevices: item.numberOfNetworkDevice > 0 ? item.numberOfNetworkDevice : 0,
		},
		WiredClient: {
			type: "Clients",
			totalCount: item.numberOfWiredClients > 0 ? item.numberOfWiredClients : 0,
			goodCount: item.wiredGoodClients > 0 ? item.wiredGoodClients : 0,
			deviceRole: "Wired Client",
		},
		WirelessClient: {
			type: "Clients",
			totalCount: item.numberOfWirelessClients > 0 ? item.numberOfWirelessClients : 0,
			goodCount: item.wirelessGoodClients > 0 ? item.wirelessGoodClients : 0,
			deviceRole: "Wireless Client",
		},
	};
	var data = {};
	data[category] = element;
	return data;
}

async function GetSiteHealthData(clientCtx,APIToken) {
	var siteHealthFilterData = {};
	// const data = await Pkg.find({});
	const data = await clientCtx.db.collection("tbl_Package").find({}).toArray();
	// const version = data && data[0]._doc && data[0]._doc.DNacVersion;
	const version = data && data[0].DNacVersion;
	const dnacVersion = version;
	// console.log("dnac version: " + dnacVersion);
	switch (dnacVersion) {
		case "1":
			return getSiteHealthData_3(siteHealthFilterData, APIToken);
		case "2":
			return getSiteHealthData_5(siteHealthFilterData, APIToken);
		case "3":
			return getSiteHealthData_5(siteHealthFilterData, APIToken);
		case "4":
			return getSiteHealthData_5(siteHealthFilterData, APIToken);
		default:
			return getSiteHealthData_3(siteHealthFilterData, APIToken);
	}
}

const getSiteHealthData_3 = (siteHealthFilterData, APIToken) => {
	return new Promise((resolve) => {
		axios
			.get(PackageData.DnacSiteHealthAPI + Math.round(new Date().getTime() / 1000) * 1000, {
				headers: {
					"x-auth-token": APIToken.Token,
					__runsync: "true",
					__timeout: "10",
				},
			})
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
			.catch(function (error) {
				console.log("error in getSiteHealthData_3", error.message);
				resolve(siteHealthFilterData);
			})
			.finally(function () {});
	});
};

const getSiteHealthData_5 = async (siteHealthFilterData, APIToken) => {
	try {
		const baseUrl = `${PackageData.DnacSiteHealthAPI}${
			Math.round(new Date().getTime() / 1000) * 1000
		}`;
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
	} catch (error) {
		console.log("error in getSiteHealthData_5", error.message);
	}
};

const fetchAreaData = async (baseUrl, APIToken) => {
	let allData = [];
	let offset = 1;
	const limit = 50;
	try {
		const apiUrl = `${baseUrl}&offset=${offset}&limit=${limit}&siteType=AREA`;
		const areaData = await axios.get(apiUrl, { headers: { "x-auth-token": APIToken.Token } });
		if (
			areaData &&
			areaData.data &&
			areaData.data.response &&
			areaData.data.response.length > 0
		) {
			allData = [...areaData.data.response];
			offset = offset + limit;
		}
	} catch (err) {
		console.log("error in fetchAreaData", err.message, err.config);
	}
	return allData;
};

const fetchBuildingData = async (baseUrl, APIToken) => {
	let allData = [];
	let offset = 1;
	const limit = 50;
	try {
		const apiUrl = `${baseUrl}&offset=${offset}&limit=${limit}&siteType=BUILDING`;
		const bulidingData = await axios.get(apiUrl, {
			headers: { "x-auth-token": APIToken.Token },
		});

		if (bulidingData && bulidingData.data && bulidingData.data.response.errorCode === 500) {
			return [];
		}

		if (
			bulidingData &&
			bulidingData.data &&
			bulidingData.data.response &&
			bulidingData.data.response.length > 0
		) {
			allData = [...bulidingData.data.response];
			offset = offset + limit;
		} else {
			return [];
		}
	} catch (err) {
		console.log("error in fetchBuildingData", err.message, err.config);
	}
	return allData;
};
function GetCriticalDevicesFromDB(clientCtx,dnacDetail) {
	return new Promise(async(resolve) => {
		var DeviceListFromCriticalDevicetbl = [];
		// let data = await Criticl.find({ Action: "1" })
		let data = await clientCtx.db.collection('tbl_CriticalDevices').find({ Action: "1",dlocation:dnacDetail.location }).toArray();
		DeviceListFromCriticalDevicetbl = data;
		/*
		for(var aa=0;aa<DeviceListFromCriticalDevicetbl.length;aa++)
		{
			var daaata= GetCriticalDeviceDetailByAPI(DeviceListFromCriticalDevicetbl[aa]);
			
		}
		*/
		// var DeviceDetails=DeviceListFromCriticalDevicetbl.map(await GetCriticalDeviceDetailByAPI);
		resolve(data);
	});
}
function GetAllDevicesFromDB(clientCtx,APIToken) {
	return new Promise(async(resolve) => {
		// let result = await Criticl.find({});
		let result =  await clientCtx.db.collection('tbl_CriticalDevices').find({}).toArray();
		resolve(result);
	});
}
function GetCriticalDeviceDetailByAPI(item) {
	var DeviceDetail = {};
	var data = null;
	return new Promise((resolve) => {
		var APIURL = PackageData.DnacNetworkDetails;
		APIURL = APIURL.replace("{0}", Math.round(new Date().getTime() / 1000) * 1000).replace(
			"{1}",
			item.macAddress
		);
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
				console.log("GetCriticalDeviceDetailByAPI error is", error);
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
	return new Promise(async (resolve) => {
		var Block = {};
		var Charts = {};
		var FinalData = {};

		var AccessData = rawData.filter((a) => a.nwDeviceRole == "ACCESS");
		var COREData = rawData.filter((a) => a.nwDeviceRole == "CORE");
		var DISTRIBUTIONData = rawData.filter((a) => a.nwDeviceRole == "DISTRIBUTION");
		// var DISTRIBUTIONData = rawData.filter(
		//   (a) => a.deviceFamily == "WIRELESS_CONTROLLER"
		// );

		var WLCData = rawData.filter((a) => a.nwDeviceRole == "WLC");
		// var WLCData = rawData.filter((a) => a.deviceFamily == "SWITCHES_AND_HUBS");

		var ROUTERData = rawData.filter(
			(a) => a.nwDeviceRole == "ROUTER" || a.nwDeviceRole == "BORDER ROUTER"
		);

		var APData = rawData.filter((a) => a.nwDeviceRole == "AP");
		// var APData = rawData.filter((a) => a.deviceFamily == "UNIFIED_AP");

		var OverallHealth = rawData.filter((a) => a.overallHealth > 0);
		// var MemoryScore = rawData.filter((a) => a.memoryScore > 0);
		var MemoryScore = rawData.filter((a) => a.memoryUtilizationHealth > 0);

		// var CPUScore = rawData.filter((a) => a.cpuScore > 0);
		var CPUScore = rawData.filter((a) => a.cpuHealth > 0);

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
			var fair = AccessData.filter((a) => a.overallHealth >= 3 && a.overallHealth < 7).length;
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
			var fair = ROUTERData.filter((a) => a.overallHealth >= 3 && a.overallHealth < 7).length;
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
			var fair = COREData.filter((a) => a.overallHealth >= 3 && a.overallHealth < 7).length;
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
			var fair = WLCData.filter((a) => a.overallHealth >= 3 && a.overallHealth < 7).length;
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
			var fair = APData.filter((a) => a.overallHealth >= 3 && a.overallHealth < 7).length;
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
			var good = MemoryScore.filter((a) => a.memoryUtilizationHealth >= 7).length;
			var fair = MemoryScore.filter(
				(a) => a.memoryUtilizationHealth >= 3 && a.memoryUtilizationHealth < 7
			).length;
			var poor = MemoryScore.filter((a) => a.memoryUtilizationHealth < 3).length;
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
			var good = CPUScore.filter((a) => a.cpuHealth >= 7).length;
			var fair = CPUScore.filter((a) => a.cpuHealth >= 3 && a.cpuHealth < 7).length;
			var poor = CPUScore.filter((a) => a.cpuHealth < 3).length;
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
		//this line for removing the empty object from rawdata array
		// const results = await rawData.filter((element) => {
		//   if (Object.keys(element).length !== 0) {
		//     return true;
		//   }
		//   return false;
		// });
		FinalData["DevicesList"] = rawData.map(FormatCriticalDevices);
		resolve(FinalData);
	}).catch((error) => {
		console.log("error in createCriticalDashboardData :- ", error.message);
	});
}
function FormatCriticalDevices(item) {
	// const category=item.category;
	var element = {
		communicationState: item.reachabilityHealth,
		cpuScore: item.cpuHealth,
		macAddress: item.macAddress,
		memoryScore: item.memoryUtilizationHealth,
		nwDeviceName: item.name,
		nwDeviceRole: item.deviceFamily,
		overallHealth: item.overallHealth,
	};
	return element;
}
function GetCriticalDashboardDataDB(clientCtx,APIToken) {
	return new Promise(async(resolve) => {
		let DeviceListFromCriticalDevicetbl = [];

		let TonightTime = new Date(
			new Date(
				new Date(
					new Date(new Date(Date.now()).setMinutes(0)).setSeconds(0)
				).setMilliseconds(0)
			).setHours(0)
		);
		let yesterday = new Date(TonightTime.getTime() - 24 * 60 * 60 * 1000);
		const data = await clientCtx.db
			.collection("CriticalDashboard")
			.find({
				timestamp: { $lt: TonightTime, $gte: yesterday }
			})
			.toArray();

		// let data = await criticalTrend
		// 	.find({
		// 		timestamp: { $lt: TonightTime, $gte: yesterday },
		// 	})

		// 	DeviceListFromCriticalDevicetbl = data;
			/* for(var aa=0;aa<DeviceListFromCriticalDevicetbl.length;aa++)
			{
				var daaata= GetCriticalDeviceDetailByAPI(DeviceListFromCriticalDevicetbl[aa]);
			}
			*/
			// var DeviceDetails=DeviceListFromCriticalDevicetbl.map(await GetCriticalDeviceDetailByAPI);

		resolve(data);
	});
}
async function GetPackageDetailFromDB(dnacData,clientctx) {
	try {
		if (dnacData) {
			return new Promise((resolve) => {
			
				PackageData = dnacData;
				PackageData.DnacPassWord = PackageData.DnacPassWord
					? helpers.decrypt(PackageData.DnacPassWord, helpers.KeyPhrase)
					: "";

				PackageData.HardeningPassword = PackageData.HardeningPassword
					? helpers.decrypt(PackageData.HardeningPassword, helpers.KeyPhrase)
					: "";

				PackageData.SolarWindDbPassword = PackageData.SolarWindDbPassword
					? helpers.decrypt(PackageData.SolarWindDbPassword, helpers.KeyPhrase)
					: "";

				PackageData.PrimeFTPPassWord = PackageData.PrimeFTPPassWord
					? helpers.decrypt(PackageData.PrimeFTPPassWord, helpers.KeyPhrase)
					: "";
				PackageData.ServiceNowPassword = PackageData.ServiceNowPassword
					? helpers.decrypt(PackageData.ServiceNowPassword, helpers.KeyPhrase)
					: "";

				PackageData.ISEPassword = PackageData.ISEPassword
					? helpers.decrypt(PackageData.ISEPassword, helpers.KeyPhrase)
					: "";
				// resolve(doc);
				resolve(dnacData);
				// });
			});
		} else {
			return new Promise(async(resolve) => {
		
				// let data = await Pkg.find({});
			// let PackageData = await dbo.collection('tbl_Package').findOne({}); 
			let PackageData = await clientctx.db.collection("tbl_Package").findOne({});

          PackageData.DnacPassWord = PackageData.DnacPassWord
            ? helpers.decrypt(PackageData.DnacPassWord, helpers.KeyPhrase)
            : "";

          PackageData.HardeningPassword = PackageData.HardeningPassword
            ? helpers.decrypt(PackageData.HardeningPassword, helpers.KeyPhrase)
            : "";

          PackageData.SolarWindDbPassword = PackageData.SolarWindDbPassword
            ? helpers.decrypt(PackageData.SolarWindDbPassword, helpers.KeyPhrase)
            : "";

          PackageData.PrimeFTPPassWord = PackageData.PrimeFTPPassWord
            ? helpers.decrypt(PackageData.PrimeFTPPassWord, helpers.KeyPhrase)
            : "";
          PackageData.ServiceNowPassword = PackageData.ServiceNowPassword
            ? helpers.decrypt(PackageData.ServiceNowPassword, helpers.KeyPhrase)
            : "";

          PackageData.ISEPassword = PackageData.ISEPassword
            ? helpers.decrypt(PackageData.ISEPassword, helpers.KeyPhrase)
            : "";
          resolve(PackageData);
			});
		}
	} catch (error) {
		console.log("getting error in GetPackageDetailFromDb fun", error);
	}
}
function GetServiceListCPU(clientCtx) {
	return new Promise(async(resolve) => {

		let result = await clientCtx.db.collection("TblServiceList").find({
			$and: [{ KeyType: "CpuUtilization" }, { CurrentlyInUse: 1 }],
		}).toArray();

		// let doc = await ServiceListData.find({
		// 	$and: [{ KeyType: "CpuUtilization" }, { CurrentlyInUse: 1 }],
		// })
		resolve(result);
	});
}
function GetServiceListMemory(clientCtx) {
	return new Promise(async(resolve) => {

		let result = await clientCtx.db.collection("TblServiceList").find({
			$and: [{ KeyType: "MemoryUtilization" }, { CurrentlyInUse: 1 }],
		}).toArray();
		// let doc = await ServiceListData.find({
		// 	$and: [{ KeyType: "MemoryUtilization" }, { CurrentlyInUse: 1 }],
		// })
  resolve(result);
	});
}
//Manish Work Starts
async function UpdateDataInDeviceList(dnaclocation,clientCtx) {
	return new Promise(async (resolve) => {
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

		if (DeviceListInDBNotInAPI.length == 0 && DeviceListInAPINotInDB.length > 0) {
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
				element["dlocation"] = dnaclocation;
				// element["timestamp"] =new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0));
				InsertVerification = InsertData(element, "tbl_CriticalDevices", clientCtx.db);
			});
		} else if (DeviceListInDBNotInAPI.length == 0 && DeviceListInAPINotInDB.length == 0) {
			// SameDeviceList.map(EachDataUpdate);
				for (const item of SameDeviceList) {
					await EachDataUpdate(item, clientCtx);
				}
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
					element["dlocation"] = dnaclocation;
					InsertVerification = InsertData(element, "tbl_CriticalDevices", clientCtx.db);
				});
			}
			// if (SameDeviceList.length > 0) {
			// 	SameDeviceList.map(EachDataUpdate);
			// }
			if (SameDeviceList.length > 0) {
				for (const item of SameDeviceList) {
					await EachDataUpdate(item, clientCtx);
				}
			}

		}
		// CriticalDevice.deleteMany({ Mac_Address: arrNonCriticalDevicesMac }, function (err) {
		//     if(err) console.log(err);
		//   });
	});
}
async function EachDataUpdate(item,clientCtx) {
	// console.log("item in EachDataUpdate ", item);
	// var dataToUpdate = await item.macAddress;
	await clientCtx.db.collection("tbl_CriticalDevices").updateOne(
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
	if(json._id){
		delete json._id;
	}
	let i = 0;
	return new Promise(async(resolve) => {
		let result = await db.collection(CollectionName).insertOne(json);
		resolve(result);
		i++;
	});
}
function DeleteData(CollectionName, db) {
    return new Promise(async (resolve) => {
        let result = await db.collection(CollectionName).deleteMany({});
        resolve(result);
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
		return "router";
	} else if (family == "Third Party Device") {
		return "switch";
	} else if (family == "cloud node") {
		return "cloud";
	} else {
		return "switch";
	}
};

const getSiteTopologyData = async (data, db, locationDetail) => {
	data.nodes.filter((ele, i) => {
		if (ele.deviceType.includes("cloud")) {
			ele.deviceId = 0;
		} else {
			ele.deviceId = i + 1;
		}
	});
	data.links.filter((ele) => {
		data.nodes.forEach((val) => {
			if (ele.source == val.id) {
				ele.sourceId = val.deviceId;
			}
			if (ele.target == val.id) {
				ele.targetId = val.deviceId;
			}
		});
	});

	const siteObj = {};
	data.nodes.forEach((elm) => {
		if (elm.additionalInfo) {
			if (elm.additionalInfo.siteid) {
				if (!siteObj[elm.additionalInfo.siteid]) {
					siteObj[elm.additionalInfo.siteid] = {
						nodes: [
							{
								Type: elm.deviceType,
								IP: elm.ip,
								Role: elm.role,
								Family: elm.family,
								name: elm.label,
								iconType: giveIconType(elm.family),
								id: elm.id,
							},
						],
					};
				} else {
					siteObj[elm.additionalInfo.siteid].nodes.push({
						Type: elm.deviceType,
						IP: elm.ip,
						Role: elm.role,
						Family: elm.family,
						name: elm.label,
						iconType: giveIconType(elm.family),
						id: elm.id,
					});
				}
				data.links.forEach((val) => {
					if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
						if (siteObj[elm.additionalInfo.siteid].links) {
							siteObj[elm.additionalInfo.siteid].links.push({
								source: val.source,
								target: val.target,
								id: val.id,
								linkStatus: val.linkStatus,
							});
						} else {
							siteObj[elm.additionalInfo.siteid] = {
								...siteObj[elm.additionalInfo.siteid],
								links: [
									{
										source: val.source,
										target: val.target,
										id: val.id,
										linkStatus: val.linkStatus,
									},
								],
							};
						}
					}
				});
			} else {
				siteObj[""] = {
					nodes: [
						{
							Type: elm.deviceType,
							IP: elm.ip,
							Role: elm.role,
							Family: elm.family,
							name: elm.label,
							iconType: giveIconType(elm.family),
							id: elm.id,
						},
					],
				};
				data.links.forEach((val) => {
					if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
						if (siteObj[""].links) {
							siteObj[""].links.push({
								source: val.source,
								target: val.target,
								id: val.id,
								linkStatus: val.linkStatus,
							});
						} else {
							siteObj[""] = {
								...siteObj[""],
								links: [
									{
										source: val.source,
										target: val.target,
										id: val.id,
										linkStatus: val.linkStatus,
									},
								],
							};
						}
					}
					//
					// if (elm.deviceId == val.targetId) {
					//   console.log("target",val.targetId,elm.deviceId)
					// }
				});
			}
		}
		if (elm.deviceType.includes("cloud")) {
			for (let [key, value] of Object.entries(siteObj)) {
				if (key !== "") {
					value.nodes.push({
						Type: elm.deviceType,
						IP: elm.ip,
						Role: elm.role,
						Family: elm.family,
						name: elm.label,
						iconType: giveIconType(elm.family),
						id: elm.id,
					});
					data.links.forEach((val) => {
						if (elm.deviceId == val.sourceId || elm.deviceId == val.targetId) {
							if (value.links) {
								value.links.push({
									source: val.source,
									target: val.target,
									id: val.id,
									linkStatus: val.linkStatus,
								});
							} else {
								value = {
									...value,
									links: [
										{
											source: val.source,
											target: val.target,
											id: val.id,
											linkStatus: val.linkStatus,
										},
									],
								};
							}
						}
						//
						// if (elm.deviceId == val.targetId) {
						//   console.log("target",val.targetId,elm.deviceId)
						// }
					});
				}
			}
		}
	});

	for (let [key, value] of Object.entries(siteObj)) {
		if (value.links) {
			uniqueLinksObj = {};
			value.links.forEach((link) => {
				const uniqueId = `${link.source}#${link.target}#${link.id}`;
				if (!uniqueLinksObj[uniqueId]) {
					uniqueLinksObj[uniqueId] = link;
				}
			});
			uniqueLinks = Object.values(uniqueLinksObj);
			value.links = [...uniqueLinks];
		}
	}
	const finalData = Object.keys(siteObj).map((key) => {
		siteObj[key].siteid = key;
		return siteObj[key];
	});
	let objd = {
		siteData: [...finalData],
		location: locationDetail.location,
		id: locationDetail.locationId,
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
	await InsertData(objd, "SiteMapTopology", db);
};

const updateVipMappingData = async (ClientHealthDataDrill,clientCtx) => {
	let result = {};
	const vipData = await clientCtx.db.collection("Vip_Mapping").find().toArray();
	const timeStamp = new Date(
		new Date(
			new Date(
				new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)
			).setSeconds(0)
		).setMilliseconds(0)
	);

	if (vipData && vipData.length === 0) {
		const vipMappingData = getVipMappingData(ClientHealthDataDrill, timeStamp);
		result = await clientCtx.db.collection("Vip_Mapping").insertMany(vipMappingData);
	} else {
		const existingVipData = vipData.map((device) => device.hostMac);

		for (let device of ClientHealthDataDrill?.recordset) {
			if (!existingVipData.includes(device.hostMac)) {
				const vipMappingData = createVipObj(
					device,
					timeStamp,
					ClientHealthDataDrill.location
				);
				result = await clientCtx.db.collection("Vip_Mapping").insertOne(vipMappingData);
			}
		}
	}
	return result;
};

const getVipMappingData = (data, timeStamp) => {
	const vipMappingData = data.recordset.map((device) => {
		return createVipObj(device, timeStamp, data.location);
	});
	return vipMappingData;
};

const createVipObj = (device, timeStamp, location) => {
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
		location: location,
		timestamp: timeStamp,
	};
};

const getClientDetails = async (pkgDetail,clientCtx) => {
	try {
		const macAddressData = await clientCtx.db
			.collection("Vip_Mapping")
			.find({ isVip: true, location: pkgDetail.location }, { hostMac: 1 })
			.toArray();
		const macAddressArray = macAddressData.map((device) => device.hostMac);
		const headers = { "x-auth-token": APIToken.Token };
		const apiTimeStamp = Math.round(new Date().getTime() / 1000) * 1000;
		const timeStamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);

		for (let macAddress of macAddressArray) {
			try {
				const apiUrl = `${PackageData.DnacClientDetailsAPI}?timestamp=${apiTimeStamp}&macAddress=${macAddress}`;
				const res = await axios.get(apiUrl, { headers: headers });
				if (res) {
					const data = res.data.detail;
					data.healthScore.forEach((item) => {
						if (item.score < 0) {
							item.score = 0;
						}
					});
					const obj = {
						connectionStatus: data.connectionStatus,
						hostType: data.hostType,
						hostMac: data.hostMac.toLowerCase(),
						hostName: data.hostName,
						hostOs: data.hostOs,
						subType: data.subType,
						hostIpV4: data.hostIpV4,
						lastUpdated: data.lastUpdated,
						ssid: data.ssid,
						authType: data.authType,
						healthScore: data.healthScore,
						location: data.location,
						timestamp: timeStamp,
						id: pkgDetail.locationId,
						location: pkgDetail.location,
					};
					await InsertData(obj, "clientDetails", clientCtx.db);
				}
			} catch (error) {
				console.log("error in DnacClientDetailsAPI for loop", error.message);
			}
		}
	} catch (error) {
		console.log("error in getClientDetails :- ", error.message);
	}
};

const updateOauth2AccessTokenCron = (clientCtx) => {
	updateTokenResult = cron.schedule(
		"0 7 3 * *",
		async () => {
			await funcUpdateOauth2Tokens(clientCtx);
		},
		{ scheduled: false }
	);
	return updateTokenResult;
};

const funcUpdateOauth2Tokens = async (clientCtx) => {
	try {
		let msalClientId = "";
		let msalClientkey = "";
		const msalData = await clientCtx.db
			.collection("tbl_Package")
			.find({})
			.project({ ApplicationID: 1, SecretKey: 1 })
			.toArray();
		if (msalData && msalData.length > 0) {
			msalClientId = msalData[0].ApplicationID;
			msalClientkey = msalData[0].SecretKey;
		}
		const tokensSaved = await clientCtx.db
			.collection("TblServiceList")
			.find({
				KeyType: "MailerCredentialOAuth2",
				Key: "Token",
				CurrentlyInUse: 1,
			})
			.toArray();
		if (tokensSaved && tokensSaved.length > 0 && tokensSaved[0].Value) {
			const refreshTokenValue = helpers.decrypt(
				tokensSaved[0].Value.RefreshToken,
				helpers.KeyPhrase
			);
			const tenantIdValue = tokensSaved[0].Value.tenantId;
			const clientIdValue = helpers.decrypt(msalClientId, helpers.KeyPhrase);
			const refreshTokenRequest = {
				grant_type: "refresh_token",
				client_id: clientIdValue,
				client_secret: helpers.decrypt(msalClientkey, helpers.KeyPhrase),
				refresh_token: refreshTokenValue,
			};
			const REFRESH_TOKEN_URL = `https://login.microsoftonline.com/${tenantIdValue}/oauth2/v2.0/token`;
			const response = await axios.post(
				REFRESH_TOKEN_URL,
				new URLSearchParams(refreshTokenRequest),
				{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
			);

			if (response && response.data) {
				const newTokensData = response.data;
				const newAccessToken = helpers.encrypt(
					newTokensData.access_token,
					helpers.KeyPhrase
				);
				const newRefreshToken = helpers.encrypt(
					newTokensData.refresh_token,
					helpers.KeyPhrase
				);
				const tokenExpiresInMin = newTokensData.expires_in / 60;
				const newTokenExpireTime = moment(new Date()).add(tokenExpiresInMin, "m").toDate();

				const result = await clientCtx.db.collection("TblServiceList").updateOne(
					{
						KeyType: "MailerCredentialOAuth2",
						Key: "Token",
						CurrentlyInUse: 1,
					},
					{
						$set: {
							"Value.accessToken": newAccessToken,
							"Value.RefreshToken": newRefreshToken,
							"Value.expiresOn": new Date(newTokenExpireTime),
						},
					}
				);
				if (result) {
					console.log("OAuth2 Tokens Updated Successfully.");
				}
			}
		}
	} catch (err) {
		console.error(err);
	}
};

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

const fetchCliRepoData = async (data) => {
	try {
		const PackageData = await GetPackageDetailFromDB(data);
		const APIToken = await GetToken(data);
		const config = {
			headers: {
				"x-auth-token": APIToken.Token,
			},
		};
		const viewGroupId = await getCliRepoViewGrpId(PackageData, config);
		await updateCliRepViewGrpId(viewGroupId);
		const viewId = await getCliRepoViewId(PackageData, config, viewGroupId);
		await updateCliRepViewId(viewId);
		// await insertViewGrpIdAndViewId(viewGroupId, viewId, PackageData.locationId);
	} catch (error) {
		console.log("getting fetchCliRepoData ", error);
	}
};

// async function insertViewGrpIdAndViewId(viewGroupId, viewId, locationId) {
//   try {
//     let obj = {
//       viewGroupId,
//       viewId,
//       locationId
//     }
//     const result = await db.collection("masterReport").insertOne(obj);
//     if (result) {
//       console.log("data saved in masterReport");
//     } else {
//       console.log("data not saved");
//     }
//   } catch (error) {
//     console.log("error occured in insertViewGrpIdAndViewId");
//   }
// }

const clientReportExecApis = async (Token, PackageData, cronTime, cliDetConfig) => {
	let finalData = {};
	try {
		const endDateTime = new Date().getTime();
		const startDateTime = endDateTime - cronTime * 60 * 1000;
		const config = {
			headers: {
				"x-auth-token": Token.Token,
			},
		};

		let reportId = await getClientReportId(PackageData, config, endDateTime, startDateTime);
		// console.log("reportId : ",reportId);

		const executionId = await getReportExecutionId(PackageData, config, reportId);
		// console.log("executionId : ",executionId);
		
		if (executionId) {
			let FinalRepExecData = await getFinalRepExecData(
				PackageData,
				config,
				reportId,
				executionId,
				cliDetConfig
			);
			// console.log("FinalRepExecData : ",FinalRepExecData);
			finalData = { ...FinalRepExecData };
		}
		if (reportId) {
			await deleteReportSchedule(PackageData, config, reportId);
		}
	} catch (error) {
		console.error("error in clientReportExecApis", error);
	}

	return finalData;
};

const getCliRepoViewId = async (PackageData, config, viewGroupId) => {
	try {
		let viewId = "";
		let api = PackageData.DnacViewIdAPI;
		let newApi = api.replace("{viewGroupId}", viewGroupId);
		let { data } = await axios.get(`${newApi}`, config);
		if (Object.keys(data).length && data.views.length) {
			data.views.forEach((ele) => {
				if (ele.viewName == "Client Detail") {
					viewId = ele.viewId;
				}
			});
		}
		return viewId;
	} catch (error) {
		console.log(error);
	}
};

const getClientReportId = async (PackageData, config, endDateTime, startDateTime) => {
	try {
		let body = await getCliRepoReqBody();
		body.name = `${body.name}_${new Date().getTime()}`;
		// console.log("getting data....body.view.filters",body.view.filters)
		body.view.filters.forEach((ele) => {
			if (ele.type === "TIME_RANGE" && ele.name === "TimeRange") {
				ele.value.startDateTime = startDateTime;
				ele.value.endDateTime = endDateTime;
			}
		});
		let reportId = "";
		let api = PackageData.DnacMainCliRepAPI;
		let { data } = await axios.post(api, body, config);
		// console.log("getting data....dsfoisudogig",data)
		if (Object.keys(data).length) {
			reportId = data.reportId;
		}
		return reportId;
	} catch (error) {
		console.log("error in getClientReportId", error);
	}
};

const getCliRepoReqBody = async () => {
	try {
		let result = undefined;
		let reqBody = await db
			.collection("TblServiceList")
			.find({
				KeyType: "clientReport",
				Key: "cliRepReqBody",
				CurrentlyInUse: 1,
			})
			.project({ Value: 1 })
			.toArray();
		if (reqBody.length !== 0) {
			result = reqBody[0].Value;
		}
		return result;
	} catch (error) {
		console.log("error in getClientReportBody", error);
	}
};

const getCliRepViewIds = async () => {
	try {
		let result = [];
		let data = await db
			.collection("TblServiceList")
			.find({
				$or: [
					{ KeyType: "clientReport", Key: "viewGroupId", CurrentlyInUse: 1 },
					{ KeyType: "clientReport", Key: "viewId", CurrentlyInUse: 1 },
				],
			})
			.project({ Key: 1, Value: 1 })
			.toArray();
		if (data.length !== 0) {
			result = [...data];
		}
		return result;
	} catch (error) {
		console.log(error);
	}
};

const updateCliRepViewId = async (viewId) => {
	try {
		await db.collection("TblServiceList").updateOne(
			{
				KeyType: "clientReport",
				Key: "viewId",
				CurrentlyInUse: 1,
			},
			{ $set: { Value: viewId } }
		);
		await db.collection("TblServiceList").updateOne(
			{
				KeyType: "clientReport",
				Key: "cliRepReqBody",
				CurrentlyInUse: 1,
			},
			{ $set: { "Value.view.viewId": viewId } }
		);
	} catch (error) {
		console.log("getting error in updateCliReportViewId", error);
	}
};

const getFinalRepExecData = async (PackageData, config, reportId, executionId, cliDetConfig) => {
	try {
		let recordset = [];
		// reportId = '08bdb3b0-d0fe-4ac1-af93-8b7a133073fc';
		// executionId = 'c798846c-07e3-413c-9148-e602ca3fb312';
		let timestamp;
		let tempTimestamp;
		let api = PackageData.DnacRepExecAPI;
		let newApi = api.replace("{reportId}", reportId).replace("{executionId}", executionId);
		let { data } = await axios.get(`${newApi}`, config);

		if (Object.keys(data).length) {
			let proFinalData = processFinalRepData(data.client_details);
			recordset = [...proFinalData];
		}
		tempTimestamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);
		let newTimestamp = await db.collection("TopTwoTimestamp").find({}).toArray();
		// console.log("getting nwTimestamp ",newTimestamp);
		if (newTimestamp) {
			timestamp = newTimestamp[1].TimeStamp;
		}
		return {
			recordset,
			timestamp,
			// timestamp: new Date(
			//   new Date(
			//     new Date(
			//       new Date(Date.now()).setMinutes(
			//         parseInt(new Date(Date.now()).getMinutes() / 5) * 5
			//       )
			//     ).setSeconds(0)
			//   ).setMilliseconds(0)
			// ),
			dataFetchFrom: cliDetConfig,
		};
	} catch (error) {
		console.log("getFinalRepExecData", error.message);
		return {
			recordset: [],
			timestamp: "",
			dataFetchFrom: cliDetConfig,
		};
	}
};

const chkCliRepDetails = async () => {
	try {
		let oldViewId = "";
		let oldviewGroupId = "";
		const PackageData = await GetPackageDetailFromDB();
		let dataofDnac = PackageData[0].dnac;
		for (let i = 0; i < dataofDnac.length; i++) {
			dataofDnac[i].DnacPassWord = dataofDnac[i].DnacPassWord
				? helpers.decrypt(results[i].DnacPassWord, helpers.KeyPhrase)
				: "";
			let APIToken = await GetToken(dataofDnac[i]);
			const config = {
				headers: {
					"x-auth-token": APIToken.Token,
				},
			};
			let oldData = await getCliRepViewIds();
			oldData.forEach((ele) => {
				if (ele.Key === "viewId") {
					oldViewId = ele.Value;
				}
				if (ele.Key === "viewGroupId") {
					oldviewGroupId = ele.Value;
				}
			});
			const newViewGroupId = await getCliRepoViewGrpId(dataofDnac, config);
			if (oldviewGroupId !== newViewGroupId) {
				await updateCliRepViewGrpId(newViewGroupId);
			}
			let newViewId = await getCliRepoViewId(dataofDnac, config, newViewGroupId);
			if (oldViewId !== newViewId) {
				await updateCliRepViewId(newViewId);
			}
		}
	} catch (error) {
		console.log(error);
	}
};

const getReportExecutionId = async (PackageData, config, reportId) => {
	try {
		let executionId = null;
		let apiUrl = PackageData.DnacReportAPI;
		apiUrl = apiUrl.replace("{reportId}", reportId);
		// let retryCount = 1;
		const currentTime = new Date();
		while (true) {
			const result = await axios.get(apiUrl, config);
			console.log("report status : ",result && result.data && result.data.executions.length && result.data.executions[0]?.processStatus)
			if (
				(result &&
					result.data &&
					result.data.executions.length &&
					result.data.executions[0].processStatus === "SUCCESS") &&
				(result &&
					result.data &&
					result.data.executions.length &&
					result.data.executions[0].executionId != null)
			) {
				executionId = result.data.executions[0].executionId;
				break;
			}

			await addDelay(30000);
			const timeNow = new Date();
			if (timeNow.getTime() - currentTime.getTime() > (13 * 60 * 1000)) {
				break;
			}
		}
		return executionId;
	} catch (error) {
		console.log("getting error in getReportExicutionId", error);
	}
};

const addDelay = (ms) => new Promise((res) => setTimeout(res, ms));

const deleteReportSchedule = async (PackageData, config, reportId) => {
	try {
		let apiUrl = PackageData.DnacReportAPI;
		apiUrl = apiUrl.replace("{reportId}", reportId);
		const result = await axios.delete(apiUrl, config);
		return result;
	} catch (error) {
		console.log("error in deleteReportSchedule", error.message);
	}
};

const getCliRepoViewGrpId = async (PackageData, config) => {
	try {
		let viewGroupId = "";
		let api = PackageData.DnacViewGrpAPI;
		let { data } = await axios.get(`${api}`, config);
		if (data.length) {
			data.forEach((ele) => {
				if (ele.category === "Client") {
					viewGroupId = ele.viewGroupId;
				}
			});
		}
		return viewGroupId;
	} catch (error) {
		console.log(error);
	}
};

const updateCliRepViewGrpId = async (viewGroupId) => {
	try {
		await db.collection("TblServiceList").updateOne(
			{
				KeyType: "clientReport",
				Key: "viewGroupId",
				CurrentlyInUse: 1,
			},
			{ $set: { Value: viewGroupId } }
		);
		await db.collection("TblServiceList").updateOne(
			{
				KeyType: "clientReport",
				Key: "cliRepReqBody",
				CurrentlyInUse: 1,
			},
			{ $set: { "Value.viewGroupId": viewGroupId } }
		);
	} catch (error) {
		console.log(error);
	}
};

const cliRepDetailUpdateCron = () => {
	cliRepDetailUpdateTask = cron.schedule(
		`5 0 * * *`,
		async () => {
			let cliDetConfig2 = await getCliDetaConfig();
			if (cliDetConfig2 === "Report") {
				await chkCliRepDetails();
			}
		},
		{ scheduled: false }
	);
	return cliRepDetailUpdateTask;
};

const getCliDetaConfig = async (clientCtx) => {
	try {
		let data = "";
		let result = await clientCtx.db
			.collection("TblServiceList")
			.find({
				KeyType: "clientReport",
				Key: "confiurationStatus",
				CurrentlyInUse: 1,
			},{
				projection: {
					Value: 1,
				},
			}).toArray();
		
		if (result.length !== 0) {
			data = result[0].Value;
		}
		return data;
	} catch (error) {
		console.log("getting error is ", error);
	}
};

const processFinalRepData = (data) => {
	const cliRepData = data.map((device) => {
		return createCliObj(device);
	});
	return cliRepData;
};

const createCliObj = (device) => {
	return {
		hostName: device.deviceType !== "Wired" && device.hostName !== "--" ? device.hostName : "",
		username: device.username !== "--" ? device.username : "",
		hostIp: device.ipv4,
		hostMac: device.macAddress && device.macAddress.toLowerCase(),
		hostType: device.deviceType,
		connectionStatus:device.connectionStatus,	
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
		dot11Protocol: device.dot11Protocol,
	};
};

const getDNACIssueData = async (Token, db, TblData, cronTime) => {
	try {
		const priorityArr = ["P1", "P2", "P3", "P4"];
		let responseData = [];
		let version;
		const endDateTime = new Date().getTime();
		const startDateTime = endDateTime - parseInt(cronTime) * 60 * 1000;
		const config = { headers: { "x-auth-token": Token } };
		for (let val of priorityArr) {
			let { data } = await axios.get(
				`${TblData.DNACIssuesApi}?startTime=${startDateTime}&endTime=${endDateTime}&priority=${val}`,
				config
			);
			version = data.version;
			responseData = [...responseData, ...data.response];
			await addDelay(15000);
		}
		var timeStamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);
		// let newTimestamp = await db.collection("TopTwoTimestamp").find({}).toArray();
		// if (newTimestamp) {
		//   timeStamp = newTimestamp[1].TimeStamp;
		// }

		let sitesData = await axios.get(`${TblData.DnacSiteApi}`,config);
		let dnacIssueDataWithSiteName = responseData.map((item)=>{
			let findData = sitesData.data.response.find(element => element.siteHierarchy === item.siteId);
			if(findData){
				item.siteName = findData.name;
				item.siteNameHierarchy = findData.siteNameHierarchy;
			}else{
				item.siteName = ""
				item.siteNameHierarchy = ""
			}

			return item;
		})

		const newData = {
			version: version,
			timeStamp,
			// id: PackageData._id,
			id: TblData.locationId,
			location: PackageData.location,
			// Data: responseData,
			Data: dnacIssueDataWithSiteName
		};
		InsertData(newData, "DnacIssues", db);
		return dnacIssueDataWithSiteName;
	} catch (error) {
		console.log(error);
	}
};

const getIssueDrillDownData = async (APIToken, dnacIssueData,clientCtx) => {
	try {
		const apiUrl = PackageData.DnacIssueEnrichment;
		const siteWiseIssues = [];

		if (dnacIssueData) {
			for (let issue of dnacIssueData) {
				const headers = {
					"x-auth-token": APIToken.Token,
					entity_type: "issue_id",
					entity_value: issue.issueId,
				};
				const result = await axios.get(apiUrl, { headers: headers,timeout: 10000 });
				if (result.data) {
					console.log("result.data.issueDetails.issue => ",result.data.issueDetails.issue.length)
					siteWiseIssues.push(...result.data.issueDetails.issue);
				}
				await addDelay(15000);
			}
		}

		let timeStamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);
		// let newTimestamp = await db.collection("TopTwoTimestamp").find({}).toArray();
		// if (newTimestamp) {
		//   timeStamp = newTimestamp[1].TimeStamp;
		// }
		const finalData = {
			timeStamp,
			id: PackageData.locationId,
			location: PackageData.location,
			Data: siteWiseIssues,
		};
		InsertVerification = InsertData(finalData, "DnacIssuesDrillDown", clientCtx.db);
	} catch (error) {
		console.log("getting error in getIssueDrillDownData: ", error.message);
	}
};

const getVipConfigStatus = async (db) => {
	return await db
		.collection("TblServiceList")
		.find({ KeyType: "VIPConfigStatus", CurrentlyInUse: 1 }, { Value: 1 })
		.toArray();
};

const getVipPostureData = async (config, cronTime) => {
	const macAddressData = await db
		.collection("Vip_Mapping")
		.find({ isVip: true }, { userName: 1, hostMac: 1 })
		.toArray();
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

					const clientLocation = await addClientLocation(
						jsonObj.sessionParameters.calling_station_id,
						clientsLocation
					);
					const filterVipPostureData = getFilterVipPostureData(jsonObj.sessionParameters);
					filterVipPostureData.clientLocation = clientLocation;
					vipPostureObj.Data.push(filterVipPostureData);
				}
			} catch (error) {
				console.error("ISEClientPostureApi", error);
			}
			let authArrData = await getVipAuthStatusData(
				userData,
				cronTime,
				config,
				clientsLocation
			);
			if (authArrData && authArrData.length > 0) {
				vipCliAuthObj.Data.push(authArrData[0]);
			}
		}
	}

	await buildAuthDtaColl(vipPostureObj, "vipClientPosturesDrill", db, "vipClientPostures");
	await buildAuthDtaColl(vipCliAuthObj, "vipClientAuthDrill", db, "vipClientAuthentication");
};

const getVipAuthStatusData = async (userData, cronTime, config, clientsLocation) => {
	const authApiUrl = replaceDnacVal(
		PackageData[0].ISEAuthStatusApi,
		userData.hostMac,
		parseInt(cronTime) * 60
	);
	// const authApiUrl = `https://10.18.1.90/admin/API/mnt/AuthStatus/MACAddress/E8:D0:FC:F6:BB:E5/500000/500/All`;
	try {
		let finalData = [];
		const AuthStatusData = await axios.get(authApiUrl, config);
		if (AuthStatusData && AuthStatusData.data) {
			let authEleCallingId = null;
			let authJsonObj = xml2JsonParser.parse(AuthStatusData.data);
			if (
				authJsonObj.authStatusOutputList.authStatusList &&
				authJsonObj.authStatusOutputList.authStatusList.authStatusElements &&
				authJsonObj.authStatusOutputList.authStatusList.authStatusElements.length
			) {
				if (
					authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0] &&
					authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0]
						.calling_station_id
				) {
					authEleCallingId =
						authJsonObj.authStatusOutputList.authStatusList.authStatusElements[0]
							.calling_station_id;
				}
			}
			const authClientLocation = await addClientLocation(authEleCallingId, clientsLocation);
			let authArr =
				authJsonObj.authStatusOutputList.authStatusList &&
				authJsonObj.authStatusOutputList.authStatusList.authStatusElements &&
				authJsonObj.authStatusOutputList.authStatusList.authStatusElements.map((ele) => {
					return createISEAuthObj(ele, authClientLocation);
				});
			if (authArr && authArr.length) {
				finalData = [...authArr];
			}
		}
		return finalData;
	} catch (error) {
		console.error("ISEAuthStatusApi", error);
	}
};

const buildAuthDtaColl = async (vipObj, collection1, db, collection2) => {
	const timestamp = new Date(
		new Date(
			new Date(
				new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)
			).setSeconds(0)
		).setMilliseconds(0)
	);
	vipObj.timestamp = timestamp;
	checkVIPCliFailureCond(vipObj.Data, collection2);
	InsertVerification = await InsertData(vipObj, collection1, db);
	if (InsertVerification) {
		const customVipAuthData = await getCustomVipPostureData(timestamp, collection1);
		InsertVerification = await InsertData(customVipAuthData, collection2, db);
	}
};

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
		clientLocation: authClientLocation,
	};
};

const getClientsLocation = async () => {
	const clientsLocation = await db
		.collection("clientDetails")
		.aggregate([
			{ $sort: { timestamp: -1 } },
			{ $project: { hostMac: 1, location: 1 } },
			{
				$group: {
					_id: "$hostMac",
					location: { $addToSet: "$location" },
				},
			},
			{ $unwind: "$location" },
		])
		.toArray();
	return clientsLocation;
};

const addClientLocation = async (calling_station_id, clientsLocation) => {
	let clientLocation = "";
	if (calling_station_id) {
		for (let clientLoc of clientsLocation) {
			if (clientLoc._id.toLowerCase() === calling_station_id.toLowerCase()) {
				clientLocation = clientLoc.location;
				break;
			}
		}
	}
	return clientLocation;
};

const getCustomVipPostureData = async (timestamp, collectName) => {
	const locWiseVipPosture = { timestamp: timestamp, Data: [] };
	const data = await db
		.collection(collectName)
		.aggregate([
			{ $match: { timestamp: { $eq: new Date(timestamp) } } },
			{ $project: { "Data.posture_status": 1, "Data.clientLocation": 1 } },
			{ $unwind: "$Data" },
			{
				$project: {
					posture_status: "$Data.posture_status",
					location: "$Data.clientLocation",
				},
			},
			{
				$group: {
					_id: "$location",
					TotalClient: { $sum: 1 },
					Compliant: {
						$sum: { $cond: [{ $eq: ["$posture_status", "Compliant"] }, 1, 0] },
					},
					NonCompliant: {
						$sum: { $cond: [{ $eq: ["$posture_status", "NonCompliant"] }, 1, 0] },
					},
					Pending: { $sum: { $cond: [{ $eq: ["$posture_status", "Pending"] }, 1, 0] } },
					Unknown: { $sum: { $cond: [{ $eq: ["$posture_status", ""] }, 1, 0] } },
				},
			},
		])
		.toArray();

	if (data && data.length) {
		data.forEach((elm) => {
			locWiseVipPosture.Data.push({
				clientLocation: elm._id,
				TotalClient: elm.TotalClient,
				Compliant: elm.Compliant,
				NonCompliant: elm.NonCompliant,
				Pending: elm.Pending,
				Unknown: elm.Unknown,
			});
		});
	}
	return locWiseVipPosture;
};

const replaceDnacVal = (str, mac, time) => {
	return str.replace("{mac_address}", mac).replace("{timestamp}", time);
};

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
		endpoint_policy: jsonObj.endpoint_policy,
	};
};

const checkVIPCliFailureCond = async (AllData, collection) => {
	let NonComData = AllData.filter((ele) => {
		if (collection === "vipClientPostures") {
			return ele.posture_status === "NonCompliant";
		} else {
			return ele.failure_reason;
		}
	});
	if (NonComData.length > 0) {
		if (collection !== "vipClientPostures") {
			const failtReasData = await getFailReasonforAuthUser(NonComData);
			NonComData = [...failtReasData];
		}
		let NonCompSites = [];
		NonComData.forEach((ele) => {
			if (!NonCompSites.includes(ele.clientLocation)) {
				NonCompSites.push(ele.clientLocation);
			}
		});
		let AllNonCompSitesData = [];
		NonCompSites.map((eachSite) => {
			let obj = { siteName: "", Data: [] };
			let arr = [];
			NonComData.forEach((ele) => {
				if (ele.clientLocation == eachSite) {
					arr.push(ele);
				}
			});
			obj.siteName = eachSite;
			obj.Data = [...arr];
			AllNonCompSitesData.push(obj);
		});

		let allottedResidentEnggSites = await getResidentEngData();
		for (el of allottedResidentEnggSites) {
			await matchAssignedSitesToEngg(el, AllNonCompSitesData, collection);
		}
	}
};

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
};

const matchAssignedSitesToEngg = async (data, AllNonCompSitesData, collection) => {
	const intersection = AllNonCompSitesData.filter((element) =>
		data.sites.includes(element.siteName)
	);
	if (intersection.length > 0) {
		const username = `${data.FName} ${data.LName}`;
		if (collection === "vipClientPostures") {
			const apiName = "Posture";
			await mailer.nonCompDevInfoToResEngg(db, data.Email, intersection, apiName, username);
		} else {
			const apiName = "Authentication";
			await mailer.authFailInfoToResEngg(db, data.Email, intersection, apiName, username);
		}
	}
};

const clientHealthDropEmailer = async (clientCtx) => {
	try {
		const timeStamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);

		const resiEngrSites = await clientCtx.db
			.collection("tbl_credentials")
			.aggregate([
				{ $match: { Id: 3 } },
				{ $addFields: { userName: { $concat: ["$FName", " ", "$LName"] } } },
				{ $project: { _id: "$Email", siteName: "$sites", userName: 1 } },
			])
			.toArray();

		const clientDetails = await clientCtx.db
			.collection("clientDetails")
			.aggregate([
				{ $match: { timestamp: { $eq: new Date(timeStamp) } } },
				{ $project: { healthScore: 1, location: 1, hostMac: 1 } },
				{ $unwind: "$healthScore" },
				{ $match: { "healthScore.healthType": "OVERALL" } },
				{
					$project: {
						healthType: "$healthScore.healthType",
						healthScore: "$healthScore.score",
						location: 1,
						hostMac: 1,
					},
				},
			])
			.toArray();

		const macAddrUserData = await clientCtx.db
			.collection("vipClientPosturesDrill")
			.aggregate([
				{ $sort: { timestamp: -1 } },
				{ $unwind: "$Data" },
				{
					$project: {
						user_name: "$Data.user_name",
						macAddr: "$Data.calling_station_id",
						timestamp: 1,
					},
				},
				{ $group: { _id: "$macAddr", userName: { $addToSet: "$user_name" } } },
				{ $project: { userName: { $arrayElemAt: ["$userName", 0] } } },
			])
			.toArray();

		if (resiEngrSites.length > 0 && clientDetails.length > 0) {
			await healthDropEmailer(resiEngrSites, clientDetails, macAddrUserData);
		}
	} catch (error) {
		console.log("error in clientHealthDropEmailer :- ", error.message);
	}
};

const healthDropEmailer = async (resiEngrSites, clientDetails, macAddrUserData) => {
	const healthRange = await dbo
		.collection("TblServiceList")
		.find({
			KeyType: "VIPConfiguration",
			Key: "poor",
		})
		.project({ Key: 1, Value1: 1, Value2: 1 })
		.toArray();

	for (let resiEngr of resiEngrSites) {
		if (resiEngr.siteName) {
			for (let site of resiEngr.siteName) {
				let siteMacHealthArr = clientDetails.filter(
					(client) =>
						client.location === site &&
						client.healthScore > healthRange[0].Value1 &&
						client.healthScore <= healthRange[0].Value2
				);
				siteMacHealthArr.map((site) => {
					const selectedUser = macAddrUserData.filter(
						(user) => user._id.toLowerCase() === site.hostMac.toLowerCase()
					);
					site.userName =
						selectedUser && selectedUser.length ? selectedUser[0].userName : "";
				});
				if (siteMacHealthArr.length > 0) {
					await mailer.vipClientHealthDrop(db, siteMacHealthArr, resiEngr);
					await addDelay(2000);
				}
			}
		}
	}
};

const getFailReasonforAuthUser = async (NonComData) => {
	for (ele of NonComData) {
		const resaonData = await getISEFailureReason(ele.failure_reason);
		ele.cause = resaonData.cause;
		ele.resolution = resaonData.resolution;
		ele.failureReasonId = resaonData.failureReasonId;
	}
	return NonComData;
};

const getISEFailureReason = async (reason) => {
	let failResaonData = {};
	const data = await db
		.collection("ISEFailureReasons")
		.aggregate([
			{ $sort: { timestamp: -1 } },
			{ $limit: 1 },
			{ $unwind: "$iseFailureData" },
			{ $match: { "iseFailureData.code": reason } },
			{ $project: { _id: 0, timestamp: 0 } },
		])
		.toArray();
	if (data && data.length > 0) {
		failResaonData = { ...data[0].iseFailureData };
	}
	return failResaonData;
};

const dnacSiteTopologyDataCron = () => {
	dnacSiteTopologyDataTask = cron.schedule(
		"0 0 0 * * 0",
		async () => {
			await createSiteTopologyData();
		},
		{ scheduled: false }
	);
	return dnacSiteTopologyDataTask;
};

/* this function createted by praveendra for the delete the usage data before 10 days from current data
this function run only on sunday */

const usageThousandApiCron = () => {
	usageThFilterData = cron.schedule(
		"0 2 * * 0",
		async () => {
			await ThausandEyes.deleteUsageData();
		},
		{ scheduled: false }
	);
	return dnacSiteTopologyDataTask;
};

const createSiteTopologyData = async (clientCtx) => {
	try {
		// const data = await Pkg.find({});
		// const multidnac = data && data[0]._doc && data[0]._doc.dnac;
		// let results = multidnac;
		// const data = await Pkg.find({}).lean();
		const data = await clientCtx.db.collection("tbl_Package").find({}).toArray();
		let results = data[0].dnac;
		for (let i = 0; i < results.length; i++) {
			// await Promise.all([
			(async function () {
				let topologyArr = [];
				results[i].DnacPassWord = results[i].DnacPassWord
					? helpers.decrypt(results[i].DnacPassWord, helpers.KeyPhrase)
					: "";
				let APIToken = await GetToken(results[i]);
				const topologyData = await clientCtx.db.collection("SiteTopology").find().toArray();
				const headers = { "x-auth-token": APIToken.Token };
				const apiUrl = results[i].DnacSiteToplogy;
				const timeStamp = new Date(
					new Date(
						new Date(
							new Date(Date.now()).setMinutes(
								parseInt(new Date(Date.now()).getMinutes() / 5) * 5
							)
						).setSeconds(0)
					).setMilliseconds(0)
				);

				const res = await axios.get(apiUrl, { headers: headers });
				if (res && res.data && res.data.response && res.data.response.sites) {
					topologyArr = res.data.response.sites.map((elm) => {
						return { ...elm, timeStamp: timeStamp };
					});
				}

				if (topologyArr.length > 0) {
					if (topologyData && topologyData.length === 0) {
						await clientCtx.db.collection("SiteTopology").insertMany(topologyArr);
					} else {
						const existingTplgyData = topologyData.map((site) => site.id);
						for (let siteData of topologyArr) {
							if (!existingTplgyData.includes(siteData.id)) {
								result = await clientCtx.db.collection("SiteTopology").insertOne(siteData);
							}
						}
					}
				}
			})();
			// ])
		}
	} catch (error) {
		console.log("getting error in createSiteTopologyData", error);
	}
};

const networkIssueEmailer = async (clientCtx) => {
	const timeStamp = new Date(
		new Date(
			new Date(
				new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)
			).setSeconds(0)
		).setMilliseconds(0)
	);

	let prioritiesDataArr = [];
	const prioritiesData = await clientCtx.db
		.collection("TblServiceList")
		.find({ KeyType: "DnacIssuePriority", CurrentlyInUse: 1 })
		.toArray();
	if (prioritiesData && prioritiesData.length > 0) {
		prioritiesDataArr = prioritiesData[0].Value;
	}

	let issuesArr = [];
	if (prioritiesDataArr && prioritiesDataArr.length > 0) {
		issuesArr = await issueDataQuery(timeStamp, prioritiesDataArr);
	}

	if (issuesArr && issuesArr.length > 0) {
		const userData = await clientCtx.db
			.collection("tbl_credentials")
			.find({ Id: { $in: [3, 2] } })
			.project({ sites: 1, Id: 1, Email: 1, FName: 1, LName: 1 })
			.toArray();

		for (let user of userData) {
			if (user.Id === 2) {
				for (let issue of issuesArr) {
					if (issue._id === "") {
						await mailer.networkIssueMailer(clientCtx.db, issue.issueData, user);
						await addDelay(2000);
					}
				}
			} else {
				let assignedSiteIssues = [];
				if (userData.sites) {
					let assignedSiteIds = await getAssignedSites(userData,clientCtx);
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
						await mailer.networkIssueMailer(clientCtx.db, assignedSiteIssues, user.Email);
						await addDelay(2000);
					}
				}
			}
		}
	}
};

const issueDataQuery = async (timeStamp, prioritiesDataArr) => {
	const issuesData = await dbo
		.collection("DnacIssues")
		.aggregate([
			{ $match: { timeStamp: { $eq: new Date(timeStamp) } } },
			{ $unwind: "$Data" },
			{ $match: { "Data.priority": { $in: prioritiesDataArr } } },
			{
				$project: {
					issueId: "$Data.issueId",
					siteId: "$Data.siteId",
					priority: "$Data.priority",
					timeStamp: 1,
				},
			},
			{
				$lookup: {
					from: "DnacIssuesDrillDown",
					let: { issueId: "$issueId", priority: "$priority" },
					pipeline: [
						{ $match: { timeStamp: { $eq: new Date(timeStamp) } } },
						{ $unwind: "$Data" },
						{
							$project: {
								drillIssueId: "$Data.issueId",
								suggestedActions: "$Data.suggestedActions",
								drillPriority: "$Data.issuePriority",
							},
						},
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$drillIssueId", "$$issueId"] },
										{ $eq: ["$drillPriority", "$$priority"] },
									],
								},
							},
						},
					],
					as: "issueDetails",
				},
			},
			{ $unwind: "$issueDetails" },
			{
				$project: {
					timeStamp: 1,
					issueId: 1,
					siteId: 1,
					priority: 1,
					suggestedActions: "$issueDetails.suggestedActions",
				},
			},
			{ $group: { _id: "$siteId", issueData: { $push: "$$ROOT" } } },
		])
		.toArray();

	return issuesData;
};

const getAssignedSites = async (clientCtx) => {
	let assignedSiteIds = [];
	const siteData = await clientCtx.db
		.collection("SiteTopology")
		.find({})
		.project({ groupNameHierarchy: 1, id: 1 })
		.toArray();
	siteData.forEach((site) => {
		const customSite = site.groupNameHierarchy.replace("Global/", "");
		if (userData.sites.includes(customSite)) {
			assignedSiteIds.push(site);
		}
	});
	return assignedSiteIds;
};

const buildGlobalToolsArr = async (clientCtx) => {
	try {
		const toolsDataArr = await clientCtx.db
			.collection("tbl_configurations")
			.find({})
			.project({
				_id: 0,
				Name: 1,
				AllowedBySuperAdmin: 1,
			})
			.toArray();
		// for (val of toolsDataArr) {
		//   if (val.Name === "PSIRT" && val.AllowedBySuperAdmin === true) {
		//     const today = new Date();
		//     // console.log(today.getDay(), today.getHours(), today.getMinutes())
		//     if (!(today.getDay() == 4 && today.getHours() == 6 && today.getMinutes() == 0)) {
		//       val.AllowedBySuperAdmin = false;
		//     }
		//   }
		// }
		global.toolsArr = toolsDataArr;
		return toolsDataArr;
	} catch (err) {
		console.log("error in buildGlobalToolArr", err);
	}
};

const connectivityOperations = async (clientCtx) => {
	let PackageData = await GetPackageDetailFromDB(null, clientCtx);
	// let PackageData = data;
	try {
		toolObj["ServiceNow"] ? await serviceNowConnectivity(PackageData,clientCtx) : null;
		toolObj["Meraki"] ? await merakiConnectivity(PackageData,clientCtx) : null;
		toolObj["The Optimizer"] ? await optimizerConnectivity(PackageData,clientCtx) : null;
		toolObj["ISE"] ? await iseConnectivity(clientCtx) : null;
		toolObj["Compliance Engine"] ? await ComplianceEngineConnectivity(PackageData,clientCtx) : null;
		// toolObj["PSIRT"]? await psirtConnectivity(PackageData): null;
	} catch (err) {
		console.log("error in connectivityOperations", err);
	}
};

const dnacConnectivity = async (ddata,clientCtx) => {
	let dnacConnectivityFlag = true;

	for (let item of ddata) {
		try {
			let decryptedPass = helpers.decrypt(item.DnacPassWord, helpers.KeyPhrase);
			let config = {};
			if (item.aesAuthEnabled) {
				const username = item.DnacUserName;
				// const password = item.DnacPassWord;
				const auth = `${username}:${decryptedPass}`;

				const cipherBase64 = encryptAES(auth, item.apiEncriptionKey);
				// console.log("cipherBase64",cipherBase64);
				config = {
					headers: {
						Authorization: `CSCO-AES-256 credentials=${cipherBase64}`,
					},
				};
			} else {
				config = {
					headers: {
						Authorization:
							"Basic " +
							Buffer.from(item.DnacUserName + ":" + decryptedPass).toString("base64"),
					},
				};
			}
			const data = await axios.post(
				`${item.DnacURL}/dna/system/api/v1/auth/token`,
				{},
				config
			);
			if (data && data.status != 200) {
				dnacConnectivity = false;
			}
		} catch (error) {
			console.log("errro in dnacConnectivity", error);
			helpers.buildStatusForTools(500, "DNA-C", clientCtx.db);
		}
	}

	if (dnacConnectivityFlag) {
		helpers.buildStatusForTools(200, "DNA-C", clientCtx.db);
	} else {
		helpers.buildStatusForTools(500, "DNA-C", clientCtx.db);
	}
};

const serviceNowConnectivity = async (PackageData,clientCtx) => {
	try {
		const config = {
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(
						PackageData.ServiceNowUserName + ":" + PackageData.ServiceNowPassword
					).toString("base64"),
			},
		};
		const data = await axios.get(`${PackageData.ServiceNowAPI}`, config);
		if (data && data.status) {
			helpers.buildStatusForTools(data.status, "ServiceNow", clientCtx.db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "ServiceNow", clientCtx.db);
	}
};

const merakiConnectivity = async (PackageData,clientCtx) => {
	try {
		const config = {
			headers: {
				"X-Cisco-Meraki-API-Key": PackageData.MerakiAPIKey,
			},
		};
		// const data = await axios.get(`${PackageData[0].MerakiBaseUrl}/${PackageData[0].MerakiAPIVersion}/networks/${merakiNetworkList[0].id}/devices?timestamp=300`, config);
		const data = await axios.get(
			`${PackageData.MerakiBaseUrl}/${PackageData.MerakiAPIVersion}/organizations/${PackageData.OrganizationId}/networks`,
			config
		);
		// console.log("meraki data",data);
		if (data && data.status) {
			helpers.buildStatusForTools(data.status, "Meraki", clientCtx.db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "Meraki", clientCtx.db);
	}
};

const psirtConnectivity = async (PackageData) => {
	try {
		const clientId = helpers.decrypt(PackageData[0].PSIRT_client_Id, helpers.KeyPhrase);
		const clientSecret = helpers.decrypt(PackageData[0].PSIRT_client_Secret, helpers.KeyPhrase);
		axios
			.post(
				`https://cloudsso.cisco.com/as/token.oauth2?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&Content-Type=application/x-www-form-urlencoded`,
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			)
			.then(function (response) {
				helpers.buildStatusForTools(response.status, "PSIRT", db);
			})
			.catch(function (error) {
				helpers.buildStatusForTools(500, "PSIRT", db);
			});
	} catch (error) {
		// helpers.buildStatusForTools(500, "Meraki", db);
		console.log("getting error ", error);
	}
};

const optimizerConnectivity = async (PackageData,clientCtx) => {
	try {
		const config = {
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(
						PackageData.HardeningUserName + ":" + PackageData.HardeningPassword
					).toString("base64"),
			},
		};
		const data = await axios.get(`${PackageData.HardeningCommandURl}`, config);
		if (data && data.status) {
			helpers.buildStatusForTools(data.status, "The Optimizer", clientCtx.db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "The Optimizer", clientCtx.db);
	}
};

const iseConnectivity = async (clientCtx) => {
	try {
		const config = {
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(
						PackageData.ISEUserName + ":" + PackageData.ISEPassword
					).toString("base64"),
			},
		};
		let data = await axios.get(`${PackageData.ISEActiveCountApi}`, config);
		if (data && data.status) {
			helpers.buildStatusForTools(data.status, "ISE", clientCtx.db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "ISE", clientCtx.db);
	}
};

const ComplianceEngineConnectivity = async (PackageData,clientCtx) => {
	try {
		const data = await axios.post(`${PackageData.ComplianceUrl}/login`, {
			username: PackageData.ComplianceUserName,
			password: helpers.decrypt(PackageData.CompliancePassword, helpers.KeyPhrase),
		});

		if (data) {
			helpers.buildStatusForTools(data.status, "Compliance Engine", clientCtx.db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "Compliance Engine", clientCtx.db);
		console.log("error in ComplianceEngineConnectivity", error);
	}
};

const buildApplicationHealthData = async (token,clientCtx) => {
	try {
		const mainData = { Data: [] };
		const siteData = await getSiteNameId(clientCtx);
		if (siteData && siteData.length > 0) {
			for (value of siteData) {
				let data = {};
				data.dnacLocation = "Others";
				data.site = value.siteName;
				const healthDrillData = await getApplicationHealthRawData(token, value);
				// console.log("getting health data is ",healthDrillData)
				if (healthDrillData && Object.keys(healthDrillData).length) {
					data = { ...data, ...healthDrillData };
					mainData.Data.push(data);
				}
			}
			mainData["id"] = PackageData.locationId;
			mainData["location"] = PackageData.location;
			insertApplicationHealthDrillData(mainData, clientCtx);
		}
	} catch (error) {
		console.log("getting error in buildApplicationHealthData", error.message);
	}
};

const getSiteNameId = async (clientCtx) => {
	try {
		let siteHealthData = [];
		const data = await clientCtx.db
			.collection("SiteHealthTopology")
			.find({})
			.sort({ timestamp: -1 })
			.limit(activeDnacLenght)
			.project({ _id: 0, "Data.siteName": 1, "Data.siteId": 1 })
			.toArray();
		if (data && data.length > 0) {
			for (let i = 0; i < data.length; i++) {
				siteHealthData = [...data[i].Data];
			}
		}
		return siteHealthData;
	} catch (err) {
		console.log("getting error in getSiteNameId", err);
	}
};

const getApplicationHealthRawData = async (token, siteData) => {
	try {
		let getAppHealthData = {};
		const headers = { "x-auth-token": token };
		const healthData = await axios.get(
			`${PackageData.DnacApplicationHealthAPI}/?siteId=${siteData.siteId}&limit=1000`,
			{ headers }
		);
		if (
			healthData &&
			Object.keys(healthData.data).length &&
			healthData.data.response.length > 0
		) {
			getAppHealthData = { ...healthData.data };
		}
		return getAppHealthData;
	} catch (err) {
		console.log("getting error in getApplicationHealthRawData", err.message);
	}
};

const insertApplicationHealthDrillData = async (healthDrillData,clientCtx) => {
	let timeStamp;
	const data = await clientCtx.db.collection("TopTwoTimestamp").find({ IsFirstTimeStamp: false }).toArray();
	if (data.length > 0) {
		timeStamp = await data[0].TimeStamp;
	} else {
		timeStamp = new Date(
			new Date(
				new Date(
					new Date(Date.now()).setMinutes(
						parseInt(new Date(Date.now()).getMinutes() / 5) * 5
					)
				).setSeconds(0)
			).setMilliseconds(0)
		);
	}
	healthDrillData.timestamp = timeStamp;
	const filterData = filterApplicationHealthData(healthDrillData);
	healthDrillData = { ...filterData };
	InsertData(healthDrillData, "DnacApplicationHealthDrillData", clientCtx.db);
	buildMainHealthChartData(healthDrillData, timeStamp,clientCtx);
};

const filterApplicationHealthData = (healthData) => {
	for (data of healthData.Data) {
		for (ele of data.response) {
			ele.status =
				ele.health > 0 && ele.health <= 5
					? "Poor"
					: ele.health > 5 && ele.health <= 7
					? "Fair"
					: ele.health > 7
					? "Good"
					: "Unknown";
		}
	}
	return healthData;
};

const buildMainHealthChartData = (healthdata, timeStamp,clientCtx) => {
	let mainData = {
		AllDataCount: {
			allTotalCount: 0,
			allGoodCount: 0,
			allPoorCount: 0,
			allFairCount: 0,
			allUnknownCount: 0,
		},
		Data: [],
		timestamp: timeStamp,
	};
	for (data of healthdata.Data) {
		let poorCount = 0;
		let goodCount = 0;
		let fairCount = 0;
		let unknownCount = 0;
		for (val of data.response) {
			if (val.status === "Poor") {
				poorCount++;
			}
			if (val.status === "Good") {
				goodCount++;
			}
			if (val.status === "Fair") {
				fairCount++;
			}
			if (val.status === "Unknown") {
				unknownCount++;
			}
		}
		let obj = {
			dnacLocation: data.dnacLocation,
			totalCount: data.totalCount,
			site: data.site,
			poorCount,
			goodCount,
			fairCount,
			unknownCount,
		};
		mainData.AllDataCount.allTotalCount += data.totalCount;
		mainData.AllDataCount.allGoodCount += parseInt(goodCount);
		mainData.AllDataCount.allFairCount += parseInt(fairCount);
		mainData.AllDataCount.allPoorCount += parseInt(poorCount);
		mainData.AllDataCount.allUnknownCount += parseInt(unknownCount);
		mainData.Data.push(obj);
	}
	mainData["id"] = healthdata.id;
	mainData["location"] = healthdata.location;
	InsertData(mainData, "DnacApplicationHealth", clientCtx.db);
};

//this is for getting all device health at a time
async function getAllDeviceHealth(dnacData, APIToken) {
	let allDevices = [];
	try {
		const DevicehealthData = await axios.get(`${dnacData && dnacData.DnacDeviceHealthAPI}`, {
			headers: { "x-auth-token": APIToken.Token },
		});
		let devices = DevicehealthData.data;
		devices.response.map((item) => {
			(item.macAddress = item.macAddress && item.macAddress.toLowerCase()),
				allDevices.push(item);
		});
	} catch (error) {
		console.log("getting error in getAllDeviceHealth", error.message);
	}
	return allDevices;
}

function GetCriticalDeviceDetailByAPI2(item, deviceHealth) {
	let macAddress = item.macAddress;
	let result = deviceHealth.filter((element) => {
		return element.macAddress === macAddress;
	});
	if (result.length > 0) {
		result[0]["nwDeviceRole"] = item.role && item.role;
		return result[0];
	} else {
		return undefined;
	}
}

const thausandEyesConnectivity = async (pagckageDetail,db) => {
	try {
		const config = {
			headers: {
				Authorization: `Bearer ${pagckageDetail.thAuthrization}`,
			},
		};
		const data = await axios.get(
			`https://${pagckageDetail.thUrl}/v6/endpoint-agents.json`,
			config
		);
		if (data && data.status) {
			helpers.buildStatusForTools(data.status, "ThousandEyes", db);
		}
	} catch (error) {
		helpers.buildStatusForTools(500, "ThousandEyes", db);
	}
};

// const UpdateDataInCriDeviceList = async(APIToken,dnacData) => {
//   try{
//   // const headers = { "x-auth-token": APIToken.Token }
//   const DevicehealthData = await axios.get(`${dnacData.DnacDeviceHealth}`, { headers: { "x-auth-token": APIToken.Token } })
//   let devices = DevicehealthData.data;
//   if(devices.response.length>0){
//     for(let i = 0; i<devices.response.length; i++){
//       devices.response[i]["Action"] = "0";
//       devices.response[i]["dlocation"] = dnacData.location;
//       // devices.response[i]["timestamp"] =new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0));
//       InsertVerification = InsertData(devices.response[i], "tbl_CriticalDevices", db);
//     }
//   }
//   }catch(err){
//     console.log("getting error in UpdateDataInCriDeviceList",err);
//   }
// }

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

// cisco sdwan

const ciscoSdwanTaskCron = (a,clientCtx) => {
	sdwanTask = cron.schedule(
		`*/${a} * * * *`,
		async() => {
			// console.log("Inside ciscoSDWAN");
			const packageData = await getPackageDetails(clientCtx.db);

			const sessionId = await getSessionId(packageData);
			// console.log("sessionId: " + sessionId);
			const token = await getSdwanToken(packageData,sessionId);
			// console.log("token: " + token);
			if(sessionId && token){
				sdwanDeviceInventory(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				sdwanHardwareHealth(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				sdwanSiteHealth(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				downloadMonthlyUsesTunnel(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				downloadOpenAlarmReport(clientCtx.db,token,packageData.SDWANUrl,sessionId)
	
				DownloadMonthlyUsesDevicesDb.downloadMonthlyUsesDevices(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				SDWANTopUtilizedApps.topUtilizedApps(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				new MostUsesTunnelDb().mostUsesTunnel(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				new IntrusionPreventionAlertSchedule().intrusionPreventionAlertSchedule(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				new DownloadAlarmReportForRealTimeStatus().downloadAlarmReportForRealTimeStatus(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				new SiteAvailabilityDb().siteAvailability(clientCtx.db,token,packageData.SDWANUrl,sessionId);
				new SDWANTopology().sdwanTopology(clientCtx.db,token,packageData.SDWANUrl,sessionId);
			}
		},
		{
			scheduled: false,
		}
	);

	return sdwanTask;
};

const everestIncidentsCron = (clientCtx) => {
  incidents = cron.schedule(
    "*/15 * * * *",
    () => {
        console.log("Everest888888888")
      syncEverestIncidents(clientCtx);
    },
    {
      scheduled: false,
    }
  );
  return incidents;
};

const everestIndividualIncidentsCron = (clientCtx) => {
  incidents = cron.schedule(
    "0 2 * * *",
    () => {
      console.log("Everest Individual Incident Cron running");
      syncEverestIndividualIncidents(clientCtx);
    },
    {
      scheduled: false,
    }
  );
  return incidents;
};
 
