const bcrypt = require('bcrypt');

// [HELPER] Hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// [HELPER] Build full name
const getFullName = (student) =>
	[student.firstName, student.middleName, student.lastName, student.nameExtension]
		.filter(Boolean)
		.join(' ');

// [HELPER] Validate sex
const isValidSex = (sex) => ['MALE', 'FEMALE'].includes(sex.toUpperCase());

module.exports = { hashPassword, getFullName, isValidSex };