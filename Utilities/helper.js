var KeyPhrase = "TheObserver_^eloc!&_&y&tem&_Priv@te_Limited";
let tempToolStatusStorage = [];

const setPhrase = (data) => {
  let firstPart = data.split("Obser")[1];
  let secPart = firstPart.split("em&_")[0];
  return secPart;
}

// each time insert tool status 
// const InsertData = (json, CollectionName, db) => {
//   return new Promise((resolve) => {
//     db.collection(CollectionName).insertOne(json, function (error, result) {
//       if (error) throw error;
//       resolve(result);
//     });
//   });
// };

// update tool status
const InsertData = async(json, CollectionName, db) => {
  const result = await db.collection(CollectionName).find({}).toArray();
  if(result.length == 0){
    await db.collection(CollectionName).insertOne(json);
  }else{
    const psirtExits = json.Data.filter((item)=> item.tool === "PSIRT");
    if(psirtExits.length == 0){
      const psirtStatusData = result[0].Data.filter((item)=> item.tool === "PSIRT");
      if(psirtStatusData.length > 0){
        json.Data.push(psirtStatusData[0]);
      }
    }
    await db.collection(CollectionName).updateOne({_id:result[0]._id},{$set:json});
  }
};

const saveToolStatus = async (db) => {
  const timestamp = new Date(new Date(new Date(new Date(Date.now()).setMinutes(
  parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
  const mainObj = { timestamp, Data: tempToolStatusStorage }
  global.toolsArr = null;
  await InsertData(mainObj, "toolConnectivityStatus", db);
  //this line commented out for the psirt status code saved.
  tempToolStatusStorage.length = 0;
}
module.exports = {
  KeyPhrase,
  decrypt: (encryptedText, key) => {
    try{
      let my_key = setPhrase(key)
    let str = "";
    if (encryptedText) {
      var crypto = require("crypto");
      var alg = "des-ede-cbc";
      var key = new Buffer.from(my_key, "utf-8");
      var iv = new Buffer.from("QUJDREVGR0g=", "base64"); //This is from c# cipher iv

      var encrypted = new Buffer.from(encryptedText, "base64");
      var decipher = crypto.createDecipheriv(alg, my_key, iv);
      var decoded = decipher.update(encrypted, "binary", "ascii");
      decoded += decipher.final("ascii");

      return decoded;
    } else {
      return str;
    }
    }catch(error) {
      console.log("getting error in decrypt",error);
    }
  },

  encrypt: (text, key) => {
    let my_key = setPhrase(key)
    let str = "";
    if (text) {
      var crypto = require("crypto");
      var alg = "des-ede-cbc";
      var key = new Buffer.from(my_key, "utf-8");
      var iv = new Buffer.from("QUJDREVGR0g=", "base64"); //This is from c# cipher iv

      var cipher = crypto.createCipheriv(alg, my_key, iv);
      var encoded = cipher.update(text, "ascii", "base64");
      encoded += cipher.final("base64");

      return encoded;
    } else {
      return str;
    }
  },

  buildStatusForTools: async (status, deviceName, db) => {
    let obj = { tool: deviceName, statusCode: status }
    obj = status.toString().startsWith(2) ? { ...obj, status: "Reachable" } : { ...obj, status: "Non-Reachable" };
    tempToolStatusStorage.push(obj);

    if (global.toolsArr && global.toolsArr.length > 0) {
      for (device of tempToolStatusStorage) {
        for (val of global.toolsArr) {
          if(val.Name == "Compliance Engine"){
            val.AllowedBySuperAdmin = false;
          }else if(val.Name == "PSIRT"){
            val.AllowedBySuperAdmin = false;
          }else if(val.Name == 'Cisco SDWAN'){
            val.AllowedBySuperAdmin = false;
          }else{
            if(val.Name === device.tool && val.AllowedBySuperAdmin === true) {
             val.AllowedBySuperAdmin = false;
           }
          }
        }
      }
      const finalChk = global.toolsArr.filter(ele => ele.AllowedBySuperAdmin === true);
      if (finalChk.length == 0) {
        saveToolStatus(db);
      }
    }
  },

  LogError: function (
    functionName,
    Error
  ) {
    var myobj = {
      tableName: functionName,
      error: Error,
      timestamp: new Date(Date.now()),
      type: "Node",
    };
    dbo
      .collection("tblErrorForEachTable")
      .insertOne(myobj, function (err, res) {
        if (err) throw err;
      });
  },

  getOauthToken : async (dbo) => {
    let token = '';
    const tokenData = await dbo.collection("TblServiceList").find({
      "KeyType": "MailerCredentialOAuth2", "Key": "Token", "CurrentlyInUse": 1
    }).project({ "Value.accessToken": 1 }).toArray();
    if (tokenData && tokenData.length > 0) {
      encryptToken = tokenData[0].Value.accessToken;
      token = module.exports.decrypt(encryptToken, KeyPhrase);
    }
    return token;
  },
  getTime : ()=>{
      const now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);
      return now;
  }  
};

