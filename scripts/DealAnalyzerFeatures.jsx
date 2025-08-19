import React from 'react';

export default function DealAnalyzerFeatures() {
  return (
    <section className="py-12 px-4 md:px-12 bg-white text-gray-800">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center">
        💼 <span className="ml-2">Experience the Power of Smart Real Estate Analysis</span>
      </h2>
      <p className="text-gray-600 mb-8 max-w-xl">
        Instantly evaluate any deal with AI-powered insights, personalized projections, and professional-grade analysis.
      </p>
      <ul className="space-y-6">
        <li className="flex items-start">
          <span className="text-2xl mr-3">⚡</span>
          <div>
            <p className="font-semibold">Real-Time ROI & Cash Flow Projections</p>
            <p className="text-gray-600">Know exactly what you'll earn—monthly and annually—based on your strategy.</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-2xl mr-3">🧠</span>
          <div>
            <p className="font-semibold">AI-Powered Deal Scoring</p>
            <p className="text-gray-600">Get a smart investment score that considers risk, ROI, and strategy alignment.</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-2xl mr-3">💰</span>
          <div>
            <p className="font-semibold">Hard Money & Traditional Loan Modeling</p>
            <p className="text-gray-600">Simulate real-world financing using built-in lender terms and repayment structures.</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-2xl mr-3">📍</span>
          <div>
            <p className="font-semibold">
              Location-Based Market Comparisons <span className="italic text-sm text-yellow-500">(Coming Soon)</span>
            </p>
            <p className="text-gray-600">Analyze comps and pricing trends based on actual property data.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}

