/**
 * Checks if the available balance is greater than the specified amount.
 * @param {Object} funds - The funds data.
 * @param {number} [minBalance=1000] - The minimum balance required.
 * @returns {boolean} - Returns true if the balance is sufficient, otherwise false.
 */
export function checkFunds(funds, minBalance = 1000) {
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


// Helper function to split array into chunks
export const chunkArray = (array, chunkSize) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};