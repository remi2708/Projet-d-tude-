import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CloudRain, Thermometer, Droplets, MapPin, CalendarDays } from 'lucide-react';

const weatherLabel = (condition) => condition || 'N/A';

const WeatherView = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError('');
      try {
        const snapshot = await getDocs(collection(db, 'weather'));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWeatherData(data);
      } catch (err) {
        console.error('Erreur Firestore météo :', err);
        setError('Impossible de charger les données météo.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6 rounded-[2rem] bg-gradient-to-r from-sky-700 to-cyan-600 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Données Firestore</p>
            <h1 className="mt-2 text-3xl font-bold">Météo en direct</h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-100/90">Lecture des documents stockés dans la collection Firestore <span className="font-semibold">weather</span>.</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">État</p>
            <p className="mt-2 text-xl font-semibold">{loading ? 'Chargement...' : error ? 'Erreur' : `${weatherData.length} enregistrements`}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-slate-700 shadow-sm">Chargement des données météo...</div>
      )}

      {error && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">{error}</div>
      )}

      {!loading && !error && weatherData.length === 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-slate-700 shadow-sm">Aucune donnée météo trouvée dans Firestore.</div>
      )}

      {!loading && !error && weatherData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {weatherData.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{item.city || 'Ville inconnue'}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{weatherLabel(item.condition)}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
                  <CloudRain size={28} />
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Température</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{item.temperature ?? 'N/A'}°C</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Humidité</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{item.humidity ?? 'N/A'}%</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {item.date?.toDate ? item.date.toDate().toLocaleString('fr-FR') : item.date || 'N/A'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ville</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.city || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherView;
