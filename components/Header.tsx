'use client';

import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="8" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="3" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="1.5" fill="white"/>
                  <rect x="7" y="6" width="2" height="2" rx="0.5" fill="white"/>
                  <circle cx="17" cy="10" r="0.5" fill="white" opacity="0.7"/>
                  <circle cx="17" cy="11.5" r="0.5" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                ShotPack
              </h1>
            </a>
            <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              AI-Powered
            </span>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            <a href="/generate" className="text-gray-600 hover:text-gray-900 text-sm">Generate</a>
            <a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a>
            <a href="/history" className="text-gray-600 hover:text-gray-900 text-sm">History</a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col space-y-3">
              <a href="/generate" className="text-gray-600 hover:text-gray-900 text-sm py-2">Generate</a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm py-2">Pricing</a>
              <a href="/history" className="text-gray-600 hover:text-gray-900 text-sm py-2">History</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}