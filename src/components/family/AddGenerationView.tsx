import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, ArrowUp, ArrowDown, Users, 
  Info, Sparkles, Check, AlertCircle
} from 'lucide-react';
import { StatusNotice } from '../common/StatusNotice';

// --- Types ---

interface AddGenerationViewProps {
  onBack: () => void;
  onSave: (data: GenerationData) => void;
  existingGenerations: string[];
}

interface GenerationData {
  title: string;
  order: number;
  description: string;
  position: 'before' | 'after';
  referenceGen?: string;
}

// --- Sub-Components ---

const DirectionSelector = ({ 
  value, 
  onChange 
}: { 
  value: 'before' | 'after', 
  onChange: (v: 'before' | 'after') => void 
}) => (
  <div className="space-y-3">
    <button
      onClick={() => onChange('before')}
      className={`w-full flex items-start gap-4 p-4 rounded-[12px] border-2 transition-all ${
        value === 'before'
          ? 'border-[#B93A32] bg-[#B93A32]/5'
          : 'border-[#EBEBE6] bg-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        value === 'before' ? 'bg-[#B93A32]/20' : 'bg-[#F5F5F7]'
      }`}>
        <ArrowUp className={`w-5 h-5 ${value === 'before' ? 'text-[#B93A32]' : 'text-[#8E8E93]'}`} />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-[15px] font-bold font-serif ${
            value === 'before' ? 'text-[#B93A32]' : 'text-[#1D1D1F]'
          }`}>
            向上追溯
          </p>
          {value === 'before' && <Check className="w-4 h-4 text-[#B93A32]" />}
        </div>
        <p className="text-[12px] text-[#8E8E93] leading-relaxed">
          添加更早的祖辈，如曾祖父母、高祖父母等
        </p>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-[#C5A059]">
          <Sparkles className="w-3 h-3" />
          <span>追根溯源，延续家族血脉</span>
        </div>
      </div>
    </button>

    <button
      onClick={() => onChange('after')}
      className={`w-full flex items-start gap-4 p-4 rounded-[12px] border-2 transition-all ${
        value === 'after'
          ? 'border-[#B93A32] bg-[#B93A32]/5'
          : 'border-[#EBEBE6] bg-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        value === 'after' ? 'bg-[#B93A32]/20' : 'bg-[#F5F5F7]'
      }`}>
        <ArrowDown className={`w-5 h-5 ${value === 'after' ? 'text-[#B93A32]' : 'text-[#8E8E93]'}`} />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-[15px] font-bold font-serif ${
            value === 'after' ? 'text-[#B93A32]' : 'text-[#1D1D1F]'
          }`}>
            向下延续
          </p>
          {value === 'after' && <Check className="w-4 h-4 text-[#B93A32]" />}
        </div>
        <p className="text-[12px] text-[#8E8E93] leading-relaxed">
          添加更晚的后代，如曾孙、玄孙等
        </p>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-[#34C759]">
          <Users className="w-3 h-3" />
          <span>开枝散叶，传承家族未来</span>
        </div>
      </div>
    </button>
  </div>
);

const GenerationNameInput = ({ 
  value, 
  onChange,
  position,
  existingCount
}: { 
  value: string, 
  onChange: (v: string) => void,
  position: 'before' | 'after',
  existingCount: number
}) => {
  const suggestions = position === 'before' 
    ? [
        { label: '曾祖辈', desc: '曾祖父母一代' },
        { label: '高祖辈', desc: '高祖父母一代' },
        { label: '天祖辈', desc: '天祖父母一代' }
      ]
    : [
        { label: '曾孙辈', desc: '曾孙子女一代' },
        { label: '玄孙辈', desc: '玄孙子女一代' },
        { label: '来孙辈', desc: '来孙子女一代' }
      ];

  const generationNumber = position === 'before' ? 0 : existingCount + 1;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[13px] text-[#1D1D1F] font-medium mb-3 block font-serif">
          辈分名称 <span className="text-[#B93A32]">*</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`例如：第${generationNumber === 0 ? '零' : generationNumber}代 · ${suggestions[0].label}`}
          className="w-full px-4 py-3 border-2 border-[#EBEBE6] rounded-[8px] text-[15px] text-[#1D1D1F] outline-none focus:border-[#B93A32] transition-colors font-serif"
        />
      </div>

      <div>
        <p className="text-[12px] text-[#8E8E93] mb-2">快速选择：</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(sug => (
            <button
              key={sug.label}
              onClick={() => onChange(`第${generationNumber === 0 ? '零' : generationNumber}代 · ${sug.label}`)}
              className="px-3 py-2 bg-[#F5F5F7] border border-[#EBEBE6] rounded-full text-[12px] text-[#1D1D1F] active:bg-[#EBEBE6] transition-colors"
            >
              {sug.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GenerationDescInput = ({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (v: string) => void 
}) => (
  <div>
    <label className="text-[13px] text-[#1D1D1F] font-medium mb-3 block font-serif">
      辈分说明
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="可选：简述这一代人的特点、年代背景等..."
      rows={3}
      className="w-full px-4 py-3 border-2 border-[#EBEBE6] rounded-[8px] text-[14px] text-[#1D1D1F] outline-none focus:border-[#B93A32] transition-colors resize-none leading-relaxed"
    />
  </div>
);

const PreviewCard = ({ 
  title, 
  description,
  position,
  existingCount
}: { 
  title: string, 
  description: string,
  position: 'before' | 'after',
  existingCount: number
}) => {
  const order = position === 'before' ? 0 : existingCount + 1;
  
  return (
    <div className="bg-gradient-to-br from-[#F9F9F7] to-white p-6 rounded-[16px] border-2 border-[#EBEBE6]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#B93A32]/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#B93A32]" />
          </div>
          <div>
            <p className="text-[11px] text-[#8E8E93]">预览效果</p>
            <p className="text-[10px] text-[#C7C7CC]">保存后将显示</p>
          </div>
        </div>
        <div className="px-2 py-1 bg-[#B93A32]/10 rounded-[4px]">
          <p className="text-[10px] text-[#B93A32] font-medium">
            {position === 'before' ? '最上方' : '最下方'}
          </p>
        </div>
      </div>

      <div className="bg-white px-4 py-3 rounded-[12px] border border-[#EBEBE6] shadow-sm">
        <p className="text-[15px] font-bold text-[#B93A32] font-serif tracking-widest text-center">
          {title || '第X代 · 辈分名称'}
        </p>
        {description && (
          <p className="text-[11px] text-[#8E8E93] text-center mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-8 text-[#C7C7CC]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border-2 border-dashed border-[#EBEBE6]" />
          <p className="text-[9px] mt-1.5">成员头像</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border-2 border-dashed border-[#EBEBE6]" />
          <p className="text-[9px] mt-1.5">成员头像</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] border-2 border-dashed border-[#EBEBE6] flex items-center justify-center">
            <span className="text-[20px] text-[#C7C7CC]">+</span>
          </div>
          <p className="text-[9px] mt-1.5">添加成员</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export const AddGenerationView = ({ onBack, onSave, existingGenerations }: AddGenerationViewProps) => {
  const [position, setPosition] = useState<'before' | 'after'>('after');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('请输入辈分名称');
      return;
    }
    setError('');

    const data: GenerationData = {
      title: title.trim(),
      order: position === 'before' ? 0 : existingGenerations.length + 1,
      description: description.trim(),
      position
    };

    onSave(data);
  };

  const isValid = title.trim().length > 0;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[150] bg-[#F9F9F7] flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-[#EBEBE6] px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-black/5"
          >
            <ChevronRight className="w-6 h-6 rotate-180 text-[#1D1D1F]" />
          </button>
          <h1 className="text-[17px] font-bold font-serif text-[#1D1D1F]">增加代系</h1>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`text-[15px] font-medium transition-colors ${
              isValid ? 'text-[#007AFF]' : 'text-[#C7C7CC]'
            }`}
          >
            保存
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-8">
        {error ? <StatusNotice kind="error" text={error} /> : null}
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-[#FFF9F5] to-[#FFFBF7] p-4 rounded-[12px] border border-[#FFE5B4]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-[#FF9500]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-[#1D1D1F] font-medium mb-1">关于代系</p>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                代系是家族谱系的纵向层级，通常按"祖辈→父辈→吾辈→子辈→孙辈"排列。您可以根据家族实际情况，向上追溯或向下延续。
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 font-serif flex items-center gap-2">
            <div className="w-1 h-4 bg-[#B93A32] rounded-full" />
            当前谱系状态
          </h3>
          <div className="bg-white rounded-[12px] border border-[#EBEBE6] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-[#8E8E93]">已记录代系</span>
              <span className="text-[16px] font-bold text-[#B93A32] font-serif">
                {existingGenerations.length} 代
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {existingGenerations.map((gen, i) => (
                <div 
                  key={i}
                  className="px-2 py-1 bg-[#F5F5F7] rounded-[4px] text-[10px] text-[#555] border border-[#EBEBE6]"
                >
                  {gen}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direction Selection */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 font-serif flex items-center gap-2">
            <div className="w-1 h-4 bg-[#B93A32] rounded-full" />
            选择添加方向
          </h3>
          <DirectionSelector value={position} onChange={setPosition} />
        </div>

        {/* Name Input */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 font-serif flex items-center gap-2">
            <div className="w-1 h-4 bg-[#B93A32] rounded-full" />
            填写辈分信息
          </h3>
          <div className="bg-white rounded-[12px] border border-[#EBEBE6] p-5 space-y-5">
            <GenerationNameInput 
              value={title} 
              onChange={setTitle}
              position={position}
              existingCount={existingGenerations.length}
            />
            <div className="h-[1px] bg-[#F5F5F7]" />
            <GenerationDescInput value={description} onChange={setDescription} />
          </div>
        </div>

        {/* Preview */}
        {title && (
          <div>
            <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 font-serif flex items-center gap-2">
              <div className="w-1 h-4 bg-[#B93A32] rounded-full" />
              效果预览
            </h3>
            <PreviewCard 
              title={title} 
              description={description}
              position={position}
              existingCount={existingGenerations.length}
            />
          </div>
        )}

        {/* Warning */}
        <div className="bg-[#FFF3F3] border border-[#FFD4D4] rounded-[12px] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#B93A32] mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] text-[#B93A32] font-medium mb-1">保存后注意</p>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                新增代系后，原有代系顺序将自动调整。建议确认无误后再保存，以免影响已录入的家族成员关系。
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
