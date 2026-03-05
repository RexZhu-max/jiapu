import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { StatusNotice } from '../common/StatusNotice';

interface MemberEditProps {
  member: any;
  onCancel: () => void;
  onSave: (data: any) => void | Promise<void>;
}

export const MemberEditView = ({ member, onCancel, onSave }: MemberEditProps) => {
  const [form, setForm] = useState({
    name: member.name || '',
    role: member.role || '',
    birth: member.birth || '',
    bio: member.bio || '',
    img: member.img || '',
    gender: member.gender || 'male',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = form.name.trim();
    const role = form.role.trim();
    if (!name) {
      setError('姓名不能为空');
      return;
    }
    if (!role) {
      setError('称谓/角色不能为空');
      return;
    }
    const birth = form.birth.trim();
    if (birth && !/^\\d{4}(-\\d{1,2}-\\d{1,2})?$/.test(birth)) {
      setError('出生日期格式应为 YYYY 或 YYYY-MM-DD');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        name,
        role,
        birth,
        bio: form.bio.trim(),
        img: form.img.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 z-[160] bg-[#F9F9F7] flex flex-col"
    >
      <div className="flex items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-[#EBEBE6]">
        <button onClick={onCancel} className="text-[14px] text-[#8E8E93]">
          取消
        </button>
        <span className="text-[16px] font-bold text-[#1D1D1F]">编辑资料</span>
        <button onClick={handleSave} disabled={saving} className="text-[14px] font-bold text-[#B93A32] disabled:opacity-60">
          {saving ? '保存中' : '保存'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error ? <StatusNotice kind="error" text={error} className="mb-4" /> : null}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 rounded-full bg-[#E5E5EA] border border-[#EBEBE6] overflow-hidden mb-3">
            {form.img ? <img src={form.img} className="w-full h-full object-cover grayscale-[0.2]" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-[#8E8E93]">{form.name?.[0] || '人'}</div>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[12px] px-4 border border-[#EBEBE6]">
            <div className="py-3 border-b border-[#F5F5F7] flex items-center">
              <label className="w-20 text-[14px] text-[#1D1D1F] font-medium">姓名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="flex-1 text-[14px] text-[#1D1D1F] outline-none text-right"
              />
            </div>
            <div className="py-3 border-b border-[#F5F5F7] flex items-center">
              <label className="w-20 text-[14px] text-[#1D1D1F] font-medium">称谓/角色</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="flex-1 text-[14px] text-[#1D1D1F] outline-none text-right"
              />
            </div>
            <div className="py-3 flex items-center">
              <label className="w-20 text-[14px] text-[#1D1D1F] font-medium">性别</label>
              <div className="flex-1 flex justify-end gap-4">
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    type="radio"
                    name="gender"
                    checked={form.gender === 'male'}
                    onChange={() => setForm((prev) => ({ ...prev, gender: 'male' }))}
                    className="accent-[#B93A32]"
                  />
                  男
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input
                    type="radio"
                    name="gender"
                    checked={form.gender === 'female'}
                    onChange={() => setForm((prev) => ({ ...prev, gender: 'female' }))}
                    className="accent-[#B93A32]"
                  />
                  女
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[12px] px-4 border border-[#EBEBE6]">
            <div className="py-3 border-b border-[#F5F5F7] flex items-center">
              <label className="w-20 text-[14px] text-[#1D1D1F] font-medium">出生日期</label>
              <input
                type="text"
                value={form.birth}
                onChange={(e) => setForm((prev) => ({ ...prev, birth: e.target.value }))}
                className="flex-1 text-[14px] text-[#1D1D1F] outline-none text-right"
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="py-3 flex items-center">
              <label className="w-20 text-[14px] text-[#1D1D1F] font-medium">头像链接</label>
              <input
                type="text"
                value={form.img}
                onChange={(e) => setForm((prev) => ({ ...prev, img: e.target.value }))}
                className="flex-1 text-[14px] text-[#1D1D1F] outline-none text-right"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-4 border border-[#EBEBE6]">
            <label className="block text-[14px] text-[#1D1D1F] font-medium mb-2">生平简介</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full h-32 text-[14px] text-[#1D1D1F] leading-relaxed resize-none outline-none"
              placeholder="记录他/她的一生..."
            />
          </div>

          <button className="w-full py-3 bg-white border border-[#B93A32] text-[#B93A32] rounded-[8px] text-[14px] font-medium flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
            <Trash2 className="w-4 h-4" />
            删除成员（后续支持）
          </button>
        </div>
      </div>
    </motion.div>
  );
};
