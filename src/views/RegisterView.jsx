import React, { useState } from 'react';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';

const RegisterView = ({ setCurrentPage, onCreateAccount }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Veuillez renseigner tous les champs pour créer un compte.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        const { error: createError } = onCreateAccount({ email, password, firstName, lastName });
        if (createError) {
            setError(createError);
            return;
        }
        setError('');
    };

    return (
        <div className="p-6 h-full flex flex-col justify-center animate-fadeIn">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Créer un compte</h2>
                <p className="text-sm text-slate-500">Créez un compte pour accéder à l'application.</p>
            </div>

            <div className="mt-8 space-y-4">
                <label className="block text-xs font-bold uppercase text-slate-500">Prénom</label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-3xl">
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                            setFirstName(e.target.value);
                            setError('');
                        }}
                        placeholder="Prénom"
                        className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                </div>

                <label className="block text-xs font-bold uppercase text-slate-500">Nom</label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-3xl">
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value);
                            setError('');
                        }}
                        placeholder="Nom"
                        className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                </div>

                <label className="block text-xs font-bold uppercase text-slate-500">Adresse e-mail</label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-3xl">
                    <Mail size={18} className="text-emerald-600" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        placeholder="votre@email.com"
                        className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                </div>

                <label className="block text-xs font-bold uppercase text-slate-500">Mot de passe</label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-3xl">
                    <Lock size={18} className="text-emerald-600" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                </div>

                <label className="block text-xs font-bold uppercase text-slate-500">Confirmer le mot de passe</label>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-3xl">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full bg-transparent outline-none text-sm text-slate-900"
                    />
                </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
                onClick={handleSubmit}
                className="mt-8 w-full py-3 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
            >
                Créer un compte
            </button>

            <button
                onClick={() => setCurrentPage('connexion')}
                className="mt-3 w-full py-3 rounded-3xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition"
            >
                Retour à la connexion
            </button>
        </div>
    );
};

export default RegisterView;
