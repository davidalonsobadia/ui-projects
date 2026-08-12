import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import HourlyInvoice from './components/HourlyInvoice';
import ServicesInvoice from './components/ServicesInvoice';
import InvoiceHistory from './components/InvoiceHistory';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './context/AuthProvider';

const App = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Cargando…
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  if (currentView === 'hourly') return <HourlyInvoice onBack={() => setCurrentView('home')} />;
  if (currentView === 'services') return <ServicesInvoice onBack={() => setCurrentView('home')} />;
  if (currentView === 'history') return <InvoiceHistory onBack={() => setCurrentView('home')} />;
  return <HomeScreen onSelect={setCurrentView} onSignOut={signOut} />;
};

export default App;
