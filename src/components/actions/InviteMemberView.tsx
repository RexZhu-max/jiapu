import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Share2 } from 'lucide-react';

export const InviteMemberView = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-[#1D1D1F]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[320px] bg-[#F9F9F7] rounded-[20px] overflow-hidden relative">
         <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full z-10">
            <X className="w-5 h-5 text-[#1D1D1F]" />
         </button>

         <div className="p-8 text-center bg-white pb-10">
            <h3 className="text-[20px] font-bold text-[#1D1D1F] font-serif mb-2">邀请家人加入</h3>
            <p className="text-[13px] text-[#8E8E93] mb-6">共修林氏家谱，传承家族记忆</p>
            
            <div className="w-40 h-40 mx-auto bg-[#1D1D1F] p-3 rounded-[8px] mb-6 shadow-xl">
               <div className="w-full h-full bg-white flex items-center justify-center">
                  {/* Mock QR */}
                  <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HeritageAppInvite')] bg-contain" />
               </div>
            </div>

            <p className="text-[12px] text-[#1D1D1F] font-medium mb-1">邀请码</p>
            <div className="flex items-center justify-center gap-2 mb-2">
               <span className="text-[24px] font-mono font-bold tracking-widest text-[#B93A32]">8829</span>
            </div>
            <p className="text-[10px] text-[#8E8E93]">有效期 7 天</p>
         </div>

         <div className="p-4 bg-[#F9F9F7] space-y-3">
            <button className="w-full py-3 bg-[#07C160] text-white rounded-[8px] font-bold flex items-center justify-center gap-2">
               {/* Lucide doesn't have WeChat, using Share2 as placeholder or custom SVG if available, keeping simple for now */}
               <Share2 className="w-4 h-4" /> 分享给微信好友
            </button>
            <button className="w-full py-3 bg-white border border-[#EBEBE6] text-[#1D1D1F] rounded-[8px] font-bold flex items-center justify-center gap-2">
               <Copy className="w-4 h-4" /> 复制链接
            </button>
         </div>
      </div>
    </motion.div>
  );
};
