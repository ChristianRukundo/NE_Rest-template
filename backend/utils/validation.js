const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const validatePassword = (password) => {
  return password.length >= 6
}

const validateUsername = (username) => {
  return username.length >= 3
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
}
