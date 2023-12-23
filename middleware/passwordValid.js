// Function to validate password strength and i am passing as a middleware
function isValidPassword(password) {
    // Password must be at least 8 characters long and not contain spaces
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  }
  module.exports =isValidPassword;