import React, { useState } from 'react';
import Layout from './Layout';
import AdminDashboard from './AdminDashboard';
import B2BRegister from './B2BRegister';

function App() {
  // Simple routing for demonstration purposes
  const [route, setRoute] = useState(window.location.pathname);

  if (route === '/register') {
    return <B2BRegister />;
  }

  return (
    <Layout setRoute={setRoute}>
      <AdminDashboard />
    </Layout>
  );
}

export default App;