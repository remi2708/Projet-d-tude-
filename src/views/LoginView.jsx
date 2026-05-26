import React, { useState } from 'react';
import { Mail, Lock, UserPlus } from 'lucide-react';

const LoginView = ({ setCurrentPage, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Veuillez renseigner tous les champs pour vous connecter.');
            return;
        }
        const { error: loginError } = await onLogin({ email, password });
        if (loginError) {
            setError(loginError);
            return;
        }
        setError('');
    };

    return (
        <div className="p-6 h-full flex flex-col justify-center animate-fadeIn">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
                <p className="text-sm text-slate-500">Identifiez-vous pour accéder à l'application.</p>
            </div>

            <div className="mt-8 space-y-4">
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
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
                onClick={handleSubmit}
                className="mt-8 w-full py-3 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
            >
                Se connecter
            </button>

            <button
                onClick={() => setCurrentPage('creer')}
                className="mt-3 w-full py-3 rounded-3xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
            >
                <UserPlus size={16} /> Créer un compte
            </button>

            <div className="mt-6 text-xs text-slate-500 text-center">
                Pas encore de compte ? Cliquez sur "Créer un compte".
            </div>
        </div>
    );
};

export default LoginView;
