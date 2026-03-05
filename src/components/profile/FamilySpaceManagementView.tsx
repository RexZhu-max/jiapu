import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Shield, MoreVertical, Plus, 
  Crown, User, Trash2, ChevronRight, 
  AlertCircle, Share2, Copy
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  relation: string;
  joinedAt: string;
}

const ROLES = {
  owner: { label: '主理人', color: '#B93A32', desc: '拥有最高权限，可移交家族' },
  admin: { label: '修谱师', color: '#C5A059', desc: '可编辑谱系，管理成员' },
  editor: { label: '共创者', color: '#1D1D1F', desc: '可上传内容，编辑个人信息' },
  viewer: { label: '访客', color: '#8E8E93', desc: '仅查看，不可编辑' }
};

const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: '我', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100', role: 'owner', relation: '本人', joinedAt: '2023.01.01' },
  { id: '2', name: '林建国', role: 'admin', relation: '父亲', joinedAt: '2023.01.02' },
  { id: '3', name: '林晓', role: 'editor', relation: '堂姐', joinedAt: '2023.02.15' },
  { id: '4', name: '二伯', role: 'viewer', relation: '二伯', joinedAt: '2023.03.10' },
];

export const FamilySpaceManagementView = ({ onBack }: { onBack: () => void }) => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    setSelectedMember(null);
  };

  const handleRoleChange = (id: string, newRole: Member['role']) => {
    setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
    setSelectedMember(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-[#F9F9F7] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-4 bg-white/80 backdrop-blur-md border-b border-[#EBEBE6] flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6 text-[#1D1D1F]" strokeWidth={1.5} />
        </button>
        <div className="text-center">
           <h2 className="text-[17px] font-bold font-serif text-[#1D1D1F]">家族空间管理</h2>
           <p className="text-[10px] text-[#8E8E93]">林氏家族 (ID: 8829103)</p>
        </div>
        <button className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all">
          <Share2 className="w-5 h-5 text-[#1D1D1F]" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        
        {/* Invite Card */}
        <div className="bg-[#1D1D1F] rounded-[12px] p-5 text-white mb-8 relative overflow-hidden shadow-lg group cursor-pointer active:scale-[0.98] transition-transform">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] rounded-full blur-[50px] opacity-20 pointer-events-none" />
           <div className="flex justify-between items-center relative z-10">
              <div>
                 <h3 className="text-[16px] font-bold font-serif mb-1 flex items-center gap-2">
                    邀请家人加入
                    <span className="bg-[#C5A059] text-[#1D1D1F] text-[10px] px-1.5 rounded-[2px]">推荐</span>
                 </h3>
                 <p className="text-[12px] text-white/60">共同修谱，永久保存家族记忆</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                 <Plus className="w-5 h-5 text-white" />
              </div>
           </div>
        </div>

        {/* Member List */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#1D1D1F] font-serif border-l-2 border-[#B93A32] pl-2">
                 家族成员 ({members.length})
              </h3>
              <span className="text-[12px] text-[#8E8E93]">管理权限</span>
           </div>

           <div className="space-y-3">
              {members.map((member) => (
                 <div 
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="bg-white p-4 rounded-[12px] border border-[#EBEBE6] shadow-sm flex items-center justify-between active:bg-[#F5F5F7] transition-colors cursor-pointer"
                 >
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[#F5F5F7] overflow-hidden flex items-center justify-center text-[#1D1D1F] font-bold border border-[#EBEBE6]">
                             {member.avatar ? (
                                <img src={member.avatar} className="w-full h-full object-cover" />
                             ) : (
                                member.name[0]
                             )}
                          </div>
                          {member.role === 'owner' && (
                             <div className="absolute -bottom-1 -right-1 bg-[#B93A32] rounded-full p-0.5 border border-white">
                                <Crown className="w-2.5 h-2.5 text-white fill-white" />
                             </div>
                          )}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="text-[14px] font-bold text-[#1D1D1F] font-serif">{member.name}</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-[#F5F5F7] rounded-[2px] text-[#8E8E93]">
                                {member.relation}
                             </span>
                          </div>
                          <p className="text-[10px] text-[#8E8E93] mt-0.5">加入于 {member.joinedAt}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-medium" style={{ color: ROLES[member.role].color }}>
                          {ROLES[member.role].label}
                       </span>
                       <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12">
           <p className="text-[12px] text-[#8E8E93] mb-3 px-1">高级设置</p>
           <div className="bg-white rounded-[12px] border border-[#EBEBE6] overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F7] border-b border-[#F5F5F7] transition-colors group">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFF0F0] flex items-center justify-center">
                       <AlertCircle className="w-4 h-4 text-[#B93A32]" />
                    </div>
                    <div className="text-left">
                       <span className="text-[14px] font-medium text-[#1D1D1F]">移交主理人权限</span>
                       <p className="text-[10px] text-[#8E8E93]">将家族管理权转让给其他成员</p>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F7] transition-colors group">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFF0F0] flex items-center justify-center">
                       <Trash2 className="w-4 h-4 text-[#B93A32]" />
                    </div>
                    <div className="text-left">
                       <span className="text-[14px] font-medium text-[#B93A32]">解散家族空间</span>
                       <p className="text-[10px] text-[#8E8E93]">此操作不可恢复，请谨慎操作</p>
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
              </button>
           </div>
        </div>
      </div>

      {/* Member Detail Modal / Action Sheet */}
      <AnimatePresence>
         {selectedMember && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMember(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
               />
               <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 bg-[#F9F9F7] rounded-t-[24px] z-[120] overflow-hidden"
               >
                  <div className="p-6 pb-safe">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center overflow-hidden">
                           {selectedMember.avatar ? (
                              <img src={selectedMember.avatar} className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-[20px] font-serif">{selectedMember.name[0]}</span>
                           )}
                        </div>
                        <div>
                           <h3 className="text-[18px] font-bold text-[#1D1D1F] font-serif flex items-center gap-2">
                              {selectedMember.name}
                              <span className="text-[12px] font-normal text-[#8E8E93] bg-white px-2 py-0.5 rounded-full border border-[#EBEBE6]">{selectedMember.relation}</span>
                           </h3>
                           <p className="text-[12px] text-[#8E8E93] mt-1">
                              当前身份：<span style={{ color: ROLES[selectedMember.role].color }} className="font-bold">{ROLES[selectedMember.role].label}</span>
                           </p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-6">
                        <p className="text-[12px] font-bold text-[#1D1D1F] font-serif mb-2">修改权限</p>
                        <div className="bg-white rounded-[12px] border border-[#EBEBE6] overflow-hidden divide-y divide-[#F5F5F7]">
                           {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map((roleKey) => (
                              <button 
                                 key={roleKey}
                                 onClick={() => handleRoleChange(selectedMember.id, roleKey)}
                                 className="w-full p-4 flex items-center justify-between hover:bg-[#F9F9F7] transition-colors"
                                 disabled={selectedMember.role === 'owner' && roleKey !== 'owner'} // Owner specific logic needed realistically
                              >
                                 <div className="text-left">
                                    <div className="flex items-center gap-2 mb-0.5">
                                       <span className="text-[14px] font-bold" style={{ color: ROLES[roleKey].color }}>
                                          {ROLES[roleKey].label}
                                       </span>
                                       {roleKey === selectedMember.role && (
                                          <span className="text-[10px] bg-[#1D1D1F] text-white px-1.5 py-0.5 rounded-[2px]">当前</span>
                                       )}
                                    </div>
                                    <p className="text-[10px] text-[#8E8E93]">{ROLES[roleKey].desc}</p>
                                 </div>
                                 {roleKey === selectedMember.role && <div className="w-2 h-2 rounded-full bg-[#1D1D1F]" />}
                              </button>
                           ))}
                        </div>
                     </div>

                     {selectedMember.id !== '1' && (
                        <button 
                           onClick={() => handleRemoveMember(selectedMember.id)}
                           className="w-full py-4 bg-white border border-[#EBEBE6] text-[#B93A32] font-bold rounded-[12px] text-[14px]"
                        >
                           移除成员
                        </button>
                     )}
                     
                     <button 
                        onClick={() => setSelectedMember(null)}
                        className="w-full py-4 mt-3 bg-[#1D1D1F] text-white font-bold rounded-[12px] text-[14px]"
                     >
                        取消
                     </button>
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </motion.div>
  );
};
