import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6 tracking-wide">All India Villages API</h2>
        <nav className="space-y-2">
          <a href="#" className="block py-2 px-3 rounded hover:bg-slate-700 bg-slate-700">Analytics Dashboard</a>
          <a href="#" className="block py-2 px-3 rounded hover:bg-slate-700">User Management</a>
          <a href="#" className="block py-2 px-3 rounded hover:bg-slate-700">Village Master List</a>
          <a href="#" className="block py-2 px-3 rounded hover:bg-slate-700">API Logs Viewer</a>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="text-sm text-gray-500 font-medium">
             Admin / Analytics Dashboard
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Admin User</span>
            <div className="h-8 w-8 bg-blue-500 rounded-full"></div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}