import validator from 'validator';

export const isValidEmail = (email) => validator.isEmail(email);

export const isValidPhoneNumber = (phoneNumber) =>
  validator.isMobilePhone(phoneNumber);

export const isStrongPassword = (password) =>
  validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
