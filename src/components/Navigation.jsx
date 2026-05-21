import React from 'react';
import { Home, Map as MapIcon, Camera, BarChart2, Users } from 'lucide-react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  return (
    <nav className="bg-white border-t border-gray-200 pb-6 pt-3 px-4 flex justify-around items-center shrink-0 relative z-20">
      <button onClick={() => setCurrentPage('accueil')} className={`flex flex-col items-center gap-1 ${currentPage === 'accueil' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <Home size={22} />
        <span className="text-[10px] font-bold">Home</span>
      </button>
      <button onClick={() => setCurrentPage('carte')} className={`flex flex-col items-center gap-1 ${currentPage === 'carte' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <MapIcon size={22} />
        <span className="text-[10px] font-bold">Carte</span>
      </button>
      
      <div className="relative -top-5">
        <button onClick={() => setCurrentPage('scan')} className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center border-4 border-white active:scale-95 transition-transform">
          <Camera size={24} />
        </button>
      </div>

      <button onClick={() => setCurrentPage('dashboard')} className={`flex flex-col items-center gap-1 ${currentPage === 'dashboard' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <BarChart2 size={22} />
        <span className="text-[10px] font-bold">Données</span>
      </button>
      <button onClick={() => setCurrentPage('communaute')} className={`flex flex-col items-center gap-1 ${currentPage === 'communaute' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <Users size={22} />
        <span className="text-[10px] font-bold">Forum</span>
      </button>
    </nav>
  );
};

export default Navigation;