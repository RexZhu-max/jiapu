import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, Search, ZoomIn, ZoomOut, Share2, Layers } from 'lucide-react';
import { MemberProfileView } from './MemberProfileView';
import { MemberEditView } from './MemberEditView';
import { AddMemberView } from './AddMemberView';
import { AddGenerationView } from './AddGenerationView';
import { createGeneration, createMember, getFamilyTree, subscribeRealtime, updateMember } from '../../lib/api';
import { StatusNotice } from '../common/StatusNotice';
import { trackEvent } from '../../lib/telemetry';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  birth: string;
  bio: string;
  memories: number;
  img: string | null;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  phone?: string;
  email?: string;
}

interface Generation {
  id?: string;
  title: string;
  members: FamilyMember[];
}

const FALLBACK_GENERATIONS: Generation[] = [
  {
    title: '第一代 · 祖辈',
    members: [
      { id: 'm_1', name: '林国强', role: '祖父', birth: '1932', bio: '曾任县中学校长，喜好书法。', memories: 12, img: null },
      { id: 'm_2', name: '王秀英', role: '祖母', birth: '1935', bio: '勤劳善良。', memories: 8, img: null },
    ],
  },
  {
    title: '第二代 · 父辈',
    members: [
      { id: 'm_3', name: '林建国', role: '父亲', birth: '1960', bio: '工程师，爱好无线电。', memories: 24, img: null },
      { id: 'm_4', name: '李梅', role: '母亲', birth: '1962', bio: '中学语文老师。', memories: 18, img: null },
    ],
  },
];

interface FamilyTreeViewProps {
  token: string;
  onBack: () => void;
}

export const FamilyTreeView = ({ token, onBack }: FamilyTreeViewProps) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'profile' | 'edit' | 'addMember' | 'addGeneration'>('tree');
  const [scale, setScale] = useState(1);
  const [generations, setGenerations] = useState<Generation[]>(FALLBACK_GENERATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTree = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getFamilyTree(token);
      setGenerations(data.generations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '家谱加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime(token, (event) => {
      if (event.type === 'family-tree-updated') {
        fetchTree();
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleOpenProfile = () => setViewMode('profile');
  const handleOpenEdit = () => setViewMode('edit');
  const handleCloseSubView = () => setViewMode('tree');

  const generationMap: Record<string, string> = {
    '1': '第一代 · 祖辈',
    '2': '第二代 · 父辈',
    '3': '第三代 · 吾辈',
    '4': '第四代 · 子辈',
    '5': '第五代 · 孙辈',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#F9F9F7] flex flex-col"
    >
      <div className="flex items-center justify-between px-6 pt-14 pb-4 bg-[#F9F9F7]/90 backdrop-blur-sm z-20 sticky top-0 border-b border-[#EBEBE6]">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-[#8E8E93]">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <span className="text-[17px] font-bold text-[#1D1D1F] tracking-widest font-serif">林氏谱系</span>
        <div className="flex gap-2">
          <button className="p-2 text-[#1D1D1F]">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#1D1D1F]">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute top-28 right-6 z-10 flex flex-col gap-2 bg-white rounded-[8px] border border-[#EBEBE6] shadow-sm p-1">
        <button onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))} className="p-2 hover:bg-[#F5F5F7] rounded">
          <ZoomIn className="w-4 h-4 text-[#1D1D1F]" />
        </button>
        <div className="h-[1px] bg-[#F5F5F7]" />
        <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))} className="p-2 hover:bg-[#F5F5F7] rounded">
          <ZoomOut className="w-4 h-4 text-[#1D1D1F]" />
        </button>
      </div>

      <button
        onClick={() => setViewMode('addGeneration')}
        className="fixed bottom-8 right-6 z-10 w-14 h-14 rounded-full bg-gradient-to-br from-[#B93A32] to-[#8E2219] text-white shadow-[0_8px_20px_rgba(185,58,50,0.4)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <Layers className="w-6 h-6" />
      </button>

      <div className="flex-1 overflow-y-auto p-6 pb-24 relative overflow-x-hidden">
        {error ? <StatusNotice kind="error" text={error} className="mb-3" /> : null}
        {success ? <StatusNotice kind="success" text={success} className="mb-3" /> : null}
        {loading ? <StatusNotice kind="loading" text="家谱加载中..." className="mb-3" /> : null}

        <motion.div style={{ scale }} className="min-h-full origin-top">
          <div className="absolute left-[50%] top-6 bottom-0 w-[1px] bg-[#EBEBE6] -translate-x-1/2 z-0" />

          <div className="space-y-16 relative z-10 pt-8 pb-20">
            {generations.map((gen, genIndex) => (
              <div key={gen.id || gen.title} className="flex flex-col items-center">
                <div className="bg-[#F9F9F7] px-4 py-1.5 border border-[#EBEBE6] rounded-full mb-8 z-10 shadow-sm">
                  <span className="text-[13px] text-[#B93A32] font-serif tracking-widest font-bold">{gen.title}</span>
                </div>

                <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 w-full max-w-3xl">
                  {gen.members.map((member) => (
                    <div key={member.id} className="flex flex-col items-center group relative cursor-pointer" onClick={() => setSelectedMember(member)}>
                      {genIndex > 0 ? <div className="absolute -top-10 left-1/2 w-[1px] h-10 bg-[#EBEBE6] -translate-x-1/2" /> : null}

                      <div className="relative w-20 h-20 rounded-full p-[3px] bg-white border border-[#EBEBE6] shadow-[0_4px_12px_rgba(0,0,0,0.05)] group-hover:border-[#B93A32] group-hover:scale-110 transition-all duration-300 z-10">
                        {member.img ? (
                          <img src={member.img} alt={member.name} className="w-full h-full rounded-full object-cover grayscale-[0.1]" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#C7C7CC] font-serif text-2xl font-bold">
                            {member.name[0]}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-center">
                        <p className="text-[15px] font-bold text-[#1D1D1F] font-serif leading-tight">{member.name}</p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5">{member.role}</p>
                      </div>
                    </div>
                  ))}

                  <div onClick={() => setViewMode('addMember')} className="flex flex-col items-center group relative cursor-pointer opacity-60 hover:opacity-100">
                    {genIndex > 0 ? <div className="absolute -top-10 left-1/2 w-[1px] h-10 bg-[#EBEBE6] dashed -translate-x-1/2" /> : null}
                    <div className="w-20 h-20 rounded-full bg-[#F5F5F7] border border-dashed border-[#C7C7CC] flex items-center justify-center text-[#C7C7CC] group-hover:border-[#C5A059] group-hover:text-[#C5A059] transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-[12px] text-[#8E8E93]">添加成员</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedMember && viewMode === 'tree' ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110]"
            />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-[120] p-6 pb-12">
              <div className="flex gap-5">
                <div className="w-24 h-32 rounded-[8px] bg-[#F5F5F7] overflow-hidden shrink-0 border border-[#EBEBE6]">
                  {selectedMember.img ? (
                    <img src={selectedMember.img} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C7C7CC] text-4xl font-serif">{selectedMember.name[0]}</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[24px] font-bold text-[#1D1D1F] font-serif mb-1">{selectedMember.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#B93A32]/10 text-[#B93A32] text-[11px] rounded-[2px] font-medium">{selectedMember.role}</span>
                    <span className="text-[12px] text-[#8E8E93]">生于 {selectedMember.birth}</span>
                  </div>
                  <p className="text-[13px] text-[#555] leading-relaxed line-clamp-2 mb-3">{selectedMember.bio}</p>
                  <div className="flex gap-3">
                    <button onClick={handleOpenProfile} className="flex-1 py-2 bg-[#1D1D1F] text-[#F9F9F7] text-[12px] rounded-[4px] font-medium">
                      查看档案
                    </button>
                    <button onClick={handleOpenEdit} className="flex-1 py-2 border border-[#EBEBE6] text-[#1D1D1F] text-[12px] rounded-[4px] font-medium">
                      编辑资料
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === 'profile' && selectedMember ? <MemberProfileView member={selectedMember} onBack={handleCloseSubView} onEdit={handleOpenEdit} /> : null}

        {viewMode === 'edit' && selectedMember ? (
          <MemberEditView
            member={selectedMember}
            onCancel={handleCloseSubView}
            onSave={async (data) => {
              try {
                setError('');
                const result = await updateMember(token, selectedMember.id, data);
                setGenerations(result.generations || []);
                setSelectedMember((prev) => (prev ? { ...prev, ...data } : prev));
                setSuccess('成员信息已更新');
                setTimeout(() => setSuccess(''), 1500);
                trackEvent('family.member.update.success', { memberId: selectedMember.id });
                handleCloseSubView();
              } catch (err) {
                setError(err instanceof Error ? err.message : '成员保存失败');
                setSuccess('');
                trackEvent('family.member.update.failed', { message: err instanceof Error ? err.message : '成员保存失败' });
                throw err;
              }
            }}
          />
        ) : null}

        {viewMode === 'addMember' ? (
          <AddMemberView
            onBack={handleCloseSubView}
            onSave={async (data) => {
              try {
                setError('');
                const result = await createMember(token, {
                  name: data.name,
                  role: data.relationship || '成员',
                  birth: data.birthDate ? String(data.birthDate).slice(0, 4) : '',
                  bio: data.bio,
                  img: data.avatar,
                  generationTitle: generationMap[data.generation] || `第${data.generation}代`,
                  gender: data.gender,
                  birthDate: data.birthDate,
                  birthPlace: data.birthPlace,
                  phone: data.phone,
                  email: data.email,
                });
                setGenerations(result.generations || []);
                setSuccess('已新增家族成员');
                setTimeout(() => setSuccess(''), 1500);
                trackEvent('family.member.create.success', { generation: data.generation });
                handleCloseSubView();
              } catch (err) {
                setError(err instanceof Error ? err.message : '新增成员失败');
                setSuccess('');
                trackEvent('family.member.create.failed', { message: err instanceof Error ? err.message : '新增成员失败' });
              }
            }}
          />
        ) : null}

        {viewMode === 'addGeneration' ? (
          <AddGenerationView
            onBack={handleCloseSubView}
            onSave={async (data) => {
              try {
                setError('');
                const result = await createGeneration(token, {
                  title: data.title,
                  description: data.description,
                  position: data.position,
                });
                setGenerations(result.generations || []);
                setSuccess('已新增代系');
                setTimeout(() => setSuccess(''), 1500);
                trackEvent('family.generation.create.success', { title: data.title, position: data.position });
                handleCloseSubView();
              } catch (err) {
                setError(err instanceof Error ? err.message : '新增代系失败');
                setSuccess('');
                trackEvent('family.generation.create.failed', { message: err instanceof Error ? err.message : '新增代系失败' });
              }
            }}
            existingGenerations={generations.map((g) => g.title)}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
