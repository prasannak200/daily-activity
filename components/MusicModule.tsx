
import React, { useState, useEffect, useRef } from 'react';
import { Soundscape } from '../types';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, ArrowDownTrayIcon, SparklesIcon } from './Icons';
import { geminiService, MusicDiscoveryResult } from '../services/geminiService';

const SOUNDSCAPES: Soundscape[] = [
  { id: 'rain', name: 'Summer Rain', url: 'https://assets.mixkit.co/active_storage/sfx/2418/2418-preview.mp3', icon: '🌧️', color: 'bg-blue-500' },
  { id: 'forest', name: 'Deep Forest', url: 'https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3', icon: '🌲', color: 'bg-emerald-500' },
  { id: 'lofi', name: 'Lo-Fi Chill', url: 'https://assets.mixkit.co/active_storage/sfx/2381/2381-preview.mp3', icon: '🎧', color: 'bg-indigo-500' },
  { id: 'waves', name: 'Ocean Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', icon: '🌊', color: 'bg-cyan-500' },
];

const MusicModule: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Discovery State
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<MusicDiscoveryResult | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = (sound: Soundscape) => {
    if (activeId === sound.id) {
      audioRef.current?.pause();
      setActiveId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      setActiveId(sound.id);
    }
  };

  const handleDownload = async (e: React.MouseEvent, sound: Soundscape) => {
    e.stopPropagation();
    if (downloadingIds.has(sound.id)) return;
    setDownloadingIds(prev => new Set(prev).add(sound.id));
    try {
      const response = await fetch(sound.url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sound.name.replace(/\s+/g, '_').toLowerCase()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(sound.url, '_blank');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(sound.id);
        return next;
      });
    }
  };

  const handleGoogleMusicSearch = async () => {
    if (!discoveryQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await geminiService.findMusic(discoveryQuery);
      setSearchResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className="space-y-8 animate-slideIn pb-10">
      <div className="px-2">
        <h2 className="text-3xl font-black text-slate-900">Soundscapes</h2>
        <p className="text-slate-500 font-medium">Create your ideal focus environment.</p>
      </div>

      {/* Google Music Discovery Connection */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <SparklesIcon />
          </div>
          <h3 className="font-bold text-slate-800">Google Music Discovery</h3>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">Find specific focus playlists or albums directly through Google Search.</p>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="e.g. Deep Work Lo-fi on YouTube" 
            value={discoveryQuery}
            onChange={(e) => setDiscoveryQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoogleMusicSearch()}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium"
          />
          <button 
            onClick={handleGoogleMusicSearch}
            disabled={isSearching || !discoveryQuery.trim()}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center min-w-[80px]"
          >
            {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Search'}
          </button>
        </div>

        {searchResult && (
          <div className="mt-6 space-y-4 animate-slideIn">
            <div className="p-4 bg-indigo-50 rounded-2xl text-sm text-indigo-900 leading-relaxed border border-indigo-100">
              {searchResult.text}
            </div>
            {searchResult.links.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Links from Google</p>
                <div className="grid gap-2">
                  {searchResult.links.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate mr-4">{link.title}</span>
                      <div className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SOUNDSCAPES.map((sound) => (
          <button
            key={sound.id}
            onClick={() => toggleSound(sound)}
            className={`relative group h-44 rounded-[2.5rem] p-6 text-left overflow-hidden transition-all active:scale-95 border-2 ${
              activeId === sound.id 
                ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                : 'border-white bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform ${
              activeId === sound.id ? 'scale-110 rotate-12' : 'group-hover:scale-110'
            } ${sound.color} text-white shadow-lg`}>
              {sound.icon}
            </div>
            
            <h3 className="font-bold text-slate-800">{sound.name}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {activeId === sound.id ? 'Playing' : 'Ready'}
            </p>

            <div className="absolute bottom-6 left-6 flex gap-2">
              <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 transition-colors ${activeId === sound.id ? 'text-indigo-600 bg-indigo-50' : ''}`}>
                {activeId === sound.id ? <PauseIcon /> : <PlayIcon />}
              </div>
            </div>

            <div 
              onClick={(e) => handleDownload(e, sound)}
              className={`absolute bottom-6 right-6 p-2 rounded-xl transition-all ${
                downloadingIds.has(sound.id) 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {downloadingIds.has(sound.id) ? (
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              ) : (
                <ArrowDownTrayIcon />
              )}
            </div>

            {activeId === sound.id && (
              <div className="absolute top-0 right-0 p-4">
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse"></span>
                  <span className="w-1 h-5 bg-indigo-500 rounded-full animate-pulse delay-75"></span>
                  <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-150"></span>
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {activeId && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-slide-up space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-spin-slow">
                <SpeakerWaveIcon />
              </div>
              <div>
                <h4 className="font-black text-slate-900">Listening to...</h4>
                <p className="text-indigo-600 font-bold text-sm">
                  {SOUNDSCAPES.find(s => s.id === activeId)?.name}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
              <span>Mute</span>
              <span>Full Volume</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicModule;
