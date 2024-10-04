export const validateZerodhaOrder = (order, index = 0) => {
    const requiredFields = [
      "exchange",
      "tradingsymbol",
      "transaction_type",
      "quantity",
      "product",
      "order_type",
    ];
  
    const errors = [];
  
    // Check for required fields
    for (const field of requiredFields) {
      if (!order.hasOwnProperty(field)) {
        errors.push(`${field} is required for order at index ${index}`);
      }
    }
  
    // Validate field types and values
    if (typeof order.exchange !== "string" || !["NSE", "BSE", "NFO", "BFO", "CDS", "MCX"].includes(order.exchange)) {
      errors.push(`exchange for order at index ${index} must be one of NSE, BSE, NFO, BFO, CDS, MCX`);
    }
  
    if (typeof order.tradingsymbol !== "string") {
      errors.push(`tradingsymbol for order at index ${index} must be a string`);
    }
  
    if (!["BUY", "SELL"].includes(order.transaction_type)) {
      errors.push(`transaction_type for order at index ${index} must be one of BUY or SELL`);
    }
  
    if (typeof order.quantity !== "number" || order.quantity <= 0) {
      errors.push(`quantity for order at index ${index} must be a positive number`);
    }
  
    const validProducts = ["NRML", "MIS", "CNC"];
    if (!validProducts.includes(order.product)) {
      errors.push(`product for order at index ${index} must be one of ${validProducts.join(", ")}`);
    }
  
    const validOrderTypes = ["MARKET", "LIMIT", "SL", "SL-M"];
    if (!validOrderTypes.includes(order.order_type)) {
      errors.push(`order_type for order at index ${index} must be one of ${validOrderTypes.join(", ")}`);
    }
  
    // Optional fields
    if (order.hasOwnProperty("price") && (typeof order.price !== "number" || order.price < 0)) {
      errors.push(`price for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("trigger_price") && (typeof order.trigger_price !== "number" || order.trigger_price < 0)) {
      errors.push(`trigger_price for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("disclosed_quantity") && (typeof order.disclosed_quantity !== "number" || order.disclosed_quantity < 0)) {
      errors.push(`disclosed_quantity for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("squareoff") && (typeof order.squareoff !== "number" || order.squareoff < 0)) {
      errors.push(`squareoff for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("stoploss") && (typeof order.stoploss !== "number" || order.stoploss < 0)) {
      errors.push(`stoploss for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("trailing_stoploss") && (typeof order.trailing_stoploss !== "number" || order.trailing_stoploss < 0)) {
      errors.push(`trailing_stoploss for order at index ${index} must be a non-negative number`);
    }
  
    if (order.hasOwnProperty("tag") && (typeof order.tag !== "string" || order.tag.length > 20)) {
      errors.push(`tag for order at index ${index} must be a string with a maximum of 20 characters`);
    }
  
    // Validity should be either "DAY" or "IOC" if provided
    if (order.hasOwnProperty("validity") && !["DAY", "IOC"].includes(order.validity)) {
      errors.push(`validity for order at index ${index} must be one of DAY, IOC`);
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  