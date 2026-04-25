import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import HourlyInvoice from './components/HourlyInvoice';
import ServicesInvoice from './components/ServicesInvoice';

const App = () => {
  const [currentView, setCurrentView] = useState('home');

  if (currentView === 'hourly') return <HourlyInvoice onBack={() => setCurrentView('home')} />;
  if (currentView === 'services') return <ServicesInvoice onBack={() => setCurrentView('home')} />;
  return <HomeScreen onSelect={setCurrentView} />;
};

export default App;
