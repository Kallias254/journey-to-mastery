require("dotenv").config();

module.exports = {
  currentKyu: parseInt(process.env.CURRENT_KYU),
  tagPreferences: process.env.TAG_PREFERENCES.split(","),
  katasPerDay: parseInt(process.env.KATAS_PER_DAY),
  preferredLanguage: process.env.PREFERRED_LANGUAGE || "javascript",
  MIN_UNSOLVED_KATAS: parseInt(process.env.MIN_UNSOLVED_KATAS) || 10,
  notificationTime: process.env.NOTIFICATION_TIME,
  deadlineTime: process.env.DEADLINE_TIME,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  emailConfig: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  emailFrom: process.env.EMAIL_FROM,
  emailTo: process.env.EMAIL_TO,
  githubToken: process.env.GITHUB_TOKEN,
  githubUsername: process.env.GITHUB_USERNAME,
  githubPassword: process.env.GITHUB_PASSWORD,
  githubRepo: process.env.GITHUB_REPO,
  githubCommitterName: process.env.GITHUB_COMMITTER_NAME,
  githubCommitterEmail: process.env.GITHUB_COMMITTER_EMAIL,
};
