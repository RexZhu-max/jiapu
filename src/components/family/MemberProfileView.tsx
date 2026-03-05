import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Calendar, MapPin, Image as ImageIcon, Mic, Share2, Heart, Edit3 } from 'lucide-react';

interface MemberProfileProps {
  member: any;
  onBack: () => void;
  onEdit: () => void;
}

export const MemberProfileView = ({ member, onBack, onEdit }: MemberProfileProps) => {
  const [activeTab, setActiveTab] = useState<'life' | 'gallery' | 'voice'>('life');

  // Mock Data based on member
  const timeline = [
    { year: member.birth, title: '出生', desc: `出生于${member.birth < 1970 ? '老家祖屋' : '市妇幼保健院'}，那天${member.birth < 1980 ? '下了很大的雪' : '阳光明媚'}。` },
    { year: parseInt(member.birth) + 18, title: '成人礼', desc: '考入大学，第一次离开家乡去往远方。' },
    { year: parseInt(member.birth) + 26, title: '成家', desc: '与爱人步入婚姻殿堂，开启人生新篇章。' },
    { year: parseInt(member.birth) + 30, title: '立业', desc: '在事业上取得了重要的突破，晋升为高级工程师。' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[150] bg-[#F9F9F7] flex flex-col overflow-hidden"
    >
      {/* Header Image Area */}
      <div className="relative h-72 w-full shrink-0">
         {member.img ? (
            <img src={member.img} className="w-full h-full object-cover grayscale-[0.2]" />
         ) : (
            <div className="w-full h-full bg-[#E5E5EA] flex items-center justify-center text-[#8E8E93] font-serif text-6xl">
               {member.name[0]}
            </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F7] via-transparent to-black/30" />
         
         {/* Navbar */}
         <div className="absolute top-0 left-0 right-0 p-6 pt-14 flex justify-between items-center text-white">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/20 backdrop-blur-sm">
               <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div className="flex gap-3">
               <button onClick={onEdit} className="p-2 rounded-full hover:bg-white/20 backdrop-blur-sm">
                  <Edit3 className="w-5 h-5" />
               </button>
               <button className="p-2 rounded-full hover:bg-white/20 backdrop-blur-sm">
                  <Share2 className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* Title Info */}
         <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-end justify-between">
               <div>
                  <h1 className="text-3xl font-bold font-serif text-[#1D1D1F] mb-1">{member.name}</h1>
                  <p className="text-[#555] text-sm flex items-center gap-2">
                     <span className="bg-[#B93A32] text-white px-2 py-0.5 rounded-[2px] text-[10px] font-medium">{member.role}</span>
                     <span>{member.birth} — 至今</span>
                  </p>
               </div>
               <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#B93A32]">
                  <Heart className="w-5 h-5 fill-current" />
               </button>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EBEBE6] px-6 bg-[#F9F9F7] shrink-0 sticky top-0 z-10">
         {[
            { id: 'life', label: '生平', icon: Calendar },
            { id: 'gallery', label: '影像', icon: ImageIcon },
            { id: 'voice', label: '口述', icon: Mic },
         ].map(tab => (
            <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 py-4 flex items-center justify-center gap-2 text-[14px] font-medium transition-colors relative ${
                  activeTab === tab.id ? 'text-[#B93A32]' : 'text-[#8E8E93]'
               }`}
            >
               <tab.icon className="w-4 h-4" />
               {tab.label}
               {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 w-12 h-[2px] bg-[#B93A32]" />
               )}
            </button>
         ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
         {activeTab === 'life' && (
            <div className="space-y-8 pl-2">
               {/* Bio */}
               <div className="mb-8">
                  <p className="text-[15px] text-[#1D1D1F] leading-relaxed font-serif">
                     {member.bio}
                     <br/><br/>
                     {member.name}的一生是平凡而伟大的一生。从早年的求学经历到后来的工作生涯，始终保持着坚韧不拔的品质。在家族中，是备受尊敬的长辈，也是晚辈们学习的榜样。
                  </p>
               </div>

               {/* Timeline */}
               <div className="relative border-l border-[#EBEBE6] pl-6 space-y-8">
                  {timeline.map((item, i) => (
                     <div key={i} className="relative">
                        <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-[#B93A32] bg-[#F9F9F7]" />
                        <span className="text-[12px] text-[#8E8E93] font-mono block mb-1">{item.year}</span>
                        <h3 className="text-[16px] font-bold text-[#1D1D1F] font-serif mb-1">{item.title}</h3>
                        <p className="text-[13px] text-[#555] leading-relaxed">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'gallery' && (
            <div className="grid grid-cols-2 gap-3">
               {[1,2,3,4].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-[#E5E5EA] rounded-[8px] overflow-hidden relative group">
                     <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                     {member.img ? (
                        <img src={`${member.img}?auto=format&fit=crop&w=300&q=80&ixid=${i}`} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                           <ImageIcon className="w-8 h-8 opacity-20" />
                        </div>
                     )}
                     <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                        198{i}年 · 老家
                     </div>
                  </div>
               ))}
               <button className="aspect-[3/4] border border-dashed border-[#C7C7CC] rounded-[8px] flex flex-col items-center justify-center gap-2 text-[#8E8E93] hover:border-[#B93A32] hover:text-[#B93A32] transition-colors">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[12px]">上传照片</span>
               </button>
            </div>
         )}

         {activeTab === 'voice' && (
            <div className="space-y-4">
               <div className="bg-white p-4 rounded-[12px] border border-[#EBEBE6] shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#B93A32]/10 flex items-center justify-center text-[#B93A32]">
                     <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[14px] font-bold text-[#1D1D1F]">关于童年的回忆</h4>
                     <p className="text-[11px] text-[#8E8E93]">2023年春节 · 3分24秒</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-full border border-[#EBEBE6] text-[12px] font-medium text-[#1D1D1F]">播放</button>
               </div>
               
               <div className="bg-white p-4 rounded-[12px] border border-[#EBEBE6] shadow-sm flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#B93A32]/10 flex items-center justify-center text-[#B93A32]">
                     <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[14px] font-bold text-[#1D1D1F]">给孙辈的话</h4>
                     <p className="text-[11px] text-[#8E8E93]">2023年中秋 · 1分12秒</p>
                  </div>
                   <button className="px-3 py-1.5 rounded-full border border-[#EBEBE6] text-[12px] font-medium text-[#1D1D1F]">播放</button>
               </div>

               <button className="w-full py-4 border border-dashed border-[#C7C7CC] rounded-[12px] flex items-center justify-center gap-2 text-[#8E8E93] mt-4">
                  <Mic className="w-5 h-5" />
                  <span className="text-[13px]">录制新口述</span>
               </button>
            </div>
         )}
      </div>
    </motion.div>
  );
};
