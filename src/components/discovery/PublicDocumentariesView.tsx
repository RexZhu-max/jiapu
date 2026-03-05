import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Heart, Eye, Share2, Award, 
  ChevronRight, Search, Filter, Bookmark,
  Video, ArrowLeft, MessageCircle, Clock,
  MapPin, Film
} from 'lucide-react';

// --- Types ---

interface DocItem {
  id: string;
  title: string;
  subtitle: string;
  family: string;
  location: string;
  tags: string[];
  views: string;
  likes: string;
  image: string;
  duration: string;
  year: string;
  description: string;
  director: string;
  award?: string;
}

// --- Data ---

const DOC_LIST: DocItem[] = [
  {
    id: 'f1',
    title: '百年同仁：医药世家的坚守',
    subtitle: 'Healing a Century',
    family: '乐氏家族',
    location: '北京 · 大栅栏',
    tags: ['非遗传承', '百年老字号', '匠心'],
    views: '12.5w',
    likes: '8.2k',
    image: 'https://images.unsplash.com/photo-1762529485003-f83c1298e0d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGNoaW5lc2UlMjBhcmNoaXRlY3R1cmUlMjBjb3VydHlhcmR8ZW58MXx8fHwxNzY2MzcwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    duration: '45:00',
    year: '2023',
    director: '张艺谋 (监制)',
    description: '从清宫御药房到现代制药厂，乐氏家族四代人如何在大时代的洪流中，坚守"炮制虽繁必不敢省人工"的祖训？本片独家揭秘同仁堂秘方背后的家族传承故事。',
    award: '年度最佳纪录片'
  },
  {
    id: '1',
    title: '耕读传家：从大山到北大',
    subtitle: 'The Scholar\'s Path',
    family: '曾氏家族',
    location: '湖南 · 娄底',
    tags: ['教育', '奋斗史', '寒门贵子'],
    views: '4.8w',
    likes: '2.1k',
    image: 'https://images.unsplash.com/flagged/photo-1567318362383-fa193e67bbd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBjaGluZXNlJTIwZmFtaWx5JTIwcGhvdG8lMjBhbGJ1bXxlbnwxfHx8fDE3NjYzNzA5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    duration: '28:15',
    year: '2024',
    director: '林浩',
    description: '一把锄头，一摞书本。曾家爷爷用这双手供出了三个大学生。这是一个关于知识改变命运的朴素故事，也是中国千千万万个农村家庭的缩影。'
  },
  {
    id: '2',
    title: '丝路驼铃：三代人的贸易路',
    subtitle: 'Echoes of the Silk Road',
    family: '赵氏家族',
    location: '陕西 · 西安',
    tags: ['商业', '开拓', '一带一路'],
    views: '3.2w',
    likes: '1.5k',
    image: 'https://images.unsplash.com/photo-1615455243908-93e1fce6cdda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGluZXNlJTIwZWxkZXJseSUyMHBvcnRyYWl0JTIwYmxhY2slMjBhbmQlMjB3aGl0ZSUyMHZpbnRhZ2V8ZW58MXx8fHwxNzY2MzcwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    duration: '32:40',
    year: '2022',
    director: '王小帅',
    description: '从骆驼商队到中欧班列，赵家三代人的生意经里，写满了丝绸之路的变迁。'
  },
  {
    id: '3',
    title: '守望麦田',
    subtitle: 'Guardians of the Wheat',
    family: '刘氏家族',
    location: '河南 · 周口',
    tags: ['乡土', '变迁', '寻根'],
    views: '2.9w',
    likes: '980',
    image: 'https://images.unsplash.com/photo-1657325441147-99ccc1bde57f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGVhdCUyMGZpZWxkJTIwaGFydmVzdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjYzNzA5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    duration: '20:10',
    year: '2023',
    director: '李安 (顾问)',
    description: '无论走多远，麦熟的时节总要回家。这是刘氏家族定下的规矩，也是维系这个大家族情感的纽带。'
  },
  {
    id: '4',
    title: '海上有渔火',
    subtitle: 'Lights on the Sea',
    family: '陈氏家族',
    location: '福建 · 泉州',
    tags: ['海洋', '冒险', '妈祖'],
    views: '5.1w',
    likes: '3.4k',
    image: 'https://images.unsplash.com/photo-1672584378807-baa42f79e9fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwZmlzaGluZyUyMGJvYXQlMjBzdW5zZXR8ZW58MXx8fHwxNzY2MzcwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    duration: '35:20',
    year: '2024',
    director: '陈凯歌',
    description: '面对惊涛骇浪，陈家人世世代代向海而生。妈祖的庇佑下，是闽南人爱拼才会赢的精神写照。'
  }
];

// --- Detail Component ---

const DocDetailView = ({ doc, onBack }: { doc: DocItem; onBack: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col overflow-y-auto"
    >
      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center text-white/80">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Video Placeholder */}
      <div className="relative w-full aspect-[9/16] md:aspect-video shrink-0 bg-black">
        <img src={doc.image} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center pl-1 cursor-pointer hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 -mt-10 relative z-10 pb-24">
        {/* Title Block */}
        <div className="mb-8">
           <div className="flex flex-wrap gap-2 mb-3">
              {doc.award && (
                <span className="px-2 py-1 bg-[#C5A059] text-[#121212] text-[10px] font-bold rounded-[2px] flex items-center gap-1">
                   <Award className="w-3 h-3" />
                   {doc.award}
                </span>
              )}
              <span className="px-2 py-1 bg-white/10 text-white/60 text-[10px] rounded-[2px] backdrop-blur-md border border-white/5">
                {doc.year}
              </span>
              <span className="px-2 py-1 bg-white/10 text-white/60 text-[10px] rounded-[2px] backdrop-blur-md border border-white/5">
                {doc.duration}
              </span>
           </div>
           
           <h1 className="text-[28px] font-bold text-[#E5E5E5] font-serif leading-tight mb-2">{doc.title}</h1>
           <p className="text-[14px] text-[#888] font-serif italic mb-4">{doc.subtitle}</p>
           
           <div className="flex items-center justify-between py-4 border-y border-white/10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#333] border border-white/10 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${doc.family}`} alt={doc.family} />
                 </div>
                 <div>
                    <p className="text-[14px] font-bold text-[#E5E5E5]">{doc.family}</p>
                    <p className="text-[11px] text-[#888] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {doc.location}
                    </p>
                 </div>
              </div>
              <button className="px-4 py-1.5 border border-[#C5A059] text-[#C5A059] text-[12px] rounded-full hover:bg-[#C5A059] hover:text-[#121212] transition-colors">
                 关注家族
              </button>
           </div>
        </div>

        {/* Story */}
        <div className="mb-8">
           <h3 className="text-[16px] font-bold text-[#E5E5E5] font-serif mb-3">影片简介</h3>
           <p className="text-[14px] text-[#AAA] leading-relaxed font-serif text-justify">
              {doc.description}
           </p>
           <div className="mt-4 flex gap-4 text-[12px] text-[#666]">
              <span>导演: {doc.director}</span>
              <span>•</span>
              <span>播放: {doc.views}</span>
           </div>
        </div>

        {/* Chapters/Moments */}
        <div>
           <h3 className="text-[16px] font-bold text-[#E5E5E5] font-serif mb-4">精彩篇章</h3>
           <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 rounded-[4px] hover:bg-white/5 cursor-pointer group transition-colors">
                   <div className="relative w-24 aspect-video bg-[#333] rounded-[2px] overflow-hidden shrink-0">
                      <img src={doc.image} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Play className="w-4 h-4 text-white opacity-80" />
                      </div>
                   </div>
                   <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[14px] text-[#E5E5E5] font-medium mb-1 group-hover:text-[#C5A059] transition-colors">Chapter {i}: 家族往事</h4>
                      <p className="text-[11px] text-[#666]">0{i}:00 - 0{i+5}:30</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </motion.div>
  );
}

// --- Main List Component ---

export const PublicDocumentariesView = () => {
  const [selectedDoc, setSelectedDoc] = React.useState<DocItem | null>(null);

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 bg-[#121212] flex flex-col h-full overflow-hidden text-[#F9F9F7]"
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-4 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-bold font-serif tracking-widest text-[#E5E5E5]">家族大观</h1>
          <p className="text-[10px] text-[#888] tracking-widest uppercase mt-1">Heritage Cinema</p>
        </div>
        <div className="flex gap-4 text-[#888]">
           <Search className="w-5 h-5 hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Create CTA Banner */}
        <div className="px-6 py-6">
           <div className="bg-gradient-to-r from-[#2A2A2E] to-[#1E1E22] rounded-[6px] p-5 border border-white/5 relative overflow-hidden group cursor-pointer">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2 text-[#C5A059]">
                    <Film className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Start Your Legacy</span>
                 </div>
                 <h3 className="text-[18px] font-bold text-white font-serif mb-1">为您的家族拍摄一部纪录片</h3>
                 <p className="text-[12px] text-[#AAA] mb-4 max-w-[240px]">
                    专业导演团队协作，影院级制作标准，让家族记忆成为永恒的影像诗。
                 </p>
                 <button className="px-4 py-2 bg-[#F9F9F7] text-[#1D1D1F] text-[12px] font-bold rounded-[2px] hover:bg-white transition-colors">
                    发起拍摄项目
                 </button>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <Film className="absolute bottom-4 right-4 w-24 h-24 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
           </div>
        </div>

        {/* Filter Tags */}
        <div className="px-6 mb-6 overflow-x-auto hide-scrollbar">
           <div className="flex gap-3">
              {['全部', '名门望族', '百业兴旺', '红色记忆', '乡土中国', '海外华人'].map((cat, i) => (
                 <button 
                   key={cat}
                   className={`px-4 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-colors border ${
                     i === 0 
                     ? 'bg-[#F9F9F7] text-[#121212] border-[#F9F9F7] font-bold' 
                     : 'bg-transparent text-[#8E8E93] border-[#333] hover:border-[#666] hover:text-[#E5E5E5]'
                   }`}
                 >
                    {cat}
                 </button>
              ))}
           </div>
        </div>

        {/* Single Column List */}
        <div className="px-6 space-y-8">
           {DOC_LIST.map((doc, index) => (
              <motion.div 
                 key={doc.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
                 onClick={() => setSelectedDoc(doc)}
                 className="group cursor-pointer block"
              >
                 {/* Card Image */}
                 <div className="relative w-full aspect-[21/9] bg-[#2C2C2E] rounded-[4px] overflow-hidden mb-3 shadow-lg">
                    <img 
                      src={doc.image} 
                      alt={doc.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-[2px] text-[10px] text-white font-mono flex items-center gap-1.5 border border-white/10">
                       <Play className="w-2 h-2 fill-white" />
                       {doc.duration}
                    </div>

                    {/* Award Badge */}
                    {doc.award && (
                       <div className="absolute top-3 left-3 bg-[#C5A059] text-[#1D1D1F] px-2 py-1 rounded-[2px] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {doc.award}
                       </div>
                    )}
                 </div>
                 
                 {/* Metadata */}
                 <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                       <h3 className="text-[17px] font-bold text-[#E5E5E5] font-serif mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-1">
                          {doc.title}
                       </h3>
                       <div className="flex items-center gap-3 text-[11px] text-[#8E8E93] mb-2">
                          <span className="flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                             {doc.family}
                          </span>
                          <span>{doc.location}</span>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                          {doc.tags.map(tag => (
                             <span key={tag} className="text-[10px] text-[#666] bg-[#222] border border-[#333] px-1.5 py-0.5 rounded-[2px]">
                                {tag}
                             </span>
                          ))}
                       </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="text-right">
                       <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-[11px] text-[#8E8E93]">
                             <Eye className="w-3 h-3" />
                             {doc.views}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#8E8E93]">
                             <Heart className="w-3 h-3" />
                             {doc.likes}
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           ))}
        </div>

        {/* Footer Slogan */}
        <div className="mt-12 mb-4 text-center">
           <p className="text-[10px] text-[#444] tracking-[0.3em] font-serif uppercase">
              Heritage is not left to us in a will<br/>It is woven into our lives
           </p>
        </div>

      </div>
    </motion.div>

    {/* Detail View Overlay */}
    <AnimatePresence>
      {selectedDoc && (
        <DocDetailView doc={selectedDoc} onBack={() => setSelectedDoc(null)} />
      )}
    </AnimatePresence>
    </>
  );
};
