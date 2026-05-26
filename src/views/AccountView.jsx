import React, { useState } from 'react';

const AccountView = ({ currentUser, onUpdateAccount }) => {
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const { error: updateError } = onUpdateAccount({ firstName, lastName, password, confirmPassword });
    if (updateError) {
      setError(updateError);
      setMessage('');
      return;
    }
    setError('');
    setMessage('Informations de compte mises à jour avec succès.');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="p-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Mon compte</h2>
      <p className="text-sm text-slate-500 mb-6">Consultez et gérez les informations de votre compte.</p>

      <div className="space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-400 font-bold mb-2">Adresse e-mail</p>
          <p className="text-sm text-slate-900">{currentUser?.email || 'Non disponible'}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-400 font-bold mb-2">Rôle</p>
          <p className="text-sm text-slate-900">{currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Prénom</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-3xl text-sm text-slate-900"
              placeholder="Prénom"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Nom</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-3xl text-sm text-slate-900"
              placeholder="Nom"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-3xl text-sm text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-3xl text-sm text-slate-900"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {message && <div className="text-sm text-emerald-600">{message}</div>}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
        >
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default AccountView;
