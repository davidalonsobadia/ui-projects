import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

// Login gate shown to signed-out users. Email/password only — no sign-up or
// password-reset (out of scope for v1). User-facing copy is Spanish per
// CLAUDE.md; identifiers stay English.
const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      // On success the auth listener swaps this screen for the app, so this
      // component unmounts — no need to reset `submitting` here.
    } catch (err) {
      setError('Correo electrónico o contraseña incorrectos.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full bg-white border-2 border-slate-200 rounded-xl p-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Generador de Facturas
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Inicia sesión para continuar
        </p>

        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-400"
        />

        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-400"
        />

        {error && (
          <p role="alert" className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
