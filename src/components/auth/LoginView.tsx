import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { login, saveSession, type Session } from '../../lib/api';
import { trackEvent } from '../../lib/telemetry';

interface LoginViewProps {
  onSuccess: (session: Session) => void;
}

export const LoginView = ({ onSuccess }: LoginViewProps) => {
  const [phone, setPhone] = useState('13800000000');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    trackEvent('session.login.start', { phone });
    try {
      const session = await login(phone.trim(), password.trim());
      saveSession(session);
      trackEvent('session.login.success', { userId: session.user.id });
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      trackEvent('session.login.failed', { message: err instanceof Error ? err.message : '登录失败' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] bg-white rounded-[20px] border border-[#E0DED5] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-[#F9F9F7] to-white">
          <div className="w-14 h-14 rounded-full bg-[#1D1D1F] text-white mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-[26px] font-bold font-serif text-[#1D1D1F]">林氏春秋</h1>
          <p className="text-[12px] text-[#8E8E93] mt-2">登录家族空间，继续修谱与记录</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="mb-4">
            <label className="text-[12px] text-[#8E8E93] mb-2 block">手机号</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full h-11 px-4 rounded-[10px] border border-[#EBEBE6] bg-[#F9F9F7] outline-none focus:border-[#B93A32]"
            />
          </div>
          <div className="mb-2">
            <label className="text-[12px] text-[#8E8E93] mb-2 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full h-11 px-4 rounded-[10px] border border-[#EBEBE6] bg-[#F9F9F7] outline-none focus:border-[#B93A32]"
            />
          </div>
          <p className="text-[11px] text-[#A89260] mb-5">测试账号：13800000000 / 123456</p>

          {error && (
            <div className="mb-4 text-[12px] text-[#B93A32] bg-[#FFF2F0] border border-[#FFD8D2] rounded-[8px] p-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-[10px] bg-[#1D1D1F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
