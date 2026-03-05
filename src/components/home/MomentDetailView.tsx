import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronDown, Heart, MessageCircle, 
  PenTool, Mic, Share2, MoreHorizontal,
  Clock, MapPin, Calendar, Lock,
  Image as ImageIcon
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Moment {
  id: string;
  user: {
    name: string;
    relation: string;
    avatar: string;
  };
  memoryDate: string;
  content: string;
  images?: string[];
  audio?: {
    duration: string;
  };
  participants?: string[];
  location?: string;
  isUnread?: boolean;
}

interface MomentDetailViewProps {
  moments: Moment[];
  initialIndex: number;
  onClose: () => void;
}

export const MomentDetailView = ({ moments, initialIndex, onClose }: MomentDetailViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isSupplementing, setIsSupplementing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll snap logic simulation (simple version)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    const scrollIcon = e.currentTarget.scrollTop;
    const index = Math.round(scrollIcon / height);
    if (index !== currentIndex && index >= 0 && index < moments.length) {
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: initialIndex * containerRef.current.clientHeight,
        behavior: 'instant'
      });
    }
  }, [initialIndex]);

  const currentMoment = moments[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 z-[60] bg-black text-[#F2F0E9] flex flex-col"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button 
           onClick={onClose} 
           className="pointer-events-auto flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors z-50"
        >
           <X className="w-5 h-5 text-white" />
           <span className="text-[12px] text-white font-medium pr-1">返回</span>
        </button>
        <div className="text-[14px] font-bold font-serif tracking-wider text-white/90">家族记忆</div>
        <button className="pointer-events-auto p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors z-50">
           <MoreHorizontal className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Vertical Snap Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        {moments.map((moment, index) => (
          <div key={moment.id} className="h-full w-full snap-start relative flex flex-col justify-center">
            {/* Background Image (Blurred) */}
            <div className="absolute inset-0 z-0 opacity-30">
               {moment.images?.[0] ? (
                  <ImageWithFallback 
                    src={moment.images[0]} 
                    className="w-full h-full object-cover blur-2xl scale-110" 
                  />
               ) : (
                  <div className="w-full h-full bg-[#1A1A1A]" />
               )}
               <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 px-6 pb-24 pt-20 h-full flex flex-col justify-end">
               
               {/* Main Visual */}
               <div className="flex-1 flex items-center justify-center mb-6">
                 {moment.images && moment.images.length > 0 ? (
                    <div className="w-full relative aspect-[3/4] max-h-[60vh] rounded-[16px] overflow-hidden shadow-2xl border border-white/10">
                        {/* If multiple images, simple horizontal scroll or grid */}
                        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                           {moment.images.map((img, i) => (
                             <img key={i} src={img} className="w-full h-full object-cover snap-center shrink-0" />
                           ))}
                        </div>
                        {moment.images.length > 1 && (
                           <div className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded text-[10px] backdrop-blur">
                              1 / {moment.images.length}
                           </div>
                        )}
                    </div>
                 ) : (
                    <div className="w-full aspect-[4/3] bg-[#F2F0E9] rounded-[16px] p-8 flex items-center justify-center text-[#1A1A1A] font-serif text-[24px] shadow-2xl">
                       <div className="text-center opacity-80 leading-relaxed">
                          "{moment.content.slice(0, 50)}..."
                       </div>
                    </div>
                 )}
               </div>

               {/* Meta Info */}
               <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full border-2 border-white/80 overflow-hidden">
                        <ImageWithFallback src={moment.user.avatar} className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[18px] font-bold text-white shadow-sm">{moment.user.name}</span>
                           <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-[4px] text-white/90 backdrop-blur-sm border border-white/10">
                              {moment.user.relation}
                           </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-white/60 mt-0.5">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {moment.memoryDate}</span>
                           {moment.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {moment.location}</span>}
                        </div>
                     </div>
                  </div>
                  
                  <p className="text-[15px] text-white/90 leading-relaxed font-serif text-justify drop-shadow-md line-clamp-4">
                     {moment.content}
                  </p>
               </div>

               {/* Actions */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <button className="flex flex-col items-center gap-1 text-white/80 hover:text-[#A63628] transition-colors">
                        <div className="p-2 bg-white/10 rounded-full backdrop-blur">
                           <Heart className="w-6 h-6" />
                        </div>
                        <span className="text-[10px]">温情</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
                        <div className="p-2 bg-white/10 rounded-full backdrop-blur">
                           <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px]">评论</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors">
                        <div className="p-2 bg-white/10 rounded-full backdrop-blur">
                           <Share2 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px]">分享</span>
                     </button>
                  </div>

                  <button 
                     onClick={() => setIsSupplementing(true)}
                     className="flex items-center gap-2 bg-[#A63628] text-white px-5 py-3 rounded-full shadow-lg shadow-[#A63628]/30 hover:bg-[#A63628]/90 transition-colors animate-pulse"
                  >
                     <PenTool className="w-4 h-4" />
                     <span className="font-bold text-[14px]">补充回忆</span>
                  </button>
               </div>

            </div>
          </div>
        ))}
      </div>

      {/* Supplement Modal (Drawer) */}
      <AnimatePresence>
         {isSupplementing && (
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="absolute inset-x-0 bottom-0 h-[70vh] bg-[#F2F0E9] rounded-t-[24px] z-50 flex flex-col text-[#1A1A1A]"
            >
               <div className="flex justify-between items-center p-4 border-b border-[#E0DED5]">
                  <span className="text-[16px] font-bold font-serif">补充家族回忆</span>
                  <button onClick={() => setIsSupplementing(false)}><X className="w-6 h-6 text-[#828282]" /></button>
               </div>
               
               <div className="flex-1 p-6 flex flex-col gap-6">
                  <div className="bg-white p-4 rounded-[12px] border border-[#E0DED5] shadow-sm">
                     <div className="flex items-center gap-2 mb-2 text-[#A89260] text-[12px] font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>关于 {currentMoment.memoryDate} 的记忆</span>
                     </div>
                     <p className="text-[14px] text-[#828282] italic">
                        "{currentMoment.content.slice(0, 40)}..."
                     </p>
                  </div>

                  <div className="flex-1">
                     <textarea 
                        className="w-full h-full bg-transparent resize-none outline-none text-[16px] leading-relaxed font-serif placeholder:text-[#C0C0C0]"
                        placeholder="我也记得这件事，当时..."
                     />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#E0DED5]">
                     <div className="flex gap-4">
                        <button className="p-2 rounded-full hover:bg-[#EBE9E2] text-[#828282]"><Mic className="w-5 h-5" /></button>
                        <button className="p-2 rounded-full hover:bg-[#EBE9E2] text-[#828282]"><ImageIcon className="w-5 h-5" /></button>
                     </div>
                     <button 
                        onClick={() => setIsSupplementing(false)}
                        className="bg-[#1A1A1A] text-[#F2F0E9] px-6 py-2 rounded-full font-bold text-[14px] shadow-lg"
                     >
                        提交补充
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};
