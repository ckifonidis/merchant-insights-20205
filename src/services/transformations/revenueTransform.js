/**
 * Revenue Data Transformation Functions
 * Converts API responses to UI-compatible formats
 */

// Shopping interest code to label mapping
const SHOPPING_INTEREST_LABELS = {
  '': 'Unspecified',
  'other_category': 'Other Category',
  'SHOPINT1': 'Automotive & Fuel Products',
  'SHOPINT2': 'Electronics & Household Appliances', 
  'SHOPINT3': 'Telecommunication',
  'SHOPINT4': 'Health & Medical Care',
  'SHOPINT5': 'Entertainment & Hobbies',
  'SHOPINT6': 'Education',
  'SHOPINT7': 'Toys',
  'SHOPINT8': 'Travel & Transportation',
  'SHOPINT9': 'Personal Care',
  'SHOPINT10': 'Pets',
  'SHOPINT11': 'Fashion, Cosmetics & Jewelry',
  'SHOPINT12': 'Tourism',
  'SHOPINT13': 'Home & Garden',
  'SHOPINT14': 'Restaurants, Bars, Fast Food & Coffee',
  'SHOPINT15': 'Food & Drinks'
};

/**
 * Transform revenue breakdown by interests API response to UI format
 * @param {Object} apiResponse - API response with metrics array
 * @returns {Array} Array of {interest, merchant, competitor} objects
 */
export const transformRevenueByInterests = (apiResponse) => {
  console.log('🔄 Transforming revenue by interests data:', apiResponse);
  
  // Handle both full API response and Redux store format
  let metrics;
  if (apiResponse?.payload?.metrics) {
    // Full API response format
    metrics = apiResponse.payload.metrics;
    console.log('🔍 Using full API response format');
  } else if (Array.isArray(apiResponse)) {
    // Redux store format (array of metrics)
    metrics = apiResponse;
    console.log('🔍 Using Redux store format (array)');
  } else {
    console.warn('⚠️ No metrics data in revenue interests response', apiResponse);
    return [];
  }
  
  // Find merchant and competition data
  const interestMetrics = metrics.filter(m => m.metricID === 'converted_customers_by_interest');
  console.log('🔍 Interest metrics found:', interestMetrics.length);
  
  const merchantData = interestMetrics.find(m => m.merchantId !== 'competition');
  const competitionData = interestMetrics.find(m => m.merchantId === 'competition');
  
  console.log('🔍 Merchant data:', merchantData);
  console.log('🔍 Competition data:', competitionData);
  
  if (!merchantData?.seriesValues?.[0]?.seriesPoints) {
    console.warn('⚠️ No merchant series data in revenue interests response');
    console.log('🔍 Merchant data structure:', {
      hasMerchantData: !!merchantData,
      hasSeriesValues: !!merchantData?.seriesValues,
      seriesValuesLength: merchantData?.seriesValues?.length,
      hasSeriesPoints: !!merchantData?.seriesValues?.[0]?.seriesPoints
    });
    return [];
  }

  const merchantPoints = merchantData.seriesValues[0].seriesPoints;
  const competitionPoints = competitionData?.seriesValues?.[0]?.seriesPoints || [];
  
  // Create lookup for competition data
  const competitionLookup = {};
  competitionPoints.forEach(point => {
    competitionLookup[point.value2] = parseFloat(point.value1) || 0;
  });
  
  // Transform to UI format
  const transformedData = merchantPoints.map(point => {
    const interestCode = point.value2;
    const interestLabel = SHOPPING_INTEREST_LABELS[interestCode] || interestCode;
    const merchantValue = parseFloat(point.value1) || 0;
    const competitorValue = competitionLookup[interestCode] || 0;
    
    return {
      interest: interestLabel,
      merchant: merchantValue,
      competitor: competitorValue
    };
  });
  
  // Filter out zero values and sort by total value
  const filteredData = transformedData
    .filter(item => item.merchant > 0 || item.competitor > 0)
    .sort((a, b) => (b.merchant + b.competitor) - (a.merchant + a.competitor));
  
  console.log(`✅ Transformed ${filteredData.length} interest categories`);
  return filteredData;
};

/**
 * Transform revenue breakdown by channel API response to UI format
 * @param {Object} apiResponse - API response with channel metrics
 * @returns {Object} Object with merchant/competitor channel breakdown
 */
export const transformRevenueByChannel = (apiResponse) => {
  console.log('🔄 Transforming revenue by channel data:', apiResponse);
  
  // Handle both full API response and Redux store format
  let metrics;
  if (apiResponse?.payload?.metrics) {
    // Full API response format
    metrics = apiResponse.payload.metrics;
    console.log('🔍 Using full API response format');
  } else if (Array.isArray(apiResponse)) {
    // Redux store format (array of metrics)
    metrics = apiResponse;
    console.log('🔍 Using Redux store format (array)');
  } else {
    console.warn('⚠️ No metrics data in revenue channel response', apiResponse);
    return {
      merchant: { physical: 0, ecommerce: 0, physicalAbsolute: 0, ecommerceAbsolute: 0 },
      competitor: { physical: 0, ecommerce: 0, physicalAbsolute: 0, ecommerceAbsolute: 0 }
    };
  }
  console.log('🔍 All metrics received:', metrics.map(m => ({ metricID: m.metricID, merchantId: m.merchantId })));
  
  // Find revenue_by_channel metrics specifically
  const channelMetrics = metrics.filter(m => m.metricID === 'revenue_by_channel');
  console.log('🔍 Channel metrics found:', channelMetrics.length, channelMetrics);
  
  // Find merchant and competition data
  const merchantData = channelMetrics.find(m => m.merchantId !== 'competition');
  const competitionData = channelMetrics.find(m => m.merchantId === 'competition');
  
  console.log('🔍 Merchant channel data:', merchantData);
  console.log('🔍 Competition channel data:', competitionData);
  
  const result = {
    merchant: { physical: 0, ecommerce: 0, physicalAbsolute: 0, ecommerceAbsolute: 0 },
    competitor: { physical: 0, ecommerce: 0, physicalAbsolute: 0, ecommerceAbsolute: 0 }
  };
  
  // Process merchant data
  if (merchantData?.seriesValues?.[0]?.seriesPoints) {
    const merchantPoints = merchantData.seriesValues[0].seriesPoints;
    const merchantTotal = merchantPoints.reduce((sum, point) => sum + (parseFloat(point.value1) || 0), 0);
    
    merchantPoints.forEach(point => {
      const channel = point.value2;
      const absoluteValue = parseFloat(point.value1) || 0;
      const percentage = merchantTotal > 0 ? (absoluteValue / merchantTotal) * 100 : 0;
      
      if (channel === 'physical') {
        result.merchant.physical = percentage;
        result.merchant.physicalAbsolute = absoluteValue;
      } else if (channel === 'ecommerce') {
        result.merchant.ecommerce = percentage;
        result.merchant.ecommerceAbsolute = absoluteValue;
      }
    });
  }
  
  // Process competition data
  if (competitionData?.seriesValues?.[0]?.seriesPoints) {
    const competitionPoints = competitionData.seriesValues[0].seriesPoints;
    const competitionTotal = competitionPoints.reduce((sum, point) => sum + (parseFloat(point.value1) || 0), 0);
    
    competitionPoints.forEach(point => {
      const channel = point.value2;
      const absoluteValue = parseFloat(point.value1) || 0;
      const percentage = competitionTotal > 0 ? (absoluteValue / competitionTotal) * 100 : 0;
      
      if (channel === 'physical') {
        result.competitor.physical = percentage;
        result.competitor.physicalAbsolute = absoluteValue;
      } else if (channel === 'ecommerce') {
        result.competitor.ecommerce = percentage;
        result.competitor.ecommerceAbsolute = absoluteValue;
      }
    });
  }
  
  console.log('✅ Transformed channel breakdown data:', result);
  return result;
};

/**
 * Transform revenue scalar metrics API response to UI format for metric cards
 * @param {Object} apiResponse - API response with scalar metrics
 * @returns {Object} Object with metric ID as key and {merchant, competition} values
 */
export const transformRevenueScalarMetrics = (apiResponse) => {
  console.log('🔄 Transforming revenue scalar metrics:', apiResponse);
  
  // Handle both full API response and Redux store format
  let metrics;
  if (apiResponse?.payload?.metrics) {
    metrics = apiResponse.payload.metrics;
  } else if (Array.isArray(apiResponse)) {
    metrics = apiResponse;
  } else {
    console.warn('⚠️ No metrics data in scalar response', apiResponse);
    return {};
  }
  
  const result = {};
  
  // Group metrics by metricID
  const metricGroups = {};
  metrics.forEach(metric => {
    if (!metricGroups[metric.metricID]) {
      metricGroups[metric.metricID] = { merchant: 0, competition: null };
    }
    
    if (metric.merchantId === 'competition') {
      // Handle null values for Go For More metrics (merchant-only)
      metricGroups[metric.metricID].competition = metric.scalarValue === null ? null : (parseFloat(metric.scalarValue) || 0);
    } else {
      metricGroups[metric.metricID].merchant = parseFloat(metric.scalarValue) || 0;
    }
  });
  
  // Transform to standard format with value, change, valueType
  Object.keys(metricGroups).forEach(metricID => {
    const data = metricGroups[metricID];
    
    // Calculate percentage change (mock data for now - would come from API in production)
    const merchantChange = (Math.random() - 0.5) * 20; // -10% to +10%
    const competitionChange = (Math.random() - 0.5) * 20;
    
    result[metricID] = {
      merchant: {
        value: data.merchant || 0,
        change: merchantChange,
        valueType: metricID.includes('amount') || metricID.includes('revenue') ? 'currency' : 'number'
      },
      competition: data.competition !== null && data.competition !== undefined ? {
        value: data.competition || 0,
        change: competitionChange,
        valueType: metricID.includes('amount') || metricID.includes('revenue') ? 'currency' : 'number'
      } : null
    };
  });
  
  console.log('✅ Transformed scalar metrics:', result);
  return result;
};

/**
 * Main revenue transformation function
 * Routes different types of revenue data to appropriate transformers
 * @param {Object} apiResponse - API response
 * @param {String} dataType - Type of revenue data ('interests', 'channel', 'metrics', 'scalars')
 * @returns {Object} Transformed data
 */
export const transformRevenueData = (apiResponse, dataType = 'metrics') => {
  console.log(`🔄 Transforming revenue data (type: ${dataType})`);
  
  try {
    switch (dataType) {
      case 'interests':
        return transformRevenueByInterests(apiResponse);
      case 'channel':
        return transformRevenueByChannel(apiResponse);
      case 'scalars':
        return transformRevenueScalarMetrics(apiResponse);
      case 'metrics':
      default:
        // For regular metrics, just return the metrics array
        return apiResponse?.payload?.metrics || [];
    }
  } catch (error) {
    console.error(`❌ Revenue transformation failed for ${dataType}:`, error);
    return dataType === 'interests' ? [] : 
           dataType === 'channel' ? { merchant: { physical: 0, ecommerce: 0 }, competitor: { physical: 0, ecommerce: 0 } } :
           dataType === 'scalars' ? {} :
           [];
  }
};

/**
 * Validate revenue data structure
 * @param {Object} data - Transformed revenue data
 * @param {String} dataType - Type of data to validate
 * @returns {Boolean} Whether data is valid
 */
export const validateRevenueData = (data, dataType = 'metrics') => {
  switch (dataType) {
    case 'interests':
      return Array.isArray(data) && data.every(item => 
        typeof item.interest === 'string' &&
        typeof item.merchant === 'number' &&
        typeof item.competitor === 'number'
      );
    case 'channel':
      return data && 
        typeof data.merchant === 'object' && 
        typeof data.competitor === 'object' &&
        typeof data.merchant.physical === 'number' &&
        typeof data.merchant.ecommerce === 'number';
    case 'metrics':
    default:
      return Array.isArray(data);
  }
};

export default {
  transformRevenueData,
  transformRevenueByInterests,
  transformRevenueByChannel,
  transformRevenueScalarMetrics,
  validateRevenueData
};