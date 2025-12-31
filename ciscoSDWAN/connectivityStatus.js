const { buildStatusForTools } = require("../Utilities/helper");
const { getSessionId, getSdwanToken } = require("./ciscoSdwan");

exports.checkSDWANConnectivity = async(packageData)=>{
    try{
        const sessionId = await getSessionId(packageData);
        const token = await getSdwanToken(packageData,sessionId);

        if(sessionId && token){
            buildStatusForTools(200, "Cisco SDWAN", db);
        }else{
            buildStatusForTools(500, "Cisco SDWAN", db);
        }
    }catch(error){
        console.error("Exception in checkSDWANConnectivity : ",error);
        buildStatusForTools(500, "Cisco SDWAN", db);
    }
}