import React, { useState, useEffect, useRef } from 'react';
import { Leaf, User, Settings, LogOut } from 'lucide-react';

const Header = ({ isAuthenticated, setCurrentPage, setAuthenticated, setCurrentUser, currentUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (page) => {
    setMenuOpen(false);
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setAuthenticated(false);
    setCurrentPage('connexion');
    if (setCurrentUser) {
      setCurrentUser(null);
    }
  };

  return (
    <header className="bg-emerald-800 text-white pt-10 pb-4 px-6 flex justify-between items-center shadow-md shrink-0 relative">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('accueil')}>
        <div className="p-1.5 bg-white rounded-lg text-emerald-800">
          <Leaf size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Vitinova</h1>
      </div>
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${isAuthenticated ? 'bg-emerald-700/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
          <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          {isAuthenticated ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
        </div>
        <button onClick={() => setMenuOpen((prev) => !prev)} className="p-2 bg-emerald-700/50 rounded-full hover:bg-emerald-600 transition-colors">
          <User size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white text-gray-900 rounded-3xl shadow-xl border border-gray-200 overflow-hidden animate-scaleIn z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-slate-800">Bonjour {currentUser?.firstName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500">{currentUser?.email || 'Non connecté'}</p>
            </div>
            <button
              onClick={() => handleMenuClick('compte')}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition"
            >
              <User size={16} className="text-emerald-600" />
              Mon compte
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleMenuClick('admin')}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition"
              >
                <Settings size={16} className="text-emerald-600" />
                Administration
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition"
            >
              <LogOut size={16} className="text-red-500" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
