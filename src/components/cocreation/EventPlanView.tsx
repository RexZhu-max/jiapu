import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, MapPin, Users, CheckCircle2, Circle, Plus, MessageSquare, Sparkles, Clock } from 'lucide-react';

interface EventPlanViewProps {
  onClose: () => void;
  taskTitle: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
}

export const EventPlanView = ({ onClose, taskTitle }: EventPlanViewProps) => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: '预订酒店包厢', completed: true, assignee: '林晓' },
    { id: '2', text: '制作生日祝福视频', completed: true, assignee: '我' },
    { id: '3', text: '购买生日蛋糕', completed: false, assignee: '林建国' },
    { id: '4', text: '准备寿桃礼盒', completed: false },
    { id: '5', text: '通知外地亲友', completed: false },
  ]);

  const participants = [
    { name: '我', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100' },
    { name: '林晓', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' },
    { name: '林建国', avatar: 'https://images.unsplash.com/photo-1697144532799-c94b0344c1cb?auto=format&fit=crop&q=80&w=100' },
    { name: '林梅', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
  ];

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const completedCount = todos.filter(t => t.completed).length;
  const progress = Math.round((completedCount / todos.length) * 100);

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
            活动策划
          </h1>
          <button className="px-4 py-2 rounded-[8px] bg-white border border-[#EBEBE6] text-[14px] font-bold text-[#1D1D1F]">
            编辑
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 pb-24">
        {/* Event Header */}
        <div className="bg-gradient-to-br from-[#B93A32] to-[#8B2A22] rounded-[20px] p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-12 -mt-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-1 rounded-[4px] bg-white/20 text-[10px] font-bold">
                家族纪念日
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>还有 12 天</span>
              </div>
            </div>
            
            <h2 className="text-[24px] font-bold font-serif mb-2">
              {taskTitle}
            </h2>
            
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>农历十月十五 · 2025年1月7日</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>福州大酒店 · 祥瑞厅</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]">筹备进度</span>
                <span className="text-[14px] font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B93A32]" />
            参与成员 ({participants.length})
          </h3>
          <div className="flex items-center gap-3">
            {participants.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden">
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] text-[#1D1D1F]">{p.name}</span>
              </div>
            ))}
            <button className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#EBEBE6] bg-white flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#8E8E93]" />
              </div>
              <span className="text-[11px] text-[#8E8E93]">邀请</span>
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-[#1D1D1F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#B93A32]" />
              待办事项 ({completedCount}/{todos.length})
            </h3>
            <button className="text-[13px] text-[#B93A32] font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>
          
          <div className="space-y-2">
            {todos.map((todo) => (
              <div 
                key={todo.id}
                className="bg-white rounded-[12px] p-4 border border-[#EBEBE6] flex items-center gap-3"
              >
                <button 
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    todo.completed 
                      ? 'bg-[#34C759] border-[#34C759]' 
                      : 'border-[#C7C7CC]'
                  }`}
                >
                  {todo.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <div className="flex-1">
                  <p className={`text-[14px] ${todo.completed ? 'line-through text-[#8E8E93]' : 'text-[#1D1D1F]'}`}>
                    {todo.text}
                  </p>
                  {todo.assignee && (
                    <p className="text-[11px] text-[#8E8E93] mt-1">负责人：{todo.assignee}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discussion */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#B93A32]" />
            协作讨论
          </h3>
          
          <div className="bg-white rounded-[16px] border border-[#EBEBE6] overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" 
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  alt=""
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-[#1D1D1F]">林晓</span>
                    <span className="text-[11px] text-[#8E8E93]">1小时前</span>
                  </div>
                  <p className="text-[13px] text-[#1D1D1F]">酒店已经预订好了，包厢可以坐20人</p>
                </div>
              </div>

              <div className="flex gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1697144532799-c94b0344c1cb?auto=format&fit=crop&q=80&w=100" 
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  alt=""
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-[#1D1D1F]">林建国</span>
                    <span className="text-[11px] text-[#8E8E93]">30分钟前</span>
                  </div>
                  <p className="text-[13px] text-[#1D1D1F]">好的，我明天去订蛋糕</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#EBEBE6] p-3">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="发表看法..."
                  className="flex-1 px-3 py-2 rounded-[8px] bg-[#F5F5F7] text-[13px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none"
                />
                <button className="px-4 py-2 rounded-[8px] bg-[#B93A32] text-white text-[13px] font-bold">
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
