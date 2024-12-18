/**
 * Checks if the available balance is greater than the specified amount.
 * @param {Object} funds - The funds data.
 * @param {number} [minBalance=100] - The minimum balance required.
 * @returns {boolean} - Returns true if the balance is sufficient, otherwise false.
 */
export function checkFunds(funds, minBalance = 100) {
  const availableBalance = funds.fund_limit.find(fund => fund.title === 'Available Balance');
  return availableBalance && availableBalance.equityAmount > minBalance;
}

/**
 * Checks if there is at least one holding.
 * @param {Object} holdings - The holdings data.
 * @returns {boolean} - Returns true if there is at least one holding, otherwise false.
 */
export function checkHoldings(holdings) {
  return holdings.holdings.length > 0;
}

/**
 * Gets the current time in HH:mm format.
 * @returns {string} - The current time in HH:mm format.
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// export const getCurrentTime = () => {
//   const now = new Date();

//   // Convert to IST using the Intl.DateTimeFormat API
//   const options = { timeZone: "Asia/Kolkata", hour12: false }; // 24-hour format
//   const formatter = new Intl.DateTimeFormat('en-GB', {
//     ...options,
//     hour: '2-digit',
//     minute: '2-digit',
//   });

//   return formatter.format(now); // Returns time in HH:mm format
// };



// Helper function to split array into chunks
export const chunkArray = (array, chunkSize) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

import moment from "moment-timezone";

const startHour = 9;
const startMin = 15;

const endHour = 15;
const endMin = 30;

export const isWithinTradingHours = () => {
  const now = moment().tz("Asia/Kolkata");
  const day = now.day();
  const hour = now.hour();
  const minute = now.minute();

  // Check if it's a weekday (Monday to Friday)
  if (day >= 1 && day <= 5) {
    // Check if it's between 9:30 AM and 3:30 PM IST
    if (
      (hour > startHour || (hour === startHour && minute >= startMin)) &&
      (hour < endHour || (hour === endHour && minute <= endMin))
    ) {
      return true;
    }
  }

  return false;
};