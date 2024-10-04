export const validateFyersOrder = (order, index = 0) => {
  const requiredFields = [
    "symbol",
    "qty",
    "type",
    "side",
    "productType",
    "limitPrice",
    "stopPrice",
    "disclosedQty",
    "validity",
    "offlineOrder",
    "stopLoss",
    "takeProfit",
    "orderTag",
  ];

  const errors = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (!order.hasOwnProperty(field)) {
      errors.push(`${field} is required for order at index ${index}`);
    }
  }

  // Validate field types and values
  if (typeof order.symbol !== "string") {
    errors.push(`symbol for order at index ${index} must be a string`);
  }

  if (typeof order.qty !== "number" || order.qty <= 0) {
    errors.push(`qty for order at index ${index} must be a positive number`);
  }

  if (![1, 2, 3, 4].includes(order.type)) {
    errors.push(`type for order at index ${index} must be one of 1, 2, 3, 4`);
  }

  if (![1, -1].includes(order.side)) {
    errors.push(`side for order at index ${index} must be one of 1, -1`);
  }

  const validProductTypes = ["CNC", "INTRADAY", "MARGIN", "CO", "BO"];
  if (!validProductTypes.includes(order.productType)) {
    errors.push(`productType for order at index ${index} must be one of ${validProductTypes.join(", ")}`);
  }

  if (typeof order.limitPrice !== "number" || order.limitPrice < 0) {
    errors.push(`limitPrice for order at index ${index} must be a non-negative number`);
  }

  if (typeof order.stopPrice !== "number" || order.stopPrice < 0) {
    errors.push(`stopPrice for order at index ${index} must be a non-negative number`);
  }

  if (typeof order.disclosedQty !== "number" || order.disclosedQty < 0) {
    errors.push(`disclosedQty for order at index ${index} must be a non-negative number`);
  }

  if (!["DAY", "IOC"].includes(order.validity)) {
    errors.push(`validity for order at index ${index} must be one of DAY, IOC`);
  }

  if (typeof order.offlineOrder !== "boolean") {
    errors.push(`offlineOrder for order at index ${index} must be a boolean`);
  }

  if (typeof order.stopLoss !== "number" || order.stopLoss < 0) {
    errors.push(`stopLoss for order at index ${index} must be a non-negative number`);
  }

  if (typeof order.takeProfit !== "number" || order.takeProfit < 0) {
    errors.push(`takeProfit for order at index ${index} must be a non-negative number`);
  }

  if (typeof order.orderTag !== "string") {
    errors.push(`orderTag for order at index ${index} must be a string`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
