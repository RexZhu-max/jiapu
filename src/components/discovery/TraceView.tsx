import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Navigation, Layers, 
  Calendar, Search, ChevronRight, Share2, 
  Map as MapIcon, History
} from 'lucide-react';

const LOCATIONS = [
  { id: 1, name: '林家老宅', type: 'ancestral', lat: 31.2304, lng: 121.4737, year: '1920', desc: '家族发源地，曾祖父购入' },
  { id: 2, name: '第一纺织厂宿舍', type: 'residence', lat: 31.22, lng: 121.45, year: '1955', desc: '祖父工作分配居所' },
  { id: 3, name: '静安新村', type: 'residence', lat: 31.24, lng: 121.46, year: '1982', desc: '父亲出生地' },
  { id: 4, name: '苏州祖坟', type: 'tomb', lat: 31.30, lng: 120.60, year: '清末', desc: '林氏列祖列宗安息之所' },
];

export const TraceView = ({ onBack }: { onBack: () => void }) => {
  const [selectedLoc, setSelectedLoc] = useState<any>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-[#F2F0E9] flex flex-col"
    >
       {/* Map Layer (Mockup) */}
       <div className="absolute inset-0 bg-[#E5E3DC] opacity-50 overflow-hidden">
          {/* Mock Map Grid */}
          <div className="absolute inset-0" style={{ 
             backgroundImage: 'radial-gradient(#A89260 1px, transparent 1px)', 
             backgroundSize: '20px 20px',
             opacity: 0.2
          }} />
          
          {/* Decorative Map Elements */}
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
             <path d="M100 200 Q 250 100 400 300 T 600 200" fill="none" stroke="#A63628" strokeWidth="2" strokeDasharray="4 4" />
             <circle cx="100" cy="200" r="4" fill="#A63628" />
             <circle cx="600" cy="200" r="4" fill="#A63628" />
          </svg>
       </div>

       {/* Header */}
       <div className="relative z-10 px-6 pt-14 pb-4 flex items-center justify-between bg-gradient-to-b from-[#F2F0E9] to-transparent">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-[#E0DED5] flex items-center justify-center shadow-sm active:scale-95 transition-transform">
             <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-[#E0DED5] shadow-sm flex items-center gap-2">
             <Search className="w-4 h-4 text-[#828282]" />
             <span className="text-[12px] text-[#828282]">搜索地点、时间或事件...</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-[#E0DED5] flex items-center justify-center shadow-sm">
             <Layers className="w-5 h-5 text-[#1A1A1A]" />
          </button>
       </div>

       {/* Map Pins */}
       <div className="relative flex-1">
          {LOCATIONS.map(loc => (
             <motion.button
                key={loc.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedLoc(loc)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                style={{ top: `${(loc.lat - 31.20) * 1000 + 20}%`, left: `${(loc.lng - 121.40) * 1000}%` }} // Mock positioning
             >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors ${selectedLoc?.id === loc.id ? 'bg-[#A63628] border-white text-white' : 'bg-white border-[#A63628] text-[#A63628]'}`}>
                   <MapPin className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[10px] font-bold text-[#1A1A1A] bg-white/80 backdrop-blur px-2 py-0.5 rounded-[4px] shadow-sm">
                   {loc.name}
                </span>
             </motion.button>
          ))}
       </div>

       {/* Bottom Panel */}
       <div className="relative z-10 p-6 pb-safe">
          <AnimatePresence mode="wait">
             {selectedLoc ? (
                <motion.div 
                   key="detail"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 20, opacity: 0 }}
                   className="bg-white rounded-[16px] p-5 shadow-xl border border-[#E0DED5]"
                >
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <span className="text-[10px] text-[#A63628] font-bold tracking-wider uppercase mb-1 block">
                            {selectedLoc.year}
                         </span>
                         <h3 className="text-[18px] font-bold font-serif text-[#1A1A1A]">{selectedLoc.name}</h3>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-2 rounded-full bg-[#F9F9F7] text-[#1A1A1A]">
                            <Navigation className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                   <p className="text-[13px] text-[#555] mb-4 leading-relaxed font-serif">
                      {selectedLoc.desc}
                   </p>
                   <div className="h-24 bg-[#F2F0E9] rounded-[8px] flex items-center justify-center border border-[#E0DED5] border-dashed text-[#828282] text-[12px]">
                      暂无影像记录
                   </div>
                </motion.div>
             ) : (
                <motion.div 
                   key="list"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 20, opacity: 0 }}
                   className="bg-white rounded-[16px] p-5 shadow-xl border border-[#E0DED5]"
                >
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[16px] font-bold font-serif text-[#1A1A1A]">记忆寻踪</h3>
                      <button className="text-[12px] text-[#828282] flex items-center gap-1">
                         查看列表 <ChevronRight className="w-3 h-3" />
                      </button>
                   </div>
                   <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
                      {['迁徙路线', '老宅旧址', '祖坟分布'].map((tag, i) => (
                         <button key={i} className="flex-shrink-0 px-4 py-2 bg-[#F9F9F7] rounded-[8px] text-[12px] font-medium text-[#1A1A1A] border border-[#E0DED5]">
                            {tag}
                         </button>
                      ))}
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
       </div>
    </motion.div>
  );
};
