import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Mic, Square, Play, Pause, Save, Trash2, Volume2, Loader2 } from 'lucide-react';
import { createMoment, uploadMedia } from '../../lib/api';
import { ensureMicrophonePermission } from '../../lib/native/capabilities';
import { StatusNotice } from '../common/StatusNotice';
import { trackEvent } from '../../lib/telemetry';

interface VoiceRecorderViewProps {
  token: string;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
}

export const VoiceRecorderView = ({ token, onClose, onPublished }: VoiceRecorderViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError('');
    try {
      await ensureMicrophonePermission();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      setAudioBlob(null);
      setAudioUrl('');
      setDuration(0);
      setIsRecording(true);
      mediaRecorder.start();
      trackEvent('voice.record.start');
    } catch (err) {
      setError('未获得麦克风权限，请在系统设置中允许录音权限');
      console.error(err);
      trackEvent('voice.record.permission.denied');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackEvent('voice.record.stop', { duration });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlay = async () => {
    if (!audioUrl) return;
    if (!playerRef.current) {
      const audio = new Audio(audioUrl);
      playerRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      await playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl('');
    setDuration(0);
    setIsPlaying(false);
    playerRef.current?.pause();
    playerRef.current = null;
  };

  const handleSave = async () => {
    if (!audioBlob) {
      setError('请先录制一段口述');
      return;
    }
    setSaving(true);
    setError('');
    setUploadProgress(0);
    trackEvent('voice.publish.start', { duration });
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
      const media = await uploadMedia(token, file, 'audio', {
        retries: 2,
        compressImage: false,
        onProgress: (percent) => setUploadProgress(percent),
      });
      await createMoment(token, {
        content: '新增一段家族口述',
        memoryDate: '今天',
        audio: {
          url: media.url,
          duration: formatTime(duration),
        },
        images: [],
      });
      trackEvent('voice.publish.success', { duration });
      await onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      trackEvent('voice.publish.failed', { message: err instanceof Error ? err.message : '保存失败' });
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 bg-[#F9F9F7] z-[100] flex flex-col"
    >
      <div className="px-6 pt-14 pb-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/5">
          <X className="w-6 h-6 text-[#1D1D1F]" />
        </button>
        <h2 className="text-[17px] font-bold font-serif text-[#1D1D1F]">录制口述</h2>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {!audioBlob && !isRecording && (
          <div className="absolute top-10 left-6 right-6">
            <h3 className="text-[20px] font-bold text-[#1D1D1F] font-serif mb-6 text-center">试着问问长辈...</h3>
            <div className="space-y-4">
              {['您小时候最喜欢的一道菜是什么？', '还记得第一次见到奶奶/爷爷时的场景吗？', '年轻时做过最骄傲的一件事是什么？'].map((q, i) => (
                <div key={i} className="bg-white p-4 rounded-[12px] border border-[#EBEBE6] text-[#555] text-[14px] shadow-sm text-center">
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full h-48 flex items-center justify-center gap-1 mb-8">
          {isRecording ? (
            Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [10, Math.random() * 60 + 20, 10] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                className="w-1.5 bg-[#B93A32] rounded-full"
              />
            ))
          ) : audioBlob ? (
            <div className="w-full h-full flex items-center justify-center bg-[#F5F5F7] rounded-[16px] border border-[#EBEBE6]">
              <Volume2 className="w-12 h-12 text-[#8E8E93]" />
            </div>
          ) : null}
        </div>

        <div className="text-[40px] font-mono font-bold text-[#1D1D1F] mb-6">{formatTime(duration)}</div>

        {error ? <StatusNotice kind="error" text={error} className="mb-4" /> : null}
        {saving ? <p className="mb-4 text-[12px] text-[#8E8E93]">上传中 {uploadProgress}%（失败自动重试）</p> : null}

        <div className="flex items-center gap-8">
          {audioBlob ? (
            <>
              <button onClick={handleReset} className="flex flex-col items-center gap-2 text-[#8E8E93]">
                <div className="w-12 h-12 rounded-full border border-[#EBEBE6] flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <span className="text-[12px]">重录</span>
              </button>
              <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-[#1D1D1F] flex items-center justify-center shadow-lg text-[#F9F9F7]">
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex flex-col items-center gap-2 text-[#1D1D1F]">
                <div className="w-12 h-12 rounded-full border border-[#1D1D1F] bg-[#1D1D1F] text-white flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </div>
                <span className="text-[12px] font-bold">{saving ? '保存中' : '保存'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-[#F9F9F7] border-4 border-[#B93A32]' : 'bg-[#B93A32] shadow-xl shadow-[#B93A32]/30'
              }`}
            >
              {isRecording ? <Square className="w-8 h-8 text-[#B93A32] fill-current" /> : <Mic className="w-10 h-10 text-white" />}
            </button>
          )}
        </div>
        {isRecording && <p className="mt-6 text-[#8E8E93] text-[12px] animate-pulse">正在录制...</p>}
      </div>
    </motion.div>
  );
};
