import React, { useState, useEffect } from 'react';
import { 
  MapPin, Sun, CloudRain, Cloud, Thermometer, 
  Droplets, Wind, RefreshCw, Camera, Map as MapIcon, 
  Leaf, Wifi, ChevronRight 
} from 'lucide-react';

const HomeView = ({ setCurrentPage }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.8944&longitude=-0.1557&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code')
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setWeather({
            temp: data.current.temperature_2m,
            hum: data.current.relative_humidity_2m,
            wind: data.current.wind_speed_10m,
            code: data.current.weather_code
          });
        }
      })
      .catch(err => console.error("Erreur API Météo:", err));
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun size={36} className="text-yellow-300 drop-shadow-md" />;
    if (code >= 51 && code <= 65) return <CloudRain size={36} className="text-blue-200 drop-shadow-md" />;
    if (code >= 80 && code <= 82) return <CloudRain size={36} className="text-blue-200 drop-shadow-md" />;
    return <Cloud size={36} className="text-white drop-shadow-md" />;
  };

  return (
    <div className="p-6 space-y-5 animate-fadeIn pb-12">
      
      {/* WIDGET MÉTÉO GÉNÉRIQUE */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-90">
              <MapPin size={14} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Météo Régionale</h3>
            </div>
            <p className="text-2xl font-black">Saint-Émilion, FR</p>
            <p className="text-sm text-blue-100 font-medium mt-0.5">Temps réel (Open-Meteo API)</p>
          </div>
          <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
            {weather ? getWeatherIcon(weather.code) : <RefreshCw size={36} className="text-white/50 animate-spin" />}
          </div>
        </div>
        <div className="relative z-10 mt-5 flex gap-4 text-sm font-bold bg-black/10 p-3 rounded-2xl">
          <span className="flex items-center gap-1"><Thermometer size={16} className="text-blue-200" /> {weather ? `${Math.round(weather.temp)}°C` : '--'}</span>
          <span className="flex items-center gap-1"><Droplets size={16} className="text-blue-200" /> {weather ? `${Math.round(weather.hum)}%` : '--'}</span>
          <span className="flex items-center gap-1"><Wind size={16} className="text-blue-200" /> {weather ? `${Math.round(weather.wind)} km/h` : '--'}</span>
        </div>
        <Cloud className="absolute -bottom-6 -right-4 text-white opacity-10" size={120} />
      </div>

      {/* NAVIGATION PRINCIPALE */}
      <div className="bg-gradient-to-br from-emerald-700 to-green-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2">Pôle Multi-Propriétés</h2>
          <p className="text-emerald-50 text-xs mb-5 opacity-90">Analyse de vos parcelles propulsée par l'IA experte.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button onClick={() => setCurrentPage('scan')} className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/30 transition-all">
              <Camera size={24} />
              <span className="text-xs font-bold">Scan IA</span>
            </button>
            <button onClick={() => setCurrentPage('carte')} className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/30 transition-all">
              <MapIcon size={24} />
              <span className="text-xs font-bold">Carte 3D</span>
            </button>
            <button onClick={() => setCurrentPage('meteo')} className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/30 transition-all">
              <CloudRain size={24} />
              <span className="text-xs font-bold">Météo</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Leaf size={150} />
        </div>
      </div>

      {/* ÉTAT DES CAPTEURS */}
      <div className="grid grid-cols-1 gap-3">
        <div onClick={() => setCurrentPage('dashboard')} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wifi size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Réseau Capteurs IoT</h4>
              <p className="text-[11px] text-gray-500 font-medium">1 station Weenat connectée</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
};

export default HomeView;