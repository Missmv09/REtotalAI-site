import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, BarChart3, Settings, ArrowLeft, Save, Download } from 'lucide-react';

const RetotalInvestmentCalculator = () => {
  const [activeTab, setActiveTab] = useState('hard_money');
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const FREE_LIMIT = 3;
  
  const [data, setData] = useState({
    property: {
      pp: 250000,
      arv: 360000,
      reb: 60000,
      ctg: 0.15,
      rehab_days: 60,
      dom: 30,
      sell_close_days: 14,
      zip_code: ''
    },
    financing: {
      type: 'hard_money',
      rate: 0.12,
      points: 0.02,
      term_months: 12,
      max_ltv: 0.85,
      max_ltc: 0.9,
      max_arv: 0.7,
      flat_fees: 1500,
      draws: 4,
      interest_type: 'interest_only',
      upfront_pct: 0.5
    },
    costs: {
      buyer_close_pct: 0.025,
      seller_close_pct: 0.015,
      agent_pct: 0.055,
      taxes_mo: 300,
      ins_mo: 120,
      utils_mo: 200,
      hoa_mo: 0,
      misc_mo: 100,
      flat_buyer_fees: 0,
      flat_seller_fees: 0
    },
    disposition: {
      sell_price: 360000,
      concessions_pct: 0.01,
      staging_cleaning: 2000
    },
    risk: {
      price_slip: 0,
      reb_overrun: 0,
      time_overrun_days: 0
    }
  });

  const [warnings, setWarnings] = useState([]);

  // Check usage and pro status on load
  useEffect(() => {
    const storedUsage = localStorage.getItem('retotal_usage_count');
    const storedProStatus = localStorage.getItem('retotal_pro_status');
    const lastReset = localStorage.getItem('retotal_last_reset');
    
    // Reset monthly (simple version)
    const now = new Date();
    const lastResetDate = lastReset ? new Date(lastReset) : null;
    const shouldReset = !lastResetDate || (now.getMonth() !== lastResetDate.getMonth());
    
    if (shouldReset) {
      localStorage.setItem('retotal_usage_count', '0');
      localStorage.setItem('retotal_last_reset', now.toISOString());
      setUsageCount(0);
    } else {
      setUsageCount(parseInt(storedUsage) || 0);
    }
    
    setIsPro(storedProStatus === 'true');
  }, []);

  // Track usage when analysis is viewed
  const trackUsage = () => {
    if (!isPro) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('retotal_usage_count', newCount.toString());
      
      if (newCount >= FREE_LIMIT) {
        setShowPaywall(true);
      }
    }
  };

  // Handle pro upgrade
  const handleProUpgrade = () => {
    // In production, this would integrate with Stripe
    // For now, we'll simulate it
    window.open('https://buy.stripe.com/test_your_payment_link', '_blank');
  };

  // Simulate pro activation (for testing)
  const activatePro = () => {
    setIsPro(true);
    setShowPaywall(false);
    localStorage.setItem('retotal_pro_status', 'true');
  };

  const [savedScenarios, setSavedScenarios] = useState({
    cash: { type: 'cash', rate: 0, points: 0, term_months: 0, flat_fees: 0 },
    conventional: { type: 'conventional', rate: 0.07, points: 0.01, max_ltv: 0.8, term_months: 360, flat_fees: 500 },
    hard_money: { type: 'hard_money', rate: 0.12, points: 0.02, term_months: 12, flat_fees: 1500, max_ltv: 0.85, max_ltc: 0.9, max_arv: 0.7 },
    brrrr: { type: 'brrrr', rate: 0.08, points: 0.015, term_months: 360, flat_fees: 750, max_ltv: 0.75 }
  });

  // Smart defaults and warnings
  const getSmartDefaults = useCallback((type) => {
    const defaults = {
      cash: { rate: 0, points: 0, term_months: 0, flat_fees: 0 },
      conventional: { rate: 0.07, points: 0.01, term_months: 360, flat_fees: 500, max_ltv: 0.8 },
      hard_money: { rate: 0.12, points: 0.02, term_months: 12, flat_fees: 1500, max_ltv: 0.85, max_ltc: 0.9, max_arv: 0.7 },
      brrrr: { rate: 0.08, points: 0.015, term_months: 360, flat_fees: 750, max_ltv: 0.75 }
    };
    return defaults[type] || defaults.hard_money;
  }, []);

  // Auto-populate property taxes based on ZIP or property value
  const estimatePropertyTaxes = useCallback((propertyValue, zipCode = '') => {
    // National average is ~1.1% annually, but varies by state
    const stateRates = {
      '90': 0.0075, // CA
      '10': 0.006,  // NY
      '77': 0.0183, // TX
      '33': 0.0083, // FL
      default: 0.011
    };

    const zipPrefix = zipCode.substring(0, 2);
    const rate = stateRates[zipPrefix] || stateRates.default;
    return Math.round((propertyValue * rate) / 12);
  }, []);

  // Core calculations
  const calculations = useMemo(() => {
    const { property, financing, costs, disposition, risk } = data;
    
    // Apply risk adjustments
    const adjustedARV = property.arv * (1 + risk.price_slip / 100);
    const adjustedREB = property.reb * (1 + risk.reb_overrun / 100);
    const adjustedRehabDays = property.rehab_days + risk.time_overrun_days;
    const adjustedSellPrice = disposition.sell_price * (1 + risk.price_slip / 100);
    
    // Buyer closing costs
    const buyerClosing = property.pp * costs.buyer_close_pct + costs.flat_buyer_fees;
    
    // Loan calculations
    let loanAmount = 0;
    if (financing.type === 'cash') {
      loanAmount = 0;
    } else if (financing.type === 'conventional' || financing.type === 'brrrr') {
      loanAmount = financing.max_ltv * property.pp;
    } else if (financing.type === 'hard_money') {
      const ltvLimit = financing.max_ltv * property.pp;
      const ltcLimit = financing.max_ltc * (property.pp + adjustedREB);
      const arvLimit = financing.max_arv * adjustedARV;
      loanAmount = Math.min(ltvLimit, ltcLimit, arvLimit);
    }
    
    // Points and lender costs
    const pointsCost = loanAmount * financing.points;
    const lenderFees = financing.flat_fees;
    
    // All-in basis
    const aib = property.pp + adjustedREB * (1 + property.ctg) + buyerClosing + pointsCost + lenderFees;
    
    // Holding period
    const hpDays = adjustedRehabDays + property.dom + property.sell_close_days;
    const hpMonths = Math.ceil(hpDays / 30);
    
    // Interest calculation with draw modeling
    let totalInterest = 0;
    let outstanding = 0;
    const monthlyInterestBreakdown = [];
    
    if (financing.type !== 'cash') {
      const upfrontAmount = loanAmount * financing.upfront_pct;
      const drawAmount = (loanAmount - upfrontAmount) / financing.draws;
      
      for (let month = 1; month <= hpMonths; month++) {
        if (month === 1) {
          outstanding += upfrontAmount;
        }
        
        // Add draws during rehab period
        const rehabMonths = Math.ceil(adjustedRehabDays / 30);
        if (month <= rehabMonths && month <= financing.draws) {
          outstanding += drawAmount;
        }
        
        const monthlyInterest = outstanding * (financing.rate / 12);
        totalInterest += monthlyInterest;
        monthlyInterestBreakdown.push({ month, outstanding, interest: monthlyInterest });
      }
    }
    
    // Extension fees if term exceeded
    let extensionFee = 0;
    if (hpMonths > financing.term_months && financing.type !== 'cash') {
      const extensionMonths = hpMonths - financing.term_months;
      extensionFee = outstanding * 0.01 * extensionMonths; // 1 point per month
    }
    
    // Holding costs
    const holdingCosts = hpMonths * (costs.taxes_mo + costs.ins_mo + costs.utils_mo + costs.hoa_mo + costs.misc_mo);
    
    // Total financing cost
    const tfc = totalInterest + pointsCost + lenderFees + extensionFee;
    
    // Total project cost
    const tpc = aib + tfc + holdingCosts;
    
    // Sale proceeds
    const grossSale = adjustedSellPrice * (1 - disposition.concessions_pct);
    const sellerClosing = grossSale * (costs.agent_pct + costs.seller_close_pct) + costs.flat_seller_fees + disposition.staging_cleaning;
    const spn = grossSale - sellerClosing;
    
    // Net profit
    const netProfit = spn - tpc;
    
    // Cash invested
    const downPayment = property.pp - loanAmount;
    const cashInvested = downPayment + (buyerClosing - (loanAmount > 0 ? 0 : 0)) + (adjustedREB * financing.upfront_pct);
    
    // Returns
    const roi = cashInvested > 0 ? netProfit / cashInvested : 0;
    const annualizedROI = roi * (12 / hpMonths);
    const mom = cashInvested > 0 ? (netProfit + cashInvested) / cashInvested : 0;
    
    // Breakeven calculation
    const fixedCosts = tpc - grossSale + sellerClosing;
    const breakevenSalePrice = fixedCosts / (1 - disposition.concessions_pct - costs.agent_pct - costs.seller_close_pct);
    
    return {
      loanAmount,
      aib,
      tfc,
      holdingCosts,
      tpc,
      spn,
      netProfit,
      cashInvested,
      roi,
      annualizedROI,
      mom,
      hpMonths,
      hpDays,
      breakevenSalePrice,
      totalInterest,
      pointsCost,
      lenderFees,
      extensionFee,
      monthlyInterestBreakdown,
      grossSale,
      sellerClosing,
      adjustedARV,
      adjustedREB
    };
  }, [data]);

  // Validate inputs and generate warnings
  const validateInputs = useCallback(() => {
    const newWarnings = [];
    
    // Contingency warnings
    if (data.property.ctg < 0.1) {
      newWarnings.push({
        type: 'warning',
        message: 'Rehab contingency below 10% is risky. Consider 15-20% for older properties.'
      });
    }
    
    // Agent commission warnings
    if (data.costs.agent_pct < 0.05) {
      newWarnings.push({
        type: 'warning',
        message: 'Agent commission below 5% may not attract quality agents.'
      });
    }
    if (data.costs.agent_pct > 0.07) {
      newWarnings.push({
        type: 'info',
        message: 'Agent commission above 7% is unusually high for most markets.'
      });
    }
    
    // Loan term vs holding period
    if (calculations.hpMonths > data.financing.term_months && data.financing.type !== 'cash') {
      newWarnings.push({
        type: 'error',
        message: `⚠️ Project timeline (${calculations.hpMonths} months) exceeds loan term (${data.financing.term_months} months). Extension fees will apply!`
      });
    }
    
    // Hard money specific warnings
    if (data.financing.type === 'hard_money') {
      if (data.financing.rate < 0.08 || data.financing.rate > 0.18) {
        newWarnings.push({
          type: 'warning',
          message: 'Hard money rates typically range from 8-18%. Verify your rate is accurate.'
        });
      }
      
      if (calculations.loanAmount === 0) {
        newWarnings.push({
          type: 'error',
          message: 'No loan amount calculated. Check your LTV/LTC/ARV limits.'
        });
      }
    }
    
    // ROI warnings
    if (calculations.roi < 0.15) {
      newWarnings.push({
        type: 'warning',
        message: 'ROI below 15% may not justify the risk for fix & flip projects.'
      });
    }
    
    // Days on market warning
    if (data.property.dom < 14) {
      newWarnings.push({
        type: 'warning',
        message: 'Less than 14 days on market is optimistic. Consider market conditions.'
      });
    }
    
    setWarnings(newWarnings);
  }, [calculations, data]);

  // Update financing when tab changes
  useEffect(() => {
    const newFinancing = { ...savedScenarios[activeTab] };
    // Apply smart defaults
    const defaults = getSmartDefaults(activeTab);
    Object.keys(defaults).forEach(key => {
      if (newFinancing[key] === undefined) {
        newFinancing[key] = defaults[key];
      }
    });

    setData(prev => ({
      ...prev,
      financing: newFinancing
    }));
  }, [activeTab, getSmartDefaults, savedScenarios]);

  // Validate inputs whenever data changes
  useEffect(() => {
    validateInputs();
  }, [validateInputs]);

  // Auto-update property taxes when ZIP or property value changes
  useEffect(() => {
    if (data.property.zip_code || data.property.pp) {
      const estimatedTaxes = estimatePropertyTaxes(data.property.pp, data.property.zip_code);
      if (Math.abs(estimatedTaxes - data.costs.taxes_mo) > 50) {
        updateField('costs', 'taxes_mo', estimatedTaxes);
      }
    }
  }, [data.costs.taxes_mo, data.property.pp, data.property.zip_code, estimatePropertyTaxes, updateField]);

  // Plain English explanation
  const getPlainEnglishSummary = () => {
    const { netProfit, roi, annualizedROI, cashInvested, breakevenSalePrice, hpMonths } = calculations;
    const sellPrice = data.disposition.sell_price;
    
    let profitEmoji = netProfit > 0 ? '💰' : '💸';
    let roiEmoji = roi > 0.2 ? '🚀' : roi > 0.1 ? '📈' : '😐';
    
    const timeframe = hpMonths === 1 ? '1 month' : `${hpMonths} months`;
    
    if (netProfit <= 0) {
      return `${profitEmoji} **This deal loses $${Math.abs(netProfit).toLocaleString()}**. You'd need to sell for at least **$${Math.round(breakevenSalePrice).toLocaleString()}** just to break even.`;
    }
    
    return `${profitEmoji} If you sell at **$${sellPrice.toLocaleString()}** in **${timeframe}**, you'll net **$${netProfit.toLocaleString()} profit**. That's a **${(roi * 100).toFixed(1)}% ROI** on your **$${cashInvested.toLocaleString()}** cash invested, or **${(annualizedROI * 100).toFixed(1)}% annualized**. ${roiEmoji}

**Breakeven sale price:** $${Math.round(breakevenSalePrice).toLocaleString()}`;
  };

  // Red flag checks
  const redFlags = useMemo(() => {
    const flags = [];
    const { financing, property } = data;
    const { loanAmount, netProfit, roi, annualizedROI, hpMonths } = calculations;
    
    // Funding gap check
    const maxPossibleLoan = Math.min(
      financing.max_ltv * property.pp,
      financing.max_ltc * (property.pp + property.reb),
      financing.max_arv * property.arv
    );
    if (financing.type === 'hard_money' && loanAmount < maxPossibleLoan * 0.95) {
      flags.push(`Potential funding gap of $${(maxPossibleLoan - loanAmount).toLocaleString()}`);
    }
    
    // Term exceeded
    if (hpMonths > financing.term_months && financing.type !== 'cash') {
      flags.push(`Holding period (${hpMonths}mo) exceeds loan term (${financing.term_months}mo)`);
    }
    
    // Low profit
    if (netProfit < 25000) {
      flags.push(`Net profit $${netProfit.toLocaleString()} below $25k target`);
    }
    
    // Low returns
    if (roi < 0.2) {
      flags.push(`ROI ${(roi * 100).toFixed(1)}% below 20% threshold`);
    }
    if (annualizedROI < 0.3) {
      flags.push(`Annualized ROI ${(annualizedROI * 100).toFixed(1)}% below 30% threshold`);
    }
    
    // Low contingency
    if (property.ctg < 0.1) {
      flags.push('Rehab contingency below 10% - consider increasing for older properties');
    }
    
    return flags;
  }, [data, calculations]);

  const updateField = useCallback((section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Save scenario when financing changes
    if (section === 'financing') {
      setSavedScenarios(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [field]: value
        }
      }));
    }
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  // Sensitivity analysis
  const sensitivityData = useMemo(() => {
    const baseData = { ...data };
    const scenarios = [];
    
    // Price sensitivity
    for (let i = -10; i <= 10; i += 5) {
      const testData = {
        ...baseData,
        risk: { ...baseData.risk, price_slip: i }
      };
      // Recalculate with adjusted data (simplified)
      const adjustedSellPrice = baseData.disposition.sell_price * (1 + i / 100);
      const netProfitAdjusted = calculations.netProfit + (adjustedSellPrice - baseData.disposition.sell_price) * 0.94; // Rough approximation
      scenarios.push({
        type: 'Price',
        change: `${i > 0 ? '+' : ''}${i}%`,
        netProfit: netProfitAdjusted,
        roi: netProfitAdjusted / calculations.cashInvested
      });
    }
    
    return scenarios;
  }, [data, calculations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Pro</h2>
            <p className="text-gray-600 mb-4">
              You've used your {FREE_LIMIT} free analyses this month! 
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Pro Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Unlimited deal analyses</li>
                <li>✅ Save & export reports</li>
                <li>✅ Advanced BRRRR modeling</li>
                <li>✅ Portfolio tracking</li>
                <li>✅ Priority support</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleProUpgrade}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro - $49/month
              </button>
              
              {/* Demo button - remove in production */}
              <button
                onClick={activatePro}
                className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                Demo: Activate Pro (Testing Only)
              </button>
              
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full text-gray-500 hover:text-gray-700 text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <Calculator className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Deal Analyzer Pro</h1>
                <p className="text-gray-600">Advanced Real Estate Investment Calculator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Usage Counter */}
              <div className="text-sm text-gray-600">
                {isPro ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    💎 Pro User
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {usageCount}/{FREE_LIMIT} free analyses
                  </span>
                )}
              </div>
              
              {!isPro && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
              
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Save className="w-4 h-4" />
                Save Analysis
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Scenario Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              {[
                { key: 'cash', label: 'All Cash', icon: '💰' },
                { key: 'hard_money', label: 'Hard Money', icon: '⚡' },
                { key: 'conventional', label: 'Conventional', icon: '🏦' },
                { key: 'brrrr', label: 'BRRRR', icon: '🔄' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Property Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">🏠</span>
                Property Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      value={data.property.pp}
                      onChange={(e) => updateField('property', 'pp', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="250000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code 
                      <span className="text-xs text-gray-500 ml-1">(for tax estimates)</span>
                    </label>
                    <input
                      type="text"
                      value={data.property.zip_code}
                      onChange={(e) => updateField('property', 'zip_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="90210"
                      maxLength="5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ARV (After Repair Value)</label>
                    <input
                      type="number"
                      value={data.property.arv}
                      onChange={(e) => updateField('property', 'arv', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="360000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rehab Budget</label>
                    <input
                      type="number"
                      value={data.property.reb}
                      onChange={(e) => updateField('property', 'reb', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="60000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contingency %
                    <span className="text-xs text-gray-500 ml-1">(Recommended: 15-20%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.property.ctg}
                    onChange={(e) => updateField('property', 'ctg', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0.15"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rehab Days</label>
                    <input
                      type="number"
                      value={data.property.rehab_days}
                      onChange={(e) => updateField('property', 'rehab_days', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Days on Market</label>
                    <input
                      type="number"
                      value={data.property.dom}
                      onChange={(e) => updateField('property', 'dom', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Close Days</label>
                    <input
                      type="number"
                      value={data.property.sell_close_days}
                      onChange={(e) => updateField('property', 'sell_close_days', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="14"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financing Section */}
            {activeTab !== 'cash' && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-green-600">💳</span>
                  {activeTab === 'hard_money' ? 'Hard Money Loan Terms' : 'Financing Terms'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interest Rate %
                        {activeTab === 'hard_money' && <span className="text-xs text-gray-500 ml-1">(Typical: 10-15%)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={data.financing.rate}
                        onChange={(e) => updateField('financing', 'rate', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={activeTab === 'hard_money' ? '0.12' : '0.07'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points %
                        {activeTab === 'hard_money' && <span className="text-xs text-gray-500 ml-1">(Typical: 2-4%)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={data.financing.points}
                        onChange={(e) => updateField('financing', 'points', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={activeTab === 'hard_money' ? '0.02' : '0.01'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term (months)
                        {activeTab === 'hard_money' && <span className="text-xs text-gray-500 ml-1">(Typical: 6-18mo)</span>}
                      </label>
                      <input
                        type="number"
                        value={data.financing.term_months}
                        onChange={(e) => updateField('financing', 'term_months', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={activeTab === 'hard_money' ? '12' : '360'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeTab === 'hard_money' ? 'Rehab Draws' : 'Loan Type'}
                      </label>
                      {activeTab === 'hard_money' ? (
                        <input
                          type="number"
                          value={data.financing.draws}
                          onChange={(e) => updateField('financing', 'draws', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="4"
                        />
                      ) : (
                        <select
                          value={data.financing.interest_type}
                          onChange={(e) => updateField('financing', 'interest_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="amortizing">30yr Amortizing</option>
                          <option value="interest_only">Interest Only</option>
                        </select>
                      )}
                    </div>
                  </div>
                  {activeTab === 'hard_money' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Hard Money Lending Limits</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Max LTV %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={data.financing.max_ltv}
                              onChange={(e) => updateField('financing', 'max_ltv', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="0.85"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Max LTC %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={data.financing.max_ltc}
                              onChange={(e) => updateField('financing', 'max_ltc', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="0.9"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Max ARV %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={data.financing.max_arv}
                              onChange={(e) => updateField('financing', 'max_arv', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="0.7"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          <strong>LTV:</strong> Loan-to-Value | <strong>LTC:</strong> Loan-to-Cost | <strong>ARV:</strong> After Repair Value
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upfront Funding %</label>
                          <input
                            type="number"
                            step="0.01"
                            value={data.financing.upfront_pct}
                            onChange={(e) => updateField('financing', 'upfront_pct', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="0.5"
                          />
                          <p className="text-xs text-gray-500 mt-1">Percentage funded at closing</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Draw Schedule</label>
                          <select
                            value={data.financing.draw_schedule || 'equal'}
                            onChange={(e) => updateField('financing', 'draw_schedule', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="equal">Equal Draws</option>
                            <option value="milestone">Milestone Based</option>
                            <option value="percentage">Percentage Complete</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lender Fees
                      {activeTab === 'hard_money' && <span className="text-xs text-gray-500 ml-1">(Doc fees, underwriting, etc.)</span>}
                    </label>
                    <input
                      type="number"
                      value={data.financing.flat_fees}
                      onChange={(e) => updateField('financing', 'flat_fees', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={activeTab === 'hard_money' ? '1500' : '500'}
                    />
                  </div>
                  {activeTab === 'hard_money' && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>💡 Hard Money Tip:</strong> Interest typically accrues only on funded amounts. 
                        Extension fees (~1 point/month) apply if project exceeds term.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Costs Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-600">💸</span>
                Costs & Fees
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buyer Close %
                      <span className="text-xs text-gray-500 ml-1">(Typical: 2-3%)</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={data.costs.buyer_close_pct}
                      onChange={(e) => updateField('costs', 'buyer_close_pct', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Commission %
                      <span className="text-xs text-gray-500 ml-1">(Typical: 5-6%)</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={data.costs.agent_pct}
                      onChange={(e) => updateField('costs', 'agent_pct', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0.055"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Taxes/mo
                      {data.property.zip_code && <span className="text-xs text-green-600 ml-1">✓ Auto-estimated</span>}
                    </label>
                    <input
                      type="number"
                      value={data.costs.taxes_mo}
                      onChange={(e) => updateField('costs', 'taxes_mo', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance/mo
                      <span className="text-xs text-gray-500 ml-1">(Typical: $100-200)</span>
                    </label>
                    <input
                      type="number"
                      value={data.costs.ins_mo}
                      onChange={(e) => updateField('costs', 'ins_mo', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="120"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Utilities/mo
                      <span className="text-xs text-gray-500 ml-1">(During rehab)</span>
                    </label>
                    <input
                      type="number"
                      value={data.costs.utils_mo}
                      onChange={(e) => updateField('costs', 'utils_mo', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Misc/mo
                      <span className="text-xs text-gray-500 ml-1">(Security, etc.)</span>
                    </label>
                    <input
                      type="number"
                      value={data.costs.misc_mo}
                      onChange={(e) => updateField('costs', 'misc_mo', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Adjustments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Adjustments</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Slip % (±)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={data.risk.price_slip}
                    onChange={(e) => updateField('risk', 'price_slip', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rehab Overrun % (±)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={data.risk.reb_overrun}
                    onChange={(e) => updateField('risk', 'reb_overrun', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Overrun (days)</label>
                  <input
                    type="number"
                    value={data.risk.time_overrun_days}
                    onChange={(e) => updateField('risk', 'time_overrun_days', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plain English Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600">💬</span>
                Deal Summary (Plain English)
                {!isPro && usageCount === 0 && (
                  <button
                    onClick={trackUsage}
                    className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Analyze Deal
                  </button>
                )}
              </h3>
              {(isPro || usageCount > 0) ? (
                <div className="prose prose-sm text-gray-700" dangerouslySetInnerHTML={{
                  __html: getPlainEnglishSummary().replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                }} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-600 mb-4">
                    Click "Analyze Deal" to see your personalized summary and detailed calculations.
                  </p>
                  <p className="text-sm text-gray-500">
                    Free users get {FREE_LIMIT} analyses per month • Pro users get unlimited
                  </p>
                </div>
              )}
            </div>

            {/* Smart Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-3">
                {warnings.map((warning, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    warning.type === 'error' ? 'bg-red-50 border-red-200' :
                    warning.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        warning.type === 'error' ? 'text-red-600' :
                        warning.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {warning.type === 'error' ? '🚨' : warning.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </div>
                      <p className={`text-sm ${
                        warning.type === 'error' ? 'text-red-800' :
                        warning.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {warning.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Net Profit</span>
                </div>
                <div className={`text-2xl font-bold ${calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.netProfit)}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">ROI</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercent(calculations.roi)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPercent(calculations.annualizedROI)} annualized
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Cash Invested</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(calculations.cashInvested)}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Breakeven Price</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(calculations.breakevenSalePrice)}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Hold Period</span>
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {calculations.hpMonths}mo
                </div>
                <div className="text-sm text-gray-500">
                  {calculations.hpDays} days
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-600">MoM Multiple</span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {calculations.mom.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Cost Waterfall */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">All-in Basis</span>
                  <span className="font-semibold">{formatCurrency(calculations.aib)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Financing Cost</span>
                  <span className="font-semibold">{formatCurrency(calculations.tfc)}</span>
                </div>
                <div className="ml-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Interest</span>
                    <span>{formatCurrency(calculations.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points</span>
                    <span>{formatCurrency(calculations.pointsCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lender Fees</span>
                    <span>{formatCurrency(calculations.lenderFees)}</span>
                  </div>
                  {calculations.extensionFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Extension Fees</span>
                      <span>{formatCurrency(calculations.extensionFee)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Holding Costs</span>
                  <span className="font-semibold">{formatCurrency(calculations.holdingCosts)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                  <span className="text-gray-600">Total Project Cost</span>
                  <span className="font-bold text-lg">{formatCurrency(calculations.tpc)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Sale Proceeds (Net)</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculations.spn)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded">
                  <span className="font-semibold text-gray-900">Net Profit</span>
                  <span className={`font-bold text-xl ${calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(calculations.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Additional Risk Alerts</h3>
                </div>
                <ul className="space-y-2">
                  {redFlags.map((flag, index) => (
                    <li key={index} className="text-red-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sensitivity Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensitivity Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Price Change</th>
                      <th className="text-right py-2">Net Profit</th>
                      <th className="text-right py-2">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityData.filter(s => s.type === 'Price').map((scenario, index) => (
                      <tr key={index} className={scenario.change === '0%' ? 'bg-blue-50 font-medium' : ''}>
                        <td className="py-1">{scenario.change}</td>
                        <td className={`text-right py-1 ${scenario.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenario.netProfit)}
                        </td>
                        <td className="text-right py-1">{formatPercent(scenario.roi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetotalInvestmentCalculator;

