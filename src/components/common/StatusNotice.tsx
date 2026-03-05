import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type StatusKind = 'loading' | 'error' | 'success' | 'info';

interface StatusNoticeProps {
  kind: StatusKind;
  text: string;
  className?: string;
}

const STYLES: Record<StatusKind, string> = {
  loading: 'bg-[#F5F5F7] text-[#8E8E93] border-[#EBEBE6]',
  error: 'bg-[#FFF2F0] text-[#B93A32] border-[#FFD8D2]',
  success: 'bg-[#F2FBF4] text-[#2E7D32] border-[#CDECCF]',
  info: 'bg-[#F2F7FF] text-[#3A67B9] border-[#D2E1FF]',
};

export const StatusNotice = ({ kind, text, className = '' }: StatusNoticeProps) => {
  const icon =
    kind === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
    kind === 'error' ? <AlertCircle className="w-4 h-4" /> :
    kind === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
    <AlertCircle className="w-4 h-4" />;

  return (
    <div className={`w-full rounded-[8px] border px-3 py-2 text-[12px] flex items-center gap-2 ${STYLES[kind]} ${className}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
};
