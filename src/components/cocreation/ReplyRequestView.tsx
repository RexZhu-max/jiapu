import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Mic, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ReplyRequestViewProps {
  onClose: () => void;
  taskTitle: string;
}

export const ReplyRequestView = ({ onClose, taskTitle }: ReplyRequestViewProps) => {
  const [reply, setReply] = useState('');

  const handleSend = () => {
    if (reply.trim()) {
      console.log('Sending reply:', reply);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#F9F9F7] z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#F9F9F7]/95 backdrop-blur-xl z-10 border-b border-[#EBEBE6]">
        <div className="flex items-center justify-between px-6 h-16">
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[#1D1D1F]" />
          </button>
          <h1 className="text-[16px] font-bold text-[#1D1D1F] font-serif absolute left-1/2 -translate-x-1/2">
            协助请求
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-6 pt-6 pb-24">
        {/* Reward Info */}
        <div className="bg-[#FDFBF7] border border-[#C5A059]/20 rounded-[16px] p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#1D1D1F] font-serif mb-1">帮助家人解答疑问</h3>
              <p className="text-[12px] text-[#8E8E93]">回复后可获得 <span className="text-[#C5A059] font-bold">+20 贡献值</span></p>
            </div>
          </div>
        </div>

        {/* Request Card */}
        <div className="bg-white rounded-[16px] border border-[#EBEBE6] p-4 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              alt="二伯"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[15px] font-bold text-[#1D1D1F]">二伯</span>
                <span className="text-[11px] text-[#8E8E93]">2小时前</span>
              </div>
              <div className="px-2 py-1 rounded-[4px] bg-[#F5F5F7] text-[10px] text-[#8E8E93] w-fit">
                询问信息
              </div>
            </div>
          </div>

          <div className="bg-[#F9F9F7] rounded-[12px] p-4">
            <h3 className="text-[15px] font-bold text-[#1D1D1F] font-serif mb-2">
              {taskTitle.replace('二伯请求协助', '关于老宅拆迁前的门牌号')}
            </h3>
            <p className="text-[14px] text-[#1D1D1F] leading-relaxed mb-3">
              我记得老宅在拆迁之前应该有个正式的门牌号，但是我怎么也想不起来了。有谁还记得吗？这个信息对我整理老照片很重要。
            </p>
            <p className="text-[12px] text-[#8E8E93]">
              老宅大概在1985年左右拆迁的，位置应该是在老街那一片。
            </p>
          </div>
        </div>

        {/* Previous Replies */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3">已有回复 (1)</h3>
          
          <div className="bg-white rounded-[12px] border border-[#EBEBE6] p-4">
            <div className="flex items-start gap-3">
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100"
                className="w-10 h-10 rounded-full object-cover"
                alt="林梅"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-[#1D1D1F]">林梅</span>
                  <span className="text-[11px] text-[#8E8E93]">1小时前</span>
                </div>
                <p className="text-[13px] text-[#1D1D1F] leading-relaxed">
                  我记得好像是"福兴街52号"，因为当时我们家门口有一棵大榕树，隔壁就是50号。不知道记得对不对。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reply Input */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3">我的回复</h3>
          
          <div className="bg-white rounded-[16px] border border-[#EBEBE6] overflow-hidden">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="分享您知道的信息..."
              rows={6}
              className="w-full px-4 py-4 text-[14px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none resize-none"
            />
            
            <div className="border-t border-[#EBEBE6] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] active:scale-95 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] active:scale-95 transition-transform">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={!reply.trim()}
                className="px-5 py-2.5 rounded-[8px] bg-[#B93A32] text-white text-[14px] font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
                发送回复
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-4 bg-[#F5F5F7] rounded-[12px] p-4">
            <h4 className="text-[13px] font-bold text-[#1D1D1F] mb-2">💡 温馨提示</h4>
            <ul className="space-y-1.5 text-[12px] text-[#8E8E93]">
              <li>• 您可以分享照片或录音来补充说明</li>
              <li>• 回复后二伯将收到通知</li>
              <li>• 准确的信息有助于完善家族档案</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
