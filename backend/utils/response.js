// [MESSAGE] Return success message
const successResponse = (message, data = null) => ({
  success: true,
  message: `${message}.`,
  data,
});

// [MESSAGE] Return error message
const errorResponse = (message, data = null) => ({
  success: false,
  message: `${message}.`,
  data,
});

module.exports = { successResponse, errorResponse };
