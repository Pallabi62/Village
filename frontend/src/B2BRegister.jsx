import React, { useState } from 'react';

export default function B2BRegister() {
  const [formData, setFormData] = useState({ businessName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await fetch('http://localhost:3000/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();

      if (json.success) {
        setMessage('Registration submitted. Awaiting admin approval. Check your email for confirmation.');
      } else {
        setError(json.error?.description || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 shadow rounded">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">B2B Portal Registration</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Register for API Access</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded text-sm">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-3 rounded text-sm">{message}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text" required placeholder="Registered Business Name"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})}
            />
            <input
              type="email" required placeholder="Business Email (No free providers)"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <input
              type="tel" required placeholder="Phone Number"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
            />
            <input
              type="password" required placeholder="Password (Min 8 chars)" minLength={8}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <input
              type="password" required placeholder="Confirm Password" minLength={8}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>
          <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Register Account
          </button>
        </form>
      </div>
    </div>
  );
}