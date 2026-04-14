import React, { useState } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length >= 2) {
      try {
        const res = await fetch(`http://localhost:3000/v1/autocomplete?q=${val}`, {
          headers: { 'X-API-Key': 'demo_public_key_for_presentations' }
        });
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setResults([]);
    }
  };

  const handleSelect = (village) => {
    setSelectedVillage(village);
    setQuery(village.label);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Contact Us (Demo)</h2>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>

            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700">Village / Area</label>
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Start typing a village name..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              />
              {results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {results.map((r, i) => (
                    <li key={i} onClick={() => handleSelect(r)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                      <div className="font-medium">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.fullAddress}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-District</label>
                <input type="text" readOnly value={selectedVillage?.hierarchy?.subDistrict || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input type="text" readOnly value={selectedVillage?.hierarchy?.district || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input type="text" readOnly value={selectedVillage?.hierarchy?.state || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" readOnly value={selectedVillage?.hierarchy?.country || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 border p-2" />
              </div>
            </div>
          </div>

          <div>
            <button type="button" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}