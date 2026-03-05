import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, Calendar, MapPin, Users, Check, Sparkles } from 'lucide-react';

interface UploadPhotoViewProps {
  onClose: () => void;
  taskTitle: string;
}

export const UploadPhotoView = ({ onClose, taskTitle }: UploadPhotoViewProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [photoDate, setPhotoDate] = useState('');
  const [location, setLocation] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);

  const handleImageSelect = () => {
    // Mock image selection
    const mockImages = [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800',
    ];
    setSelectedImages(mockImages);
  };

  const handleSubmit = () => {
    console.log('Uploading photos...');
    onClose();
  };

  const familyMembers = ['祖父', '祖母', '父亲', '母亲', '二伯', '三叔'];

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
            上传照片
          </h1>
          <button 
            onClick={handleSubmit}
            disabled={selectedImages.length === 0}
            className="px-4 py-2 rounded-[8px] bg-[#B93A32] text-white text-[14px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上传
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
              <p className="text-[12px] text-[#8E8E93]">完成此任务可获得 <span className="text-[#C5A059] font-bold">+30 贡献值</span></p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
            <ImageIcon className="w-4 h-4 text-[#B93A32]" />
            选择照片
          </label>
          
          {selectedImages.length === 0 ? (
            <button 
              onClick={handleImageSelect}
              className="w-full aspect-[4/3] rounded-[16px] border-2 border-dashed border-[#EBEBE6] bg-white flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#8E8E93]" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1D1D1F] mb-1">点击上传照片</p>
                <p className="text-[12px] text-[#8E8E93]">支持 JPG、PNG 格式</p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-[12px] overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
              <button 
                onClick={handleImageSelect}
                className="aspect-square rounded-[12px] border-2 border-dashed border-[#EBEBE6] bg-white flex items-center justify-center"
              >
                <Upload className="w-6 h-6 text-[#8E8E93]" />
              </button>
            </div>
          )}
        </div>

        {/* Photo Details */}
        <AnimatePresence>
          {selectedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Date */}
              <div>
                <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
                  <Calendar className="w-4 h-4 text-[#B93A32]" />
                  拍摄时间
                </label>
                <input
                  type="text"
                  placeholder="例如：1990年春节"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
                  <MapPin className="w-4 h-4 text-[#B93A32]" />
                  拍摄地点
                </label>
                <input
                  type="text"
                  placeholder="例如：老宅院前"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#EBEBE6] text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B93A32]"
                />
              </div>

              {/* Tag People */}
              <div>
                <label className="flex items-center gap-2 text-[14px] font-bold text-[#1D1D1F] mb-3">
                  <Users className="w-4 h-4 text-[#B93A32]" />
                  照片中的人物
                </label>
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map((person) => (
                    <button
                      key={person}
                      onClick={() => {
                        if (taggedPeople.includes(person)) {
                          setTaggedPeople(taggedPeople.filter(p => p !== person));
                        } else {
                          setTaggedPeople([...taggedPeople, person]);
                        }
                      }}
                      className={`px-3 py-2 rounded-[8px] text-[13px] font-medium border transition-all ${
                        taggedPeople.includes(person)
                          ? 'bg-[#B93A32] text-white border-[#B93A32]'
                          : 'bg-white text-[#1D1D1F] border-[#EBEBE6]'
                      }`}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-[12px] p-4 border border-[#EBEBE6]">
                <h4 className="text-[13px] font-bold text-[#1D1D1F] mb-2">📸 照片说明</h4>
                <ul className="space-y-1.5 text-[12px] text-[#8E8E93]">
                  <li>• 照片将自动添加到相关成员的时间轴中</li>
                  <li>• 标注的人物可以收到通知，共同完善照片信息</li>
                  <li>• 您可以随时编辑照片的时间和地点信息</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
