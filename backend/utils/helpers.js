const bcrypt = require('bcrypt');

// [HELPER] Hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

module.exports = { hashPassword };