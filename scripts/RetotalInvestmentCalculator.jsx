import React, { useState, useEffect, useMemo } from 'react';
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
  const [savedScenarios, setSavedScenarios] = useState({
    cash: { ...data.financing, type: 'cash', rate: 0, points: 0, term_months: 0 },
    conventional: { ...data.financing, type: 'conventional', rate: 0.07, points: 0.01, max_ltv: 0.8, term_months: 360 },
    hard_money: { ...data.financing, type: 'hard_money', rate: 0.12, points: 0.02, term_months: 12 },
    brrrr: { ...data.financing, type: 'brrrr', rate: 0.08, points: 0.015, term_months: 360 }
  });

  useEffect(() => {
    const storedUsage = localStorage.getItem('retotal_usage_count');
    const storedProStatus = localStorage.getItem('retotal_pro_status');
    const lastReset = localStorage.getItem('retotal_last_reset');
    const now = new Date();
    const lastResetDate = lastReset ? new Date(lastReset) : null;
    const shouldReset = !lastResetDate || now.getMonth() !== lastResetDate.getMonth();
    if (shouldReset) {
      localStorage.setItem('retotal_usage_count', '0');
      localStorage.setItem('retotal_last_reset', now.toISOString());
      setUsageCount(0);
    } else {
      setUsageCount(parseInt(storedUsage) || 0);
    }
    setIsPro(storedProStatus === 'true');
  }, []);

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

  const handleProUpgrade = () => {
    window.open('https://buy.stripe.com/test_your_payment_link', '_blank');
  };

  const activatePro = () => {
    setIsPro(true);
    setShowPaywall(false);
    localStorage.setItem('retotal_pro_status', 'true');
  };

  const getSmartDefaults = (type) => {
    const defaults = {
      cash: { rate: 0, points: 0, term_months: 0, flat_fees: 0 },
      conventional: { rate: 0.07, points: 0.01, term_months: 360, flat_fees: 500, max_ltv: 0.8 },
      hard_money: { rate: 0.12, points: 0.02, term_months: 12, flat_fees: 1500, max_ltv: 0.85, max_ltc: 0.9, max_arv: 0.7 },
      brrrr: { rate: 0.08, points: 0.015, term_months: 360, flat_fees: 750, max_ltv: 0.75 }
    };
    return defaults[type] || defaults.hard_money;
  };

  const estimatePropertyTaxes = (propertyValue, zipCode = '') => {
    const stateRates = {
      '90': 0.0075,
      '10': 0.006,
      '77': 0.0183,
      '33': 0.0083,
      default: 0.011
    };
    const zipPrefix = zipCode.substring(0, 2);
    const rate = stateRates[zipPrefix] || stateRates.default;
    return Math.round((propertyValue * rate) / 12);
  };

  const validateInputs = () => {
    const newWarnings = [];
    if (data.property.ctg < 0.1) {
      newWarnings.push({
        type: 'warning',
        message: 'Rehab contingency below 10% is risky. Consider 15-20% for older properties.'
      });
    }
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
    if (data.property.dom < 14) {
      newWarnings.push({
        type: 'warning',
        message: 'Less than 14 days on market is optimistic. Consider market conditions.'
      });
    }
    setWarnings(newWarnings);
  };

  useEffect(() => {
    const newFinancing = { ...savedScenarios[activeTab] };
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
  }, [activeTab, savedScenarios]);

  const calculations = useMemo(() => {
    const { property, financing, costs, disposition, risk } = data;
    const adjustedARV = property.arv * (1 + risk.price_slip / 100);
    const adjustedREB = property.reb * (1 + risk.reb_overrun / 100);
    const adjustedRehabDays = property.rehab_days + risk.time_overrun_days;
    const adjustedSellPrice = disposition.sell_price * (1 + risk.price_slip / 100);
    const buyerClosing = property.pp * costs.buyer_close_pct + costs.flat_buyer_fees;
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
    const pointsCost = loanAmount * financing.points;
    const lenderFees = financing.flat_fees;
    const aib = property.pp + adjustedREB * (1 + property.ctg) + buyerClosing + pointsCost + lenderFees;
    const hpDays = adjustedRehabDays + property.dom + property.sell_close_days;
    const hpMonths = Math.ceil(hpDays / 30);
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
        const rehabMonths = Math.ceil(adjustedRehabDays / 30);
        if (month <= rehabMonths && month <= financing.draws) {
          outstanding += drawAmount;
        }
        const monthlyInterest = outstanding * (financing.rate / 12);
        totalInterest += monthlyInterest;
        monthlyInterestBreakdown.push({ month, outstanding, interest: monthlyInterest });
      }
    }
    let extensionFee = 0;
    if (hpMonths > financing.term_months && financing.type !== 'cash') {
      const extensionMonths = hpMonths - financing.term_months;
      extensionFee = outstanding * 0.01 * extensionMonths;
    }
    const holdingCosts = hpMonths * (costs.taxes_mo + costs.ins_mo + costs.utils_mo + costs.hoa_mo + costs.misc_mo);
    const tfc = totalInterest + pointsCost + lenderFees + extensionFee;
    const tpc = aib + tfc + holdingCosts;
    const grossSale = adjustedSellPrice * (1 - disposition.concessions_pct);
    const sellerClosing = grossSale * (costs.agent_pct + costs.seller_close_pct) + costs.flat_seller_fees + disposition.staging_cleaning;
    const spn = grossSale - sellerClosing;
    const netProfit = spn - tpc;
    const downPayment = property.pp - loanAmount;
    const cashInvested = downPayment + buyerClosing + adjustedREB * financing.upfront_pct;
    const roi = cashInvested > 0 ? netProfit / cashInvested : 0;
    const annualizedROI = roi * (12 / hpMonths);
    const mom = cashInvested > 0 ? (netProfit + cashInvested) / cashInvested : 0;
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

  useEffect(() => {
    validateInputs();
  }, [data, calculations]);

  const getPlainEnglishSummary = () => {
    const { netProfit, roi, annualizedROI, cashInvested, breakevenSalePrice, hpMonths } = calculations;
    const sellPrice = data.disposition.sell_price;
    let profitEmoji = netProfit > 0 ? '💰' : '💸';
    let roiEmoji = roi > 0.2 ? '🚀' : roi > 0.1 ? '📈' : '😐';
    const timeframe = hpMonths === 1 ? '1 month' : `${hpMonths} months`;
    if (netProfit <= 0) {
      return `${profitEmoji} **This deal loses ${Math.abs(netProfit).toLocaleString()}**. You'd need to sell for at least **${Math.round(breakevenSalePrice).toLocaleString()}** just to break even.`;
    }
    return `${profitEmoji} If you sell at **${sellPrice.toLocaleString()}** in **${timeframe}**, you'll net **${netProfit.toLocaleString()} profit**. That's a **${(roi * 100).toFixed(1)}% ROI** on your **${cashInvested.toLocaleString()}** cash invested, or **${(annualizedROI * 100).toFixed(1)}% annualized**. ${roiEmoji}\n\n**Breakeven sale price:** ${Math.round(breakevenSalePrice).toLocaleString()}`;
  };

  const redFlags = useMemo(() => {
    const flags = [];
    const { financing, property } = data;
    const { loanAmount, netProfit, roi, annualizedROI, hpMonths } = calculations;
    const maxPossibleLoan = Math.min(
      financing.max_ltv * property.pp,
      financing.max_ltc * (property.pp + property.reb),
      financing.max_arv * property.arv
    );
    if (financing.type === 'hard_money' && loanAmount < maxPossibleLoan * 0.95) {
      flags.push(`Potential funding gap of $${(maxPossibleLoan - loanAmount).toLocaleString()}`);
    }
    if (hpMonths > financing.term_months && financing.type !== 'cash') {
      flags.push(`Holding period (${hpMonths}mo) exceeds loan term (${financing.term_months}mo)`);
    }
    if (netProfit < 25000) {
      flags.push(`Net profit $${netProfit.toLocaleString()} below $25k target`);
    }
    if (roi < 0.2) {
      flags.push(`ROI ${(roi * 100).toFixed(1)}% below 20% threshold`);
    }
    if (annualizedROI < 0.3) {
      flags.push(`Annualized ROI ${(annualizedROI * 100).toFixed(1)}% below 30% threshold`);
    }
    if (property.ctg < 0.1) {
      flags.push('Rehab contingency below 10% - consider increasing for older properties');
    }
    return flags;
  }, [data, calculations]);

  const updateField = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    if (section === 'financing') {
      setSavedScenarios(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [field]: value
        }
      }));
    }
    if (section === 'property' && field === 'zip_code') {
      const estimatedTaxes = estimatePropertyTaxes(data.property.pp, value);
      setData(prev => ({
        ...prev,
        costs: {
          ...prev.costs,
          taxes_mo: estimatedTaxes
        }
      }));
    }
  };

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

  const sensitivityData = useMemo(() => {
    const baseData = { ...data };
    const scenarios = [];
    for (let i = -10; i <= 10; i += 5) {
      const adjustedSellPrice = baseData.disposition.sell_price * (1 + i / 100);
      const netProfitAdjusted = calculations.netProfit + (adjustedSellPrice - baseData.disposition.sell_price) * 0.94;
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

      {/* Rest of component omitted for brevity in this snippet */}
    </div>
  );
};

export default RetotalInvestmentCalculator;
