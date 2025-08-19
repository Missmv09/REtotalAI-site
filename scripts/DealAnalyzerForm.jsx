import React, { useState } from 'react';

const initialState = {
  propertyAddress: '',
  purchasePrice: '',
  arv: '',
  monthlyRent: '',
  investmentStrategy: 'Buy & Hold',
  financingType: 'Traditional',
  traditional: {
    downPayment: 20,
    interestRate: 6.5,
    loanTerm: 30,
    operatingExpenses: 35,
  },
  hardMoney: {
    loanAmountPercent: 85,
    points: 2,
    interestRate: 12,
    rehabBudget: '',
    rehabTimeline: 6,
    exitStrategy: 'Sell after rehab',
  },
};

export default function DealAnalyzerForm() {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleNestedChange = (section, field) => (e) => {
    setFormData({
      ...formData,
      [section]: { ...formData[section], [field]: e.target.value },
    });
  };

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      console.log(formData);
      setLoading(false);
    }, 1000);
  };

  const isTraditional = formData.financingType === 'Traditional';

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Property Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property Address</label>
            <input
              type="text"
              value={formData.propertyAddress}
              onChange={handleChange('propertyAddress')}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Price</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l border bg-gray-50 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={handleChange('purchasePrice')}
                  className="w-full border rounded-r p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">After Repair Value (ARV)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l border bg-gray-50 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.arv}
                  onChange={handleChange('arv')}
                  className="w-full border rounded-r p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (if Buy & Hold)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l border bg-gray-50 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={handleChange('monthlyRent')}
                  className="w-full border rounded-r p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Investment Strategy</label>
              <select
                value={formData.investmentStrategy}
                onChange={handleChange('investmentStrategy')}
                className="w-full border rounded p-2"
              >
                <option>Buy & Hold</option>
                <option>Fix & Flip</option>
                <option>BRRRR</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Financing Type</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="Traditional"
                    checked={isTraditional}
                    onChange={handleChange('financingType')}
                  />
                  Traditional
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="Hard Money"
                    checked={!isTraditional}
                    onChange={handleChange('financingType')}
                  />
                  Hard Money
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">Financing</h2>
        {isTraditional ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Down Payment (%)</label>
              <input
                type="number"
                value={formData.traditional.downPayment}
                onChange={handleNestedChange('traditional', 'downPayment')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={formData.traditional.interestRate}
                onChange={handleNestedChange('traditional', 'interestRate')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loan Term (Years)</label>
              <input
                type="number"
                value={formData.traditional.loanTerm}
                onChange={handleNestedChange('traditional', 'loanTerm')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operating Expenses (% of rent)</label>
              <input
                type="number"
                value={formData.traditional.operatingExpenses}
                onChange={handleNestedChange('traditional', 'operatingExpenses')}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loan Amount (% of Purchase Price)</label>
              <input
                type="number"
                value={formData.hardMoney.loanAmountPercent}
                onChange={handleNestedChange('hardMoney', 'loanAmountPercent')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points Charged (%)</label>
              <input
                type="number"
                value={formData.hardMoney.points}
                onChange={handleNestedChange('hardMoney', 'points')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={formData.hardMoney.interestRate}
                onChange={handleNestedChange('hardMoney', 'interestRate')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rehab Budget</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l border bg-gray-50 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.hardMoney.rehabBudget}
                  onChange={handleNestedChange('hardMoney', 'rehabBudget')}
                  className="w-full border rounded-r p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rehab Timeline (Months)</label>
              <input
                type="number"
                value={formData.hardMoney.rehabTimeline}
                onChange={handleNestedChange('hardMoney', 'rehabTimeline')}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Strategy</label>
              <select
                value={formData.hardMoney.exitStrategy}
                onChange={handleNestedChange('hardMoney', 'exitStrategy')}
                className="w-full border rounded p-2"
              >
                <option>Sell after rehab</option>
                <option>Refinance to Buy & Hold</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded flex items-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          <span>Analyze Property</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow mt-8">
        <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
        <p>ROI: —%</p>
        <p>Monthly Cash Flow (if Buy & Hold): —</p>
        <p>Total Project Cost: —</p>
        <p>Profit on Sale: —</p>
        <p>Cap Rate: —%</p>
        <p>Investment Score: —/10</p>
      </div>
    </div>
  );
}

