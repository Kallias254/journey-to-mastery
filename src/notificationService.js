const TelegramBot = require("node-telegram-bot-api");
const nodemailer = require("nodemailer");
const config = require("./config");

const bot = new TelegramBot(config.telegramBotToken, { polling: false });

async function sendTelegramNotification(message) {
  try {
    await bot.sendMessage(config.telegramChatId, message);
    console.log("Telegram notification sent successfully");
  } catch (error) {
    console.error("Error sending Telegram notification:", error.message);
  }
}

async function sendEmailNotification(subject, htmlContent) {
  const transporter = nodemailer.createTransport(config.emailConfig);

  try {
    await transporter.sendMail({
      from: config.emailFrom,
      to: config.emailTo,
      subject: subject,
      html: htmlContent,
    });
    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error sending email notification:", error.message);
  }
}

async function sendProgressionNotification(message) {
  try {
    await sendTelegramNotification(message);
    await sendEmailNotification("Codewars Progress Update", message);
    console.log("Progression notification sent successfully");
  } catch (error) {
    console.error("Error sending progression notification:", error.message);
  }
}

module.exports = {
  sendTelegramNotification,
  sendEmailNotification,
  sendProgressionNotification,
};
