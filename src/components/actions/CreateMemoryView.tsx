import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Loader2, ChevronRight } from 'lucide-react';
import { createMoment, uploadMedia } from '../../lib/api';
import { StatusNotice } from '../common/StatusNotice';
import { trackEvent } from '../../lib/telemetry';

type MediaItem = {
  id: string;
  url: string;
};

interface CreateMemoryViewProps {
  token: string;
  onClose: () => void;
  onPublished: () => void | Promise<void>;
}

export const CreateMemoryView = ({ token, onClose, onPublished }: CreateMemoryViewProps) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadDoneCount, setUploadDoneCount] = useState(0);
  const [uploadTotalCount, setUploadTotalCount] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const pickerRef = useRef<HTMLInputElement>(null);
  const controllersRef = useRef<AbortController[]>([]);

  const handlePickFiles = () => {
    pickerRef.current?.click();
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setError('');
    setUploading(true);
    setUploadProgress(0);
    setUploadDoneCount(0);
    setUploadTotalCount(selected.length);
    setInfo('');
    trackEvent('media.upload.start', { total: selected.length });
    try {
      const uploaded: MediaItem[] = new Array(selected.length);
      const progressByIndex = new Array(selected.length).fill(0);
      const updateTotalProgress = () => {
        const total = progressByIndex.reduce((sum, value) => sum + value, 0);
        const avg = Math.floor(total / selected.length);
        setUploadProgress(Math.min(99, avg));
      };

      let nextIndex = 0;
      const workerCount = Math.min(3, selected.length);

      const runWorker = async () => {
        while (true) {
          const i = nextIndex;
          nextIndex += 1;
          if (i >= selected.length) return;
          const file = selected[i];
          setUploadingFileName(file.name);
          const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
          const controller = new AbortController();
          controllersRef.current.push(controller);
          try {
            const saved = await uploadMedia(token, file, mediaType as 'image' | 'video', {
              retries: 2,
              compressImage: true,
              signal: controller.signal,
              onProgress: (percent) => {
                progressByIndex[i] = percent;
                updateTotalProgress();
              },
            });
            progressByIndex[i] = 100;
            updateTotalProgress();
            uploaded[i] = { id: saved.id, url: saved.url };
            setUploadDoneCount((prev) => prev + 1);
            trackEvent('media.upload.file.success', { name: file.name, type: mediaType });
          } finally {
            controllersRef.current = controllersRef.current.filter((item) => item !== controller);
          }
        }
      };

      await Promise.all(Array.from({ length: workerCount }, runWorker));
      for (const item of uploaded) {
        if (!item) throw new Error('部分文件上传失败，请重试');
      }
      setUploadProgress(100);
      setFiles((prev) => [...prev, ...uploaded.filter(Boolean)]);
      trackEvent('media.upload.success', { total: selected.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败';
      if (message.includes('取消')) {
        setInfo('上传已取消');
        trackEvent('media.upload.cancel');
      } else {
        setError(message);
        trackEvent('media.upload.failed', { message });
      }
    } finally {
      controllersRef.current = [];
      setUploading(false);
      setUploadingFileName('');
      setUploadDoneCount(0);
      setUploadTotalCount(0);
      setTimeout(() => setUploadProgress(0), 300);
      e.target.value = '';
    }
  };

  const handleCancelUpload = () => {
    if (!uploading) return;
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current = [];
  };

  const handlePublish = async () => {
    if (!content.trim() && files.length === 0) {
      setError('请输入内容或上传图片');
      return;
    }
    setError('');
    setInfo('');
    setPublishing(true);
    trackEvent('moment.publish.start', { imageCount: files.length, hasText: Boolean(content.trim()) });
    try {
      await createMoment(token, {
        content: content.trim(),
        memoryDate: '今天',
        images: files.map((item) => item.url),
        participants: [],
      });
      trackEvent('moment.publish.success', { imageCount: files.length });
      await onPublished();
    } catch (err) {
      const message = err instanceof Error ? err.message : '发布失败';
      setError(message);
      trackEvent('moment.publish.failed', { message });
    } finally {
      setPublishing(false);
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
      <div className="px-6 pt-14 pb-4 flex items-center justify-between border-b border-[#EBEBE6] bg-white">
        <button onClick={onClose} className="text-[15px] text-[#8E8E93]">
          取消
        </button>
        <h2 className="text-[17px] font-bold font-serif text-[#1D1D1F]">发布动态</h2>
        <button
          onClick={handlePublish}
          disabled={publishing || uploading}
          className={`text-[15px] font-bold ${publishing || uploading ? 'text-[#B93A32]/60' : 'text-[#B93A32]'}`}
        >
          {publishing ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <textarea
          className="w-full h-40 bg-transparent text-[16px] text-[#1D1D1F] placeholder:text-[#C7C7CC] resize-none focus:outline-none mb-4 leading-relaxed font-serif"
          placeholder="记录这一刻的家族记忆..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <input
          ref={pickerRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFilesChange}
        />

        <div className="flex flex-wrap gap-3">
          {files.map((file, i) => (
            <div key={file.id || i} className="relative w-24 h-24 rounded-[8px] overflow-hidden border border-[#EBEBE6]">
              <img src={file.url} className="w-full h-full object-cover" />
              <button
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handlePickFiles}
            disabled={uploading}
            className="w-24 h-24 bg-[#E5E5EA]/50 border border-[#EBEBE6] rounded-[8px] flex flex-col items-center justify-center text-[#8E8E93] active:bg-[#E5E5EA] transition-colors"
          >
            {uploading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Plus className="w-6 h-6 mb-1" />}
            <span className="text-[10px]">{uploading ? '上传中' : '添加照片'}</span>
          </button>
        </div>

        {error ? <StatusNotice kind="error" text={error} className="mt-3" /> : null}
        {!error && info ? <StatusNotice kind="info" text={info} className="mt-3" /> : null}
        {uploading ? (
          <div className="mt-3">
            <div className="h-1.5 w-full bg-[#E5E5EA] rounded-full overflow-hidden">
              <div className="h-full bg-[#B93A32] transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[#8E8E93]">
              上传中 {uploadProgress}% {uploadTotalCount > 0 ? `· ${uploadDoneCount}/${uploadTotalCount}` : ''}{' '}
              {uploadingFileName ? `· ${uploadingFileName}` : ''}
            </p>
            <button
              onClick={handleCancelUpload}
              className="mt-2 text-[11px] text-[#B93A32] underline"
            >
              取消上传
            </button>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#EBEBE6]">
            <span className="text-[14px] text-[#1D1D1F]">关联亲友</span>
            <span className="text-[14px] text-[#8E8E93] flex items-center gap-1">
              暂不支持 <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#EBEBE6]">
            <span className="text-[14px] text-[#1D1D1F]">发生时间</span>
            <span className="text-[14px] text-[#1D1D1F] font-medium flex items-center gap-1">
              今天 <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#EBEBE6]">
            <span className="text-[14px] text-[#1D1D1F]">所在位置</span>
            <span className="text-[14px] text-[#8E8E93] flex items-center gap-1">
              APP 内后续补充 <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
