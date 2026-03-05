import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, MapPin, User, FileText, Save, Sparkles } from 'lucide-react';

interface SupplementInfoViewProps {
  onClose: () => void;
  taskTitle: string;
}

export const SupplementInfoView = ({ onClose, taskTitle }: SupplementInfoViewProps) => {
  const [formData, setFormData] = useState({
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    deathYear: '',
    deathMonth: '',
    deathDay: '',
    birthplace: '',
    notes: ''
  });

  const handleSubmit = () => {
    // Submit logic here
    console.log('Submitting data:', formData);
    onClose();
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
            补充信息
          </h1>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 rounded-[8px] bg-[#B93A32] text-white text-[14px] font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 pb-24">
        {/* Task Info */}
        <div className="bg-[#FDFBF7] border border-[#C5A059]/20 rounded-[16px] p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#1D1D1F] font-serif mb-1">{taskTitle}</h3>
              <p className="text-[12px] text-[#8E8E93]">完成此任务可获得 <span className="text-[#C5A059] font-bold">+50 贡献值</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* 出生信息 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
              <Calendar className="w-4 h-4 text-[#B93A32]" />
              出生时间（公历）
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="年"
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                className="flex-1 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
              <input
                type="text"
                placeholder="月"
                value={formData.birthMonth}
                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                className="w-20 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
              <input
                type="text"
                placeholder="日"
                value={formData.birthDay}
                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                className="w-20 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
            </div>
          </div>

          {/* 逝世信息 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
              <Calendar className="w-4 h-4 text-[#8E8E93]" />
              逝世时间（公历）
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="年"
                value={formData.deathYear}
                onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                className="flex-1 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
              <input
                type="text"
                placeholder="月"
                value={formData.deathMonth}
                onChange={(e) => setFormData({ ...formData, deathMonth: e.target.value })}
                className="w-20 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
              <input
                type="text"
                placeholder="日"
                value={formData.deathDay}
                onChange={(e) => setFormData({ ...formData, deathDay: e.target.value })}
                className="w-20 px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
              />
            </div>
          </div>

          {/* 籍贯 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
              <MapPin className="w-4 h-4 text-[#B93A32]" />
              籍贯
            </label>
            <input
              type="text"
              placeholder="例如：福建省福州市"
              value={formData.birthplace}
              onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
              className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
              <FileText className="w-4 h-4 text-[#8E8E93]" />
              备注说明（选填）
            </label>
            <textarea
              placeholder="可补充其他相关信息..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32] resize-none"
            />
          </div>

          {/* Tips */}
          <div className="bg-white rounded-[12px] p-4 border border-[#EBEBE6]">
            <h4 className="text-[13px] font-bold text-[#1D1D1F] mb-2">💡 温馨提示</h4>
            <ul className="space-y-1.5 text-[12px] text-[#8E8E93]">
              <li>• 如果不确定具体日期，可只填写年份</li>
              <li>• 信息将经过其他成员确认后更新到家谱</li>
              <li>• 准确的生卒年份有助于完善家族时间轴</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
