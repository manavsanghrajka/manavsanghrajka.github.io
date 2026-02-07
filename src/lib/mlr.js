// Multiple Linear Regression implementation for stock prediction
import MLR from 'ml-regression-multivariate-linear';

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculate Volatility (Standard Deviation of Returns)
 */
function calculateVolatility(prices, period = 20) {
  const result = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      // Calculate daily returns for the period
      const returns = [];
      for (let j = i - period + 1; j <= i; j++) {
        const dailyReturn = (prices[j] - prices[j - 1]) / prices[j - 1];
        returns.push(dailyReturn);
      }
      
      // Calculate standard deviation
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      
      result.push(stdDev);
    }
  }
  
  return result;
}

/**
 * Prepare features from historical data
 */
export function engineerFeatures(history, macroData = {}) {
  const closes = history.map(d => d.close);
  const volumes = history.map(d => d.volume);
  
  // Calculate technical indicators
  const sma20 = calculateSMA(closes, 20);
  const volatility = calculateVolatility(closes, 20);
  const volumeSMA = calculateSMA(volumes, 20);
  
  // Build feature matrix with all required features
  const processedData = [];
  
  // Start from index 20 to ensure all indicators are available
  for (let i = 20; i < history.length; i++) {
    if (sma20[i] == null || volatility[i] == null) {
      continue;
    }
    
    processedData.push({
      index: i,
      close: closes[i],
      volume: volumes[i] / (volumeSMA[i] || 1),  // Normalized volume
      sma_20: sma20[i],
      volatility: volatility[i],
      fed_funds: macroData.fedFundsRate || 4.5,
      cpi: macroData.cpi || 300,
    });
  }
  
  return processedData;
}

/**
 * Train MLR model and make prediction
 * The model is trained to predict the price 'daysAhead' into the future
 */
export function trainAndPredict(history, macroData, daysAhead = 1) {
  const processedData = engineerFeatures(history, macroData);
  
  if (processedData.length < 50) {
    throw new Error('Insufficient data for training (need at least 50 valid data points)');
  }
  
  // 1. Prepare Features (X) and Target (y)
  // We train the model to predict the price 'daysAhead' into the future
  const X = [];
  const y = [];
  
  for (let i = 0; i < processedData.length - daysAhead; i++) {
    const row = processedData[i];
    X.push([
      row.close,
      row.volume,
      row.sma_20,
      row.volatility,
      row.fed_funds,
      row.cpi
    ]);
    // Target is the price 'daysAhead' from this data point
    y.push([processedData[i + daysAhead].close]);
  }
  
  if (X.length < 30) {
    throw new Error('Insufficient training data after preparing for horizon');
  }
  
  // 2. Split data: 80% train, 20% test
  const splitIndex = Math.floor(X.length * 0.8);
  const trainX = X.slice(0, splitIndex);
  const trainY = y.slice(0, splitIndex);
  const testX = X.slice(splitIndex);
  const testY = y.slice(splitIndex);
  
  // 3. Train the Multiple Linear Regression Model
  const model = new MLR(trainX, trainY);
  
  // 4. Calculate metrics on test set
  let sumSquaredError = 0;
  let sumAbsoluteError = 0;
  let sumSquaredTotal = 0;
  const meanY = testY.reduce((a, b) => a + b[0], 0) / testY.length;
  
  testX.forEach((x, i) => {
    const predicted = model.predict(x)[0];
    const actual = testY[i][0];
    sumSquaredError += Math.pow(predicted - actual, 2);
    sumAbsoluteError += Math.abs(predicted - actual);
    sumSquaredTotal += Math.pow(actual - meanY, 2);
  });
  
  const rSquared = 1 - (sumSquaredError / sumSquaredTotal);
  const mae = sumAbsoluteError / testY.length;
  
  // 5. Prepare the latest features for prediction
  const latest = processedData[processedData.length - 1];
  const latestFeatures = [
    latest.close,
    latest.volume,
    latest.sma_20,
    latest.volatility,
    latest.fed_funds,
    latest.cpi
  ];
  
  // 6. Generate Prediction
  let prediction = model.predict(latestFeatures)[0];
  
  // 7. Dynamic Clamping (2-Sigma Rule)
  // Uses actual market volatility instead of static bounds
  const currentPrice = latest.close;
  const stdDev = latest.volatility;  // Daily standard deviation of returns
  const priceVolatility = currentPrice * stdDev * Math.sqrt(daysAhead);
  
  const lowerBound = currentPrice - (2 * priceVolatility);
  const upperBound = currentPrice + (2 * priceVolatility);
  
  prediction = Math.max(lowerBound, Math.min(prediction, upperBound));
  
  return {
    predictedPrice: prediction,
    rSquared: Math.max(0, Math.min(1, rSquared)),
    mae,
    trainingSize: trainX.length,
    testSize: testX.length,
    volatility: stdDev,
    bounds: { lower: lowerBound, upper: upperBound },
    coefficients: model.weights,
  };
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
