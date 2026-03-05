import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar as CalendarIcon, ChevronRight, Bell } from 'lucide-react';

export const CreateEventView = ({ onClose }: { onClose: () => void }) => {
  const [isLunar, setIsLunar] = useState(true);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 bg-[#F9F9F7] z-[100] flex flex-col"
    >
      <div className="px-6 pt-14 pb-4 flex items-center justify-between border-b border-[#EBEBE6] bg-white">
         <button onClick={onClose} className="text-[15px] text-[#8E8E93]">取消</button>
         <h2 className="text-[17px] font-bold font-serif text-[#1D1D1F]">新建纪念日</h2>
         <button onClick={onClose} className="text-[15px] font-bold text-[#B93A32]">保存</button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
         <div className="bg-white rounded-[12px] overflow-hidden border border-[#EBEBE6] mb-6">
            <div className="p-4 border-b border-[#F5F5F7]">
               <input 
                  type="text" 
                  placeholder="事件名称 (如: 爷爷寿辰)" 
                  className="w-full text-[16px] placeholder:text-[#C7C7CC] outline-none font-serif"
               />
            </div>
            
            <div className="p-4 flex items-center justify-between border-b border-[#F5F5F7]">
               <span className="text-[14px] text-[#1D1D1F]">历法</span>
               <div className="flex bg-[#F5F5F7] p-0.5 rounded-[6px]">
                  <button 
                     onClick={() => setIsLunar(false)}
                     className={`px-3 py-1 text-[12px] rounded-[4px] transition-all ${!isLunar ? 'bg-white shadow-sm text-[#1D1D1F] font-bold' : 'text-[#8E8E93]'}`}
                  >
                     公历
                  </button>
                  <button 
                     onClick={() => setIsLunar(true)}
                     className={`px-3 py-1 text-[12px] rounded-[4px] transition-all ${isLunar ? 'bg-white shadow-sm text-[#B93A32] font-bold' : 'text-[#8E8E93]'}`}
                  >
                     农历
                  </button>
               </div>
            </div>

            <div className="p-4 flex items-center justify-between">
               <span className="text-[14px] text-[#1D1D1F]">日期</span>
               <span className="text-[16px] font-bold text-[#1D1D1F] font-serif flex items-center gap-1">
                  {isLunar ? '甲辰年 十二月 初八' : '2025年 1月 18日'} 
                  <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
               </span>
            </div>
         </div>

         <div className="bg-white rounded-[12px] overflow-hidden border border-[#EBEBE6] mb-6">
            <div className="p-4 flex items-center justify-between border-b border-[#F5F5F7]">
               <span className="text-[14px] text-[#1D1D1F]">关联亲友</span>
               <span className="text-[14px] text-[#8E8E93] flex items-center gap-1">
                  选择 <ChevronRight className="w-4 h-4" />
               </span>
            </div>
            <div className="p-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#1D1D1F]" />
                  <span className="text-[14px] text-[#1D1D1F]">提醒</span>
               </div>
               <span className="text-[14px] text-[#1D1D1F] flex items-center gap-1">
                  当天 09:00 <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
               </span>
            </div>
         </div>

         <p className="text-[12px] text-[#8E8E93] px-2 leading-relaxed">
            * 农历纪念日将自动按每年对应的公历日期提醒。<br/>
            * 关联亲友后，对方也将收到提醒。
         </p>
      </div>
    </motion.div>
  );
};
