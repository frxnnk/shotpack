import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Turn one photo into 6 catalog-ready shots
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a single product photo and get a consistent pack in seconds. No studio, no Photoshop.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/generate"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try it free →
            </Link>
            <p className="text-xs text-gray-500">No login • No card required</p>
          </div>
          <button className="text-gray-500 hover:text-gray-600 text-sm">
            How it works ↓
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border">
            True consistency
          </span>
          <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border">
            No fake props
          </span>
          <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border">
            Ready for Shopify/Etsy/IG
          </span>
        </div>

        <div id="examples" className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
              <img
                src="/examples/marble-example.jpg"
                alt="Premium Marble background example"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-12 bg-orange-400 rounded shadow-lg transform rotate-12"></div>
              </div>
            </div>
            <p className="text-sm font-medium mt-2">Premium Marble</p>
          </div>
          <div className="text-center">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
              <img
                src="/examples/minimal_wood-example.jpg"
                alt="Minimal Wood background example"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-12 bg-orange-400 rounded shadow-lg transform -rotate-6"></div>
              </div>
            </div>
            <p className="text-sm font-medium mt-2">Minimal Wood</p>
          </div>
          <div className="text-center">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
              <img
                src="/examples/loft-example.jpg"
                alt="Urban Loft background example"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-12 bg-orange-400 rounded shadow-lg transform rotate-3"></div>
              </div>
            </div>
            <p className="text-sm font-medium mt-2">Urban Loft</p>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="text-center flex-1">
              <div className="w-16 h-20 bg-orange-400 rounded mx-auto mb-2 transform rotate-12 shadow-sm"></div>
              <p className="text-xs text-gray-600">Your photo</p>
            </div>
            <div className="px-4">
              <span className="text-2xl">→</span>
            </div>
            <div className="text-center flex-1">
              <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-2">
                <div className="w-5 h-6 bg-orange-400 rounded-sm transform rotate-6"></div>
                <div className="w-5 h-6 bg-orange-400 rounded-sm transform -rotate-3"></div>
                <div className="w-5 h-6 bg-orange-400 rounded-sm transform rotate-12"></div>
                <div className="w-5 h-6 bg-orange-400 rounded-sm transform -rotate-6"></div>
              </div>
              <p className="text-xs text-gray-600">6 pack shots</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            *Generated images preserve your product identity. No people, pets, hands, phones or text added.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <p className="text-xs font-medium">Upload</p>
            </div>
            <div className="p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <p className="text-xs font-medium">Pick style</p>
            </div>
            <div className="p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <p className="text-xs font-medium">Download</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/generate"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Creating Now →
          </Link>
        </div>
      </div>
    </div>
  );
}