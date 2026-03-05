import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, User, Calendar, MapPin, Phone, Mail, 
  Camera, Upload, X, Check, Users, Baby, Heart, UserPlus
} from 'lucide-react';
import { StatusNotice } from '../common/StatusNotice';

// --- Types ---

interface AddMemberFormData {
  name: string;
  generation: string;
  relationship: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  birthPlace: string;
  phone: string;
  email: string;
  bio: string;
  avatar: string | null;
}

interface AddMemberViewProps {
  onBack: () => void;
  onSave: (data: AddMemberFormData) => void;
  currentGeneration?: string;
}

// --- Constants ---

const GENERATIONS = [
  { id: '1', label: '第一代 · 祖辈', desc: '爷爷奶奶、外公外婆辈' },
  { id: '2', label: '第二代 · 父辈', desc: '父母、叔伯姑姨辈' },
  { id: '3', label: '第三代 · 吾辈', desc: '本人及兄弟姐妹辈' },
  { id: '4', label: '第四代 · 子辈', desc: '子女、侄子侄女辈' },
  { id: '5', label: '第五代 · 孙辈', desc: '孙子孙女辈' }
];

const RELATIONSHIPS = {
  '1': ['祖父', '祖母', '外祖父', '外祖母'],
  '2': ['父亲', '母亲', '伯父', '伯母', '叔父', '婶母', '姑父', '姑母', '舅父', '舅母', '姨父', '姨母'],
  '3': ['兄', '弟', '姐', '妹', '堂兄', '堂弟', '堂姐', '堂妹', '表兄', '表弟', '表姐', '表妹', '配偶'],
  '4': ['子', '女', '侄子', '侄女', '外甥', '外甥女'],
  '5': ['孙子', '孙女', '外孙', '外孙女']
};

// --- Sub-Components ---

const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 mt-2 px-6 font-serif flex items-center gap-2">
      <div className="w-1 h-4 bg-[#B93A32] rounded-full" />
      {title}
    </h3>
    <div className="bg-white rounded-[12px] border border-[#EBEBE6] overflow-hidden">
      {children}
    </div>
  </div>
);

const InputField = ({ 
  icon: Icon, 
  label, 
  placeholder, 
  value, 
  onChange,
  type = 'text',
  required = false
}: { 
  icon: any, 
  label: string, 
  placeholder: string, 
  value: string, 
  onChange: (v: string) => void,
  type?: string,
  required?: boolean
}) => (
  <div className="flex items-center px-6 py-4 border-b border-[#F5F5F7] last:border-b-0">
    <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center mr-3 shrink-0">
      <Icon className="w-4 h-4 text-[#8E8E93]" />
    </div>
    <div className="flex-1">
      <label className="text-[11px] text-[#8E8E93] mb-1 block">
        {label} {required && <span className="text-[#B93A32]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[14px] text-[#1D1D1F] outline-none bg-transparent placeholder:text-[#C7C7CC]"
      />
    </div>
  </div>
);

const TextAreaField = ({ 
  label, 
  placeholder, 
  value, 
  onChange 
}: { 
  label: string, 
  placeholder: string, 
  value: string, 
  onChange: (v: string) => void 
}) => (
  <div className="px-6 py-4">
    <label className="text-[11px] text-[#8E8E93] mb-2 block">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full text-[14px] text-[#1D1D1F] outline-none bg-transparent placeholder:text-[#C7C7CC] resize-none leading-relaxed"
    />
  </div>
);

const GenderSelector = ({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (v: 'male' | 'female') => void 
}) => (
  <div className="px-6 py-4">
    <label className="text-[11px] text-[#8E8E93] mb-3 block">性别</label>
    <div className="flex gap-3">
      <button
        onClick={() => onChange('male')}
        className={`flex-1 py-3 rounded-[8px] border transition-all ${
          value === 'male'
            ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF]'
            : 'border-[#EBEBE6] bg-[#F9F9F7] text-[#8E8E93]'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <User className="w-5 h-5" />
          <span className="text-[13px] font-medium">男</span>
        </div>
      </button>
      <button
        onClick={() => onChange('female')}
        className={`flex-1 py-3 rounded-[8px] border transition-all ${
          value === 'female'
            ? 'border-[#FF2D55] bg-[#FF2D55]/5 text-[#FF2D55]'
            : 'border-[#EBEBE6] bg-[#F9F9F7] text-[#8E8E93]'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-5 h-5" />
          <span className="text-[13px] font-medium">女</span>
        </div>
      </button>
    </div>
  </div>
);

const AvatarUploader = ({ 
  value, 
  onChange 
}: { 
  value: string | null, 
  onChange: (v: string | null) => void 
}) => (
  <div className="px-6 py-4">
    <label className="text-[11px] text-[#8E8E93] mb-3 block">头像照片</label>
    <div className="flex items-center gap-4">
      {value ? (
        <div className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-[#EBEBE6]">
          <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-24 h-24 rounded-[12px] bg-[#F5F5F7] border-2 border-dashed border-[#EBEBE6] flex flex-col items-center justify-center gap-1 text-[#C7C7CC]">
          <Camera className="w-6 h-6" />
          <span className="text-[10px]">添加照片</span>
        </div>
      )}
      <div className="flex-1">
        <button className="w-full py-2.5 bg-[#F9F9F7] border border-[#EBEBE6] rounded-[8px] text-[13px] text-[#1D1D1F] font-medium flex items-center justify-center gap-2 active:bg-[#EBEBE6] transition-colors">
          <Upload className="w-4 h-4" />
          从相册选择
        </button>
        <p className="text-[10px] text-[#C7C7CC] mt-2 leading-relaxed">
          建议上传清晰的正面照片，让家人更好地认识
        </p>
      </div>
    </div>
  </div>
);

const GenerationSelector = ({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (v: string) => void 
}) => (
  <div className="px-6 py-4">
    <label className="text-[11px] text-[#8E8E93] mb-3 block">
      选择辈分 <span className="text-[#B93A32]">*</span>
    </label>
    <div className="space-y-2">
      {GENERATIONS.map(gen => (
        <button
          key={gen.id}
          onClick={() => onChange(gen.id)}
          className={`w-full flex items-center justify-between p-3 rounded-[8px] border transition-all ${
            value === gen.id
              ? 'border-[#B93A32] bg-[#B93A32]/5'
              : 'border-[#EBEBE6] bg-[#F9F9F7]'
          }`}
        >
          <div className="text-left flex-1">
            <p className={`text-[13px] font-medium font-serif ${
              value === gen.id ? 'text-[#B93A32]' : 'text-[#1D1D1F]'
            }`}>
              {gen.label}
            </p>
            <p className="text-[10px] text-[#8E8E93] mt-0.5">{gen.desc}</p>
          </div>
          {value === gen.id && (
            <Check className="w-5 h-5 text-[#B93A32] ml-2" />
          )}
        </button>
      ))}
    </div>
  </div>
);

const RelationshipSelector = ({ 
  generation,
  value, 
  onChange 
}: { 
  generation: string,
  value: string, 
  onChange: (v: string) => void 
}) => {
  const relations = generation ? RELATIONSHIPS[generation as keyof typeof RELATIONSHIPS] || [] : [];

  return (
    <div className="px-6 py-4">
      <label className="text-[11px] text-[#8E8E93] mb-3 block">
        关系称谓 <span className="text-[#B93A32]">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {relations.map(rel => (
          <button
            key={rel}
            onClick={() => onChange(rel)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              value === rel
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-[#F5F5F7] text-[#8E8E93] border border-[#EBEBE6]'
            }`}
          >
            {rel}
          </button>
        ))}
        <button
          onClick={() => onChange('自定义')}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border border-dashed ${
            value === '自定义'
              ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
              : 'bg-white text-[#C7C7CC] border-[#C7C7CC]'
          }`}
        >
          + 自定义
        </button>
      </div>
      {value === '自定义' && (
        <input
          type="text"
          placeholder="请输入自定义称谓"
          className="w-full mt-3 px-4 py-2.5 border border-[#EBEBE6] rounded-[8px] text-[14px] text-[#1D1D1F] outline-none focus:border-[#B93A32] transition-colors"
        />
      )}
    </div>
  );
};

// --- Main Component ---

export const AddMemberView = ({ onBack, onSave, currentGeneration }: AddMemberViewProps) => {
  const [formData, setFormData] = useState<AddMemberFormData>({
    name: '',
    generation: currentGeneration || '',
    relationship: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    phone: '',
    email: '',
    bio: '',
    avatar: null
  });
  const [error, setError] = useState('');

  const updateField = (field: keyof AddMemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // 验证必填项
    if (!formData.name || !formData.generation || !formData.relationship) {
      setError('请填写必填信息：姓名、辈分、关系称谓');
      return;
    }
    setError('');
    onSave(formData);
  };

  const isValid = formData.name && formData.generation && formData.relationship;

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
          <h1 className="text-[17px] font-bold font-serif text-[#1D1D1F]">添加家族成员</h1>
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

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {error ? (
          <div className="px-6 pt-4">
            <StatusNotice kind="error" text={error} />
          </div>
        ) : null}
        {/* Avatar Section */}
        <FormSection title="照片信息">
          <AvatarUploader value={formData.avatar} onChange={(v) => updateField('avatar', v)} />
        </FormSection>

        {/* Basic Info */}
        <FormSection title="基本信息">
          <InputField
            icon={User}
            label="姓名"
            placeholder="请输入姓名"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            required
          />
          <GenderSelector value={formData.gender} onChange={(v) => updateField('gender', v)} />
          <InputField
            icon={Calendar}
            label="出生日期"
            placeholder="例如：1960-03-15 或 农历1960年二月初八"
            value={formData.birthDate}
            onChange={(v) => updateField('birthDate', v)}
          />
          <InputField
            icon={MapPin}
            label="出生地"
            placeholder="例如：江苏省苏州市"
            value={formData.birthPlace}
            onChange={(v) => updateField('birthPlace', v)}
          />
        </FormSection>

        {/* Family Relation */}
        <FormSection title="家族关系">
          <GenerationSelector value={formData.generation} onChange={(v) => updateField('generation', v)} />
          {formData.generation && (
            <RelationshipSelector 
              generation={formData.generation}
              value={formData.relationship} 
              onChange={(v) => updateField('relationship', v)} 
            />
          )}
        </FormSection>

        {/* Contact Info */}
        <FormSection title="联系方式">
          <InputField
            icon={Phone}
            label="手机号码"
            placeholder="用于家族成员联系"
            value={formData.phone}
            onChange={(v) => updateField('phone', v)}
            type="tel"
          />
          <InputField
            icon={Mail}
            label="电子邮箱"
            placeholder="可选填写"
            value={formData.email}
            onChange={(v) => updateField('email', v)}
            type="email"
          />
        </FormSection>

        {/* Bio */}
        <FormSection title="人物小传">
          <TextAreaField
            label="简短介绍"
            placeholder="记录Ta的性格特点、职业经历、兴趣爱好等，让后人更好地了解..."
            value={formData.bio}
            onChange={(v) => updateField('bio', v)}
          />
        </FormSection>

        {/* Tips */}
        <div className="mx-6 mt-6 p-4 bg-[#FFF9F5] border border-[#FFE5B4] rounded-[12px]">
          <div className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 text-[#FF9500] mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] text-[#1D1D1F] mb-1 font-medium">温馨提示</p>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                添加成员后，可邀请Ta加入家族空间，一起协作完善家谱信息。也可以代为录入后，将档案转交给本人管理。
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
