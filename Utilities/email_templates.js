const handlebars = require("handlebars");
const mailers = require("./mailer");
const helpers = require("./helper");
const moment = require("moment");

const userCredentials = async (db) => {
  let receiverEmail = [];
  let data = await db.collection("tbl_credentials").find({IsActive:1,UserType: "2" }).toArray();
  for (let ele of data) {
    receiverEmail.push(ele.Email);
  }
  if (receiverEmail) return receiverEmail;
};

const mailCredentials = async (db) => {
  let tblPackageData = await db.collection("tbl_Package").find().toArray();
  let expiryDays = helpers.decrypt(tblPackageData[0].LCdata, helpers.KeyPhrase);
  expiryDays = moment(expiryDays).format("MMM DD, YYYY");
  let Dec_Pass = helpers.decrypt(tblPackageData[0].EmailPassword, helpers.KeyPhrase);
  let Host = tblPackageData[0].Host;
  let Port = tblPackageData[0].Port;
  let Email = tblPackageData[0].Email;
  return { Dec_Pass, expiryDays, Host, Port, Email };
};

const licenseExpiryNotificationEmail = async (db) => {
  let emailAuthType = "";
  const emailAuthTypeData = await db.collection("tbl_Package").find({}).project({ EmailAuthType: 1 }).toArray();
  if (emailAuthTypeData && emailAuthTypeData.length > 0) {
    emailAuthType = emailAuthTypeData[0].EmailAuthType;
  }
  let emailTemplate = await db.collection("tbl_Templates").find({}).toArray();

  let receiverEmail = await userCredentials(db);
  let { Dec_Pass, expiryDays, Host, Port, Email } = await mailCredentials(db);

  if (emailTemplate) {
    emailTemplate = JSON.stringify(emailTemplate[0]);
    emailTemplate = JSON.parse(emailTemplate);
    let selectedSubject = emailTemplate.licenseExpiryNotificationMail[0].Subject;
    let selectedContent = emailTemplate.licenseExpiryNotificationMail[0].Body;
    let mail_img = emailTemplate.email_image;
    let observer_emailId = emailTemplate.observer_emailId;
    let info;

    // if (emailAuthType === 'OAuth 2.0') {
    if (emailAuthType === "2") {
      let token = await helpers.getOauthToken();
      var messageBody = {
        "{{email_image}}": mail_img,
        "{{expiryDays}}": expiryDays,
        "{{observer_emailId}}": observer_emailId,
      };
      for (let key of Object.keys(messageBody)) {
        selectedContent = selectedContent.replace(new RegExp(key, "g"), messageBody[key]);
      }
      info = await mailers.oAuth2Mailer(selectedSubject, selectedContent, receiverEmail, token);
    } else {
      var subject = handlebars.compile(selectedSubject);
      var content = handlebars.compile(selectedContent);
      var message = {};
      var messageBody = {
        email_image: mail_img,
        expiryDays: expiryDays,
        observer_emailId,
      };
      var subjectTitle = subject(message);
      var bodyContents = content(messageBody);
      let info = mailers.sendEmail({
        subject: subjectTitle,
        message: bodyContents,
        db,
        receiverEmail,
        Email,
        Host,
        Port,
        Dec_Pass,
      });
    }

    if (info) {
      return 1;
    }
  }
};

const nonCompDevInfoToResEngg = async (db, receiverEmail, NonCompData, apiName, username) => {
  let customTableData;
  customTableData =
    NonCompData.length &&
    NonCompData.map((itm) => {
      return (
        itm.Data.length &&
        itm.Data.map((el) => {
          return `<tr>
        <td>${el.user_name}</td>
        <td>${el.calling_station_id}</td>
        <td>${el.posture_status}</td>
        <td>${el.clientLocation}</td>
        <td>${moment(el.auth_acs_timestamp).format("MMM DD, YYYY h:mm A")}</td>
      </tr>`;
        }).join("")
      );
    }).join("");

  let emailAuthType = "";
  const emailAuthTypeData = await db.collection("tbl_Package").find({}).project({ EmailAuthType: 1 }).toArray();
  if (emailAuthTypeData && emailAuthTypeData.length > 0) {
    emailAuthType = emailAuthTypeData[0].EmailAuthType;
  }
  let { Dec_Pass, Host, Port, Email } = await mailCredentials(db);
  let emailTemplate = await db.collection("tbl_Templates").find({}).toArray();

  if (emailTemplate) {
    emailTemplate = JSON.stringify(emailTemplate[0]);
    emailTemplate = JSON.parse(emailTemplate);
    let selectedSubject = emailTemplate.vipClientPosture[0].Subject;
    let selectedContent = emailTemplate.vipClientPosture[0].Body;
    selectedContent = selectedContent.replace("{{tableContents}}", customTableData);
    let mail_img = emailTemplate.email_image;
    let info;

    // if (emailAuthType === 'OAuth 2.0') {
    if (emailAuthType === "2") {
      let token = await helpers.getOauthToken();
      var messageBody = {
        "{{vipCliApiName}}": apiName,
        "{{email_image}}": mail_img,
        "{{userName}}": username,
        "{{tableContents}}": customTableData,
      };
      selectedSubject = selectedSubject.replace(new RegExp("{{vipCliApiName}}", "g"), apiName);
      for (let key of Object.keys(messageBody)) {
        selectedContent = selectedContent.replace(new RegExp(key, "g"), messageBody[key]);
      }
      info = await mailers.oAuth2Mailer(selectedSubject, selectedContent, receiverEmail, token);
    } else {
      const customSelectedContent = selectedContent.replace("{{tableContents}}", customTableData);
      var subject = handlebars.compile(selectedSubject);
      var content = handlebars.compile(customSelectedContent);

      var message = {
        vipCliApiName: apiName,
      };
      var messageBody = {
        vipCliApiName: apiName,
        email_image: mail_img,
        userName: username,
      };
      var subjectTitle = subject(message);
      var bodyContents = content(messageBody);
      let info = mailers.sendEmail({
        subject: subjectTitle,
        message: bodyContents,
        db,
        receiverEmail,
        Email,
        Host,
        Port,
        Dec_Pass,
      });
    }
    if (info) {
      return 1;
    }
  }
};

const vipClientHealthDrop = async (db, siteMacHealthArr, resiEngr) => {
  const receiverEmail = resiEngr._id;
  const siteMacHealthTable = siteMacHealthArr.map((elm, index) => {
    return `<tr>
            <td align="left">${elm.hostMac}</td>
            <td align="left">${elm.userName}</td>
            <td align="left">${elm.location}</td>
            <td align="center"><font color='#FF0000'><b>${elm.healthScore}</b></font></td>
            </tr>`;
  });

  let emailAuthType = "";
  const emailAuthTypeData = await db.collection("tbl_Package").find({}).project({ EmailAuthType: 1 }).toArray();
  if (emailAuthTypeData && emailAuthTypeData.length > 0) {
    emailAuthType = emailAuthTypeData[0].EmailAuthType;
  }
  let emailTemplate = await db.collection("tbl_Templates").find({}).project({ vipClientHealthDrop: 1, vipClientHealthDropTable: 1, email_image: 1 }).toArray();

  if (emailTemplate) {
    emailTemplate = JSON.stringify(emailTemplate[0]);
    emailTemplate = JSON.parse(emailTemplate);
    let selectedSubject = emailTemplate.vipClientHealthDrop[0].Subject;
    let selectedContent = emailTemplate.vipClientHealthDrop[0].Body;
    const tableData = emailTemplate.vipClientHealthDropTable[0].Body;
    const customTableData = tableData.replace("{{tableContents}}", siteMacHealthTable.join(""));
    const customSelectedContent = selectedContent.replace("{{tableView}}", customTableData);
    let mail_img = emailTemplate.email_image;
    let info;

    if (emailAuthType === "2") {
      let token = await helpers.getOauthToken();
      var messageBody = {
        "{{email_image}}": emailData.email_image,
        "{{user_name}}": resiEngr.userName.trim(),
        "{{tableView}}": customTableData,
      };
      for (let key of Object.keys(messageBody)) {
        selectedContent = customSelectedContent.replace(new RegExp(key, "g"), messageBody[key]);
      }
      info = await mailers.oAuth2Mailer(selectedSubject, selectedContent, receiverEmail, token);
    } else {
      const customSelectedContent = selectedContent.replace("{{tableView}}", customTableData);
      var subject = handlebars.compile(selectedSubject);
      var content = handlebars.compile(customSelectedContent);

      var message = {};
      var messageBody = {
        email_image: mail_img,
        user_name: resiEngr.userName.trim(),
      };
      var subjectTitle = subject(message);
      var bodyContents = content(messageBody);
      let { Dec_Pass, expiryDays, Host, Port, Email } = await mailCredentials(db);
      info = mailers.sendEmail({
        subject: subjectTitle,
        message: bodyContents,
        db,
        receiverEmail,
        Email,
        Host,
        Port,
        Dec_Pass,
      });
    }

    if (info) {
      return 1;
    }
  }
};

const networkIssueMailer = async (db, issueData, userData) => {
  const receiverEmail = userData.Email;
  let emailTemplate = await db.collection("tbl_Templates").find({}).project({ networkIssueMailer: 1, networkIssueTable: 1, email_image: 1 }).toArray();
  emailTemplate = JSON.stringify(emailTemplate[0]);
  emailTemplate = JSON.parse(emailTemplate);
  let networkIssueTable = [];

  // Email auth type check.
  let emailAuthType = "";
  const emailAuthTypeData = await db.collection("tbl_Package").find({}).project({ EmailAuthType: 1 }).toArray();
  if (emailAuthTypeData && emailAuthTypeData.length > 0) {
    emailAuthType = emailAuthTypeData[0].EmailAuthType;
  }

  if (emailTemplate) {
    let tableData = emailTemplate.networkIssueTable[0].Body;
    for (issue of issueData) {
      tableData = tableData.replace("{{siteId}}", issue.siteId ? issue.siteId : "Unknown");
      tableData = tableData.replace("{{issueId}}", issue.issueId);
      const actionArr = issue.suggestedActions.map((elm, index) => {
        return `<tr>
                  <td align="left" colspan='4'>${elm.message}</td>
                </tr>`;
      });
      tableData = tableData.replace("{{tableContents}}", actionArr.join(""));
      networkIssueTable.push(tableData);
    }

    let selectedSubject = emailTemplate.networkIssueMailer[0].Subject;
    let selectedContent = emailTemplate.networkIssueMailer[0].Body;
    const customSelectedContent = selectedContent.replace("{{tableView}}", networkIssueTable.join(""));
    let mail_img = emailTemplate.email_image;
    let info;

    if (emailAuthType === "2") {
      let token = await helpers.getOauthToken();
      var messageBody = {
        "{{email_image}}": mail_img,
        "{{user_name}}": `${userData.FName} ${userData.LName ? userData.LName : ""}`.trim(),
        "{{tableView}}": networkIssueTable.join(""),
      };
      for (let key of Object.keys(messageBody)) {
        selectedContent = customSelectedContent.replace(new RegExp(key, "g"), messageBody[key]);
      }
      info = await mailers.oAuth2Mailer(selectedSubject, selectedContent, receiverEmail, token);
    } else {
      var subject = handlebars.compile(selectedSubject);
      var content = handlebars.compile(customSelectedContent);
      var message = {};
      var messageBody = {
        email_image: mail_img,
        user_name: `${userData.FName} ${userData.LName ? userData.LName : ""}`.trim(),
      };
      var subjectTitle = subject(message);
      var bodyContents = content(messageBody);
      let { Dec_Pass, expiryDays, Host, Port, Email } = await mailCredentials(db);
      info = mailers.sendEmail({
        subject: subjectTitle,
        message: bodyContents,
        db,
        receiverEmail,
        Email,
        Host,
        Port,
        Dec_Pass,
      });
    }
    if (info) {
      return 1;
    }
  }
};

const authFailInfoToResEngg = async (db, receiverEmail, NonCompData, apiName, username) => {
  let customTableData;
  customTableData =
    NonCompData.length &&
    NonCompData.map((itm) => {
      return (
        itm.Data.length &&
        itm.Data.map((el) => {
          return `<tr>
            <td>${el.user_name}</td>
            <td>${el.calling_station_id}</td>
            <td>${el.failure_reason}</td>
            <td>${el.cause}</td>
            <td>${el.resolution}</td>
            <td>${el.clientLocation}</td>
            <td>${moment(el.acs_timestamp).format("MMM DD, YYYY HH:mm:SS 'A")}</td>
          </tr>`;
        }).join("")
      );
    }).join("");

  let { Dec_Pass, Host, Port, Email } = await mailCredentials(db);
  let emailTemplate = await db.collection("tbl_Templates").find({}).toArray();

  // Check email auth type.
  let emailAuthType = "";
  const emailAuthTypeData = await db.collection("tbl_Package").find({}).project({ EmailAuthType: 1 }).toArray();
  if (emailAuthTypeData && emailAuthTypeData.length > 0) {
    emailAuthType = emailAuthTypeData[0].EmailAuthType;
  }

  if (emailTemplate) {
    emailTemplate = JSON.stringify(emailTemplate[0]);
    emailTemplate = JSON.parse(emailTemplate);
    let selectedSubject = emailTemplate.vipClientAuth[0].Subject;
    let selectedContent = emailTemplate.vipClientAuth[0].Body;
    const customSelectedContent = selectedContent.replace("{{tableContents}}", customTableData);
    let mail_img = emailTemplate.email_image;
    let info;

    if (emailAuthType === "2") {
      let token = await helpers.getOauthToken();
      var messageBody = {
        "{{vipCliApiName}}": apiName,
        "{{email_image}}": mail_img,
        "{{userName}}": username,
        "{{tableContents}}": customTableData,
      };

      selectedSubject = selectedSubject.replace(new RegExp("{{vipCliApiName}}", "g"), apiName);
      for (let key of Object.keys(messageBody)) {
        selectedContent = customSelectedContent.replace(new RegExp(key, "g"), messageBody[key]);
      }
      info = await mailers.oAuth2Mailer(selectedSubject, selectedContent, receiverEmail, token);
    } else {
      var subject = handlebars.compile(selectedSubject);
      var content = handlebars.compile(customSelectedContent);
      var message = {
        vipCliApiName: apiName,
      };
      var messageBody = {
        vipCliApiName: apiName,
        email_image: mail_img,
        userName: username,
      };
      var subjectTitle = subject(message);
      var bodyContents = content(messageBody);
      info = mailers.sendEmail({
        subject: subjectTitle,
        message: bodyContents,
        db,
        receiverEmail,
        Email,
        Host,
        Port,
        Dec_Pass,
      });
    }
    if (info) {
      return 1;
    }
  }
};

function criticalDeviceHealthNotGetTemplate(deviceDetail,emailBody) {
  let tbody = "";
  deviceDetail.forEach((element, index) => {
    tbody += `<tr>
                <td>${index + 1}</td>
                <td>${element.dnacName}</td>
                <td class="dnacName">${element.deviceName ? element.deviceName : "N/A"}</td>
                <td>${element.macAddress}</td>
                <td>${element.ip}</td>
              </tr>`;
  });

  let htmlBody = emailBody.criticalDeviceHealthIssue[0].Body;
  htmlBody = htmlBody.replace("{src}",emailBody.email_image);
  htmlBody = htmlBody.replace("{tbody}",tbody);
  return `<!DOCTYPE html>
  <html>
    <head>
      <style>
        #customers {
          font-family: Arial, Helvetica, sans-serif;
          border-collapse: collapse;
          width: 100%;
          margin: 0 auto;
        }
  
        #customers td,
        #customers th {
          border: 1px solid #404040;
          padding: 5px;
        }
  
        #customers tr:nth-child(even) {
          background-color: #f2f2f2;
        }
  
        #customers tr:hover {
          background-color: #ddd;
        }
  
        #customers th {
          padding-top: 10px;
          padding-bottom: 10px;
          text-align: left;
          color: black;
          font-weight: bold;
        }
        .dnacName {
          color: red;
        }
        .dnacName > a {
          color: red;
          text-decoration: none;
          cursor: auto !important;
        }
      </style>
    </head>
    ${htmlBody}
  </html>
  `;
}

//this function used for sending the mail for not getting the critical devices helth
async function criticalDeviceHealthNotGetMailSender(criticalDeviceData, db) {
  try {
    const receiverEmail = await userCredentials(db);
    const { Email, Host, Port, Dec_Pass } = await mailCredentials(db);
    const emailBody = await db.collection("tbl_Templates").find({},{criticalDeviceHealthIssue:true,email_image:true}).toArray();

    let subjectTitle = emailBody[0].criticalDeviceHealthIssue[0].Subject;
    await mailers.sendEmail({
      subject: subjectTitle,
      message: criticalDeviceHealthNotGetTemplate(criticalDeviceData,emailBody[0]),
      receiverEmail,
      Email,
      Host,
      Port,
      Dec_Pass,
    });
  } catch (error) {
    console.log("Error while sending critical device Not get health email", error);
  }
}

module.exports = {
  licenseExpiryNotificationEmail,
  nonCompDevInfoToResEngg,
  vipClientHealthDrop,
  networkIssueMailer,
  authFailInfoToResEngg,
  criticalDeviceHealthNotGetMailSender,
};
