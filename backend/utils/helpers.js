const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const generateResetToken = () => {
  return require("crypto").randomBytes(32).toString("hex")
}

module.exports = {
  generateVerificationCode,
  generateResetToken,
}
