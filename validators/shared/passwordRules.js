const { body } = require('express-validator');
const { VALIDATION_MESSAGES } = require('../../constants/validation');

/**
 * Password complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?]).{8,}$/;

/**
 * Reusable password validation rule for express-validator
 * Can be used in any validator chain that requires password validation
 *
 * @param {string} fieldName - The name of the password field (default: 'password')
 * @returns {ValidationChain} Express-validator validation chain
 */
function passwordValidation(fieldName = 'password') {
  return body(fieldName)
    .notEmpty()
    .withMessage(VALIDATION_MESSAGES.PASSWORD_REQUIRED)
    .isLength({ min: 8 })
    .withMessage(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
    .matches(PASSWORD_REGEX)
    .withMessage(VALIDATION_MESSAGES.PASSWORD_COMPLEXITY);
}

module.exports = {
  passwordValidation,
  PASSWORD_REGEX,
};
