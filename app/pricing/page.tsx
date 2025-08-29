'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      // Get current fingerprint from sessionStorage
      const fingerprint = sessionStorage.getItem('shotpack_fp');
      
      // Redirect to Stripe Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fingerprint }),
      });
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a free pack to test our AI, then upgrade for unlimited professional photo generation.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          
          {/* Free Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600">Perfect to try ShotPack</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">1 photo pack (6 variations)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">1024px resolution</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">3 background styles</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Generation history</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">No login or card required</span>
              </li>
            </ul>

            <Link 
              href="/generate"
              className="block w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-center"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-xl border-2 border-blue-500 p-8 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most popular
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$7</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600">For professional creators</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Unlimited photo packs</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Custom scene prompts</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">2048px high-resolution</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Priority processing</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Commercial license</span>
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          </div>
        </div>

        {/* Custom Prompts Feature */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Custom Scene Prompts
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pro users can describe any scene they want. Instead of being limited to our preset styles, 
              create unique backgrounds that perfectly match your brand vision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-600 italic">"floating on dreamy clouds"</p>
              </div>
              <p className="text-sm text-gray-500">Luxury & wellness products</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-600 italic">"rustic kitchen with warm light"</p>
              </div>
              <p className="text-sm text-gray-500">Food & home products</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-600 italic">"luxury showroom setting"</p>
              </div>
              <p className="text-sm text-gray-500">Premium & tech products</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleUpgrade}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Upgrade to unlock custom prompts
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently asked questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                How does the free plan work?
              </h3>
              <p className="text-gray-600">
                You get 1 free photo pack (6 variations) to try ShotPack. Perfect to test our AI-generated backgrounds with your products.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What are custom scene prompts?
              </h3>
              <p className="text-gray-600">
                Instead of choosing from preset styles, Pro users can describe any scene they want: "floating on clouds", "rustic kitchen", "luxury showroom", etc.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do I need to create an account?
              </h3>
              <p className="text-gray-600">
                No account needed. We use browser fingerprinting to remember your Pro status across sessions, even if you clear cookies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I use the images commercially?
              </h3>
              <p className="text-gray-600">
                Yes! Pro users get full commercial rights to use generated images in their business, marketing, and sales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}