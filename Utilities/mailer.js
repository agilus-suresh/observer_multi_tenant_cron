const nodeMailer = require("nodemailer");
const helper = require("./helper");
const axios = require("axios");

const sendEmail = async (mailerDetails) => {
  let mailOptions = {
    from: mailerDetails.Email,
    to: mailerDetails.receiverEmail,
    subject: mailerDetails.subject,
    text: "",
    html: mailerDetails.message,
  };

  let transporter = nodeMailer.createTransport({
    host: mailerDetails.Host,
    port: mailerDetails.Port,
    auth: {
      user: mailerDetails.Email,
      pass: mailerDetails.Dec_Pass,
    },
    tls: {
      secure: false,
      rejectUnauthorized: true,
    },
  });

  let info = await transporter.sendMail(mailOptions);
  if (info) {
    return 1;
  } else return 0;
};

const oAuth2Mailer = async (mailSubject, mailContent, recepients, token) => {
  return await axios
    .post(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        message: {
          subject: mailSubject,
          body: {
            contentType: "HTML",
            content: mailContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: recepients,
              },
            },
          ],
        },
        saveToSentItems: "true",
      },
      {
        headers: {
          Authorization: "Bearer " + token,
          "content-type": "application/json",
          "content-length": 96,
        },
      }
    )
    .then((resp) => {
      if (resp.status === 202) {
        return 1;
      } else {
        return 0;
      }
    })
    .catch((error) => {
      helper.LogError("oAuth2Mailer", error);
      return 0;
    });
};

module.exports = { sendEmail, oAuth2Mailer };
