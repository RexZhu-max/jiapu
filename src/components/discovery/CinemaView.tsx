import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Star, Clock, Check, ChevronRight, Film, Video, Music, Aperture, 
  Crown, Sparkles, Clapperboard, MonitorPlay, FolderOpen, ArrowLeft, 
  Share2, Heart, MoreVertical, X, Calendar 
} from 'lucide-react';

// --- Types ---

interface Movie {
  id: string;
  title: string;
  year: string;
  duration: string;
  tags: string[];
  cover: string;
  synopsis: string;
  author: string;
  cast?: string[];
  rating?: string;
  comments?: number;
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  desc: string;
  features: string[];
  recommmended?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'AI 智能生成',
    price: '免费',
    desc: '基于相册自动生成，适合日常记录',
    features: ['1080P 高清画质', '智能配乐', '基础转场特效', '每月限 3 次']
  },
  {
    id: 'pro',
    name: '大师手工剪辑',
    price: '¥2,980',
    desc: '专业剪辑师一对一服务，精修家史',
    features: ['4K 电影级画质', '专业旁白配音', '老照片上色修复', '专属片头定制', '包含 3 次修改'],
    recommmended: true
  },
  {
    id: 'film',
    name: '传世纪录片',
    price: '¥19,800 起',
    desc: '导演组上门拍摄，访谈家族成员',
    features: ['导演/摄像/灯光全剧组', '多机位访谈拍摄', '院线级调色/混音', '家族首映礼策划', '典藏版蓝光碟交付']
  }
];

// --- Mock Data ---

const MOCK_MOVIES: Movie[] = [
   {
      id: '1',
      title: '林氏·春风化雨',
      year: '2023',
      duration: '45min',
      tags: ['官方出品', '年度纪录', '教育'],
      cover: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1080',
      synopsis: '一部跨越四十年的家族教育史，记录了从太爷爷创办私塾到如今桃李满天下的动人故事。通过三代人的口述，还原了那个尊师重道的年代。',
      author: '林氏家族基金会',
      rating: '9.8',
      cast: ['林建国', '林晓', '张老师']
   },
   {
      id: '2',
      title: '远方的家书',
      year: '1982',
      duration: '1h 12min',
      tags: ['书信', '情感', '老照片'],
      cover: 'https://images.unsplash.com/photo-1697144532799-c94b0344c1cb?auto=format&fit=crop&q=80&w=1080',
      synopsis: '在通讯不便的年代，一封封家书承载了多少思念。本片整理了爷爷留下的两百多封书信，讲述了那段跨越海峡的亲情故事。',
      author: '陈氏家族',
      rating: '9.5'
   },
   {
      id: '3',
      title: '守望麦田',
      year: '2001',
      duration: '38min',
      tags: ['乡土', '纪实'],
      cover: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1080',
      synopsis: '随着城市化进程，老家的麦田越来越少。导演回到故乡，记录下最后一次麦收的场景，以及那些坚守土地的老人们。',
      author: '王氏家族',
      rating: '9.2'
   },
   {
      id: '4',
      title: '徽州印记',
      year: '清末',
      duration: '50min',
      tags: ['建筑', '历史', '非遗'],
      cover: 'https://images.unsplash.com/photo-1685702232487-94778ec5a0ed?auto=format&fit=crop&q=80&w=1080',
      synopsis: '走进徽派建筑的白墙黑瓦，探寻古老祠堂背后的家族规训。每一块砖雕，都刻画着祖辈的智慧与荣耀。',
      author: '钱氏宗亲会',
      rating: '9.6'
   }
];

// --- Sub-Components ---

const WideMovieCard = ({ movie, onClick }: { movie: Movie, onClick: () => void }) => (
   <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-[2/1] mb-6 rounded-[12px] overflow-hidden group cursor-pointer shadow-lg bg-[#121212]"
      onClick={onClick}
   >
      <img 
         src={movie.cover} 
         className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
      
      <div className="absolute bottom-0 left-0 right-0 p-5">
         <div className="flex items-center gap-2 mb-2">
            {movie.tags.map(tag => (
               <span key={tag} className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md rounded-[2px] text-[9px] text-white font-medium tracking-wide">
                  {tag}
               </span>
            ))}
            <span className="text-[10px] text-white/60 font-mono flex items-center gap-1">
               <Clock className="w-3 h-3" /> {movie.duration}
            </span>
         </div>
         <h3 className="text-[20px] font-bold text-[#F9F9F7] font-serif mb-1 leading-tight">{movie.title}</h3>
         <p className="text-[11px] text-white/60 line-clamp-1 font-serif opacity-80">{movie.synopsis}</p>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center pl-1">
            <Play className="w-6 h-6 text-white fill-white" />
         </div>
      </div>
   </motion.div>
);

const MovieDetailView = ({ movie, onClose }: { movie: Movie, onClose: () => void }) => (
   <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-[#000] overflow-y-auto"
   >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-14 flex justify-between items-center z-20">
         <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
            <ArrowLeft className="w-5 h-5" />
         </button>
         <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
               <Heart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
               <Share2 className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Hero Cover */}
      <div className="relative w-full aspect-[3/4] md:aspect-video">
         <img src={movie.cover} className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/20 to-transparent" />
         <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
            <div className="flex items-center gap-2 mb-3">
               <span className="text-[#C5A059] text-[10px] font-bold border border-[#C5A059] px-1.5 py-0.5 rounded-[2px] tracking-wider uppercase">Official Selection</span>
               {movie.rating && <span className="text-[#F9F9F7] text-[10px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-[2px] font-bold">⭐ {movie.rating}</span>}
            </div>
            <h1 className="text-[32px] font-bold text-[#F9F9F7] font-serif leading-tight mb-2">{movie.title}</h1>
            <div className="flex items-center gap-4 text-[12px] text-white/50 font-mono mb-6">
               <span>{movie.year}</span>
               <span>{movie.duration}</span>
               <span>4K HDR</span>
               <span>{movie.author}</span>
            </div>
            
            <button className="w-full bg-[#F9F9F7] text-[#121212] py-4 rounded-[4px] font-bold text-[14px] flex items-center justify-center gap-2 mb-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
               <Play className="w-4 h-4 fill-current" /> 立即播放
            </button>
         </div>
      </div>

      {/* Info Content */}
      <div className="px-6 pb-24 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
         <section>
            <h3 className="text-[14px] font-bold text-[#F9F9F7] mb-2 font-serif">剧情简介</h3>
            <p className="text-[13px] text-white/60 leading-relaxed font-serif">
               {movie.synopsis}
            </p>
         </section>

         <section>
            <h3 className="text-[14px] font-bold text-[#F9F9F7] mb-4 font-serif">演职员表</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
               {movie.cast?.map((name, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                     <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-[10px]">
                        Avatar
                     </div>
                     <span className="text-[10px] text-white/70">{name}</span>
                  </div>
               )) || <p className="text-[12px] text-white/30 italic">暂无演职员信息</p>}
            </div>
         </section>

         <section>
            <h3 className="text-[14px] font-bold text-[#F9F9F7] mb-4 font-serif">相关推荐</h3>
            <div className="grid grid-cols-2 gap-4">
               {MOCK_MOVIES.filter(m => m.id !== movie.id).slice(0, 2).map(m => (
                  <div key={m.id} className="relative aspect-[2/3] bg-[#121212] rounded-[4px] overflow-hidden">
                     <img src={m.cover} className="w-full h-full object-cover opacity-60" />
                     <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="text-[12px] text-[#F9F9F7] font-bold truncate">{m.title}</h4>
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>
   </motion.div>
);

const ProductionStep = ({ step, title, desc, icon: Icon }: any) => (
   <div className="relative pl-8 pb-8 last:pb-0 border-l border-dashed border-[#C5A059]/30">
      <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-[#1D1D1F] border border-[#C5A059] flex items-center justify-center text-[10px] text-[#C5A059] font-bold">
         {step}
      </div>
      <div className="bg-white/5 border border-white/10 p-4 rounded-[8px]">
         <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-[#C5A059]" />
            <h4 className="text-[14px] font-bold text-[#F9F9F7]">{title}</h4>
         </div>
         <p className="text-[12px] text-white/50 leading-relaxed">{desc}</p>
      </div>
   </div>
);

const MyProjectCard = () => (
   <div className="bg-[#1D1D1F] rounded-[16px] p-5 border border-white/10 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] rounded-full blur-[60px] opacity-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
         <h3 className="text-[14px] font-bold text-[#F9F9F7] flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-[#C5A059]" />
            我的项目
         </h3>
         <button className="group relative px-3 py-1.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 hover:bg-[#C5A059]/20 active:scale-95 transition-all flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#C5A059] font-serif tracking-wide">查看全案</span>
            <ChevronRight className="w-3 h-3 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
         </button>
      </div>

      <div className="flex gap-4 mb-4 relative z-10">
         <div className="w-16 h-20 bg-white/5 rounded-[4px] shrink-0 border border-white/10 overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" 
               className="w-full h-full object-cover opacity-60"
             />
         </div>
         <div className="flex-1">
            <h4 className="text-[14px] font-bold text-[#F9F9F7] mb-1 font-serif">林氏家风传承纪录片</h4>
            <p className="text-[10px] text-white/50 mb-3">预计交付：2025年 3月 15日</p>
            <div className="flex items-center justify-between text-[10px] text-[#C5A059] font-bold mb-1">
               <span>后期制作中</span>
               <span>75%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  className="h-full bg-[#C5A059] rounded-full"
               />
            </div>
         </div>
      </div>
   </div>
);

const PremiumPricingCard = ({ tier }: { tier: PricingTier }) => {
   const isFilm = tier.id === 'film';
   const isPro = tier.id === 'pro';

   return (
    <div className={`relative p-8 rounded-[20px] overflow-hidden border ${isFilm ? 'border-[#C5A059]/30' : isPro ? 'border-[#B93A32]/30' : 'border-white/10'} bg-[#1D1D1F] group hover:border-[#C5A059] transition-colors duration-500`}>
       {isFilm && (
         <>
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600')] bg-cover opacity-10 mix-blend-overlay" />
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C5A059] rounded-full blur-[100px] opacity-10" />
         </>
       )}
       {isPro && (
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B93A32] rounded-full blur-[100px] opacity-10" />
       )}

       <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div>
                {tier.recommmended && (
                   <span className="inline-block px-2 py-0.5 bg-[#B93A32] text-white text-[9px] tracking-widest uppercase rounded-[2px] mb-2 font-bold">Recommended</span>
                )}
                {isFilm && (
                   <span className="inline-block px-2 py-0.5 bg-[#C5A059] text-[#1D1D1F] text-[9px] tracking-widest uppercase rounded-[2px] mb-2 font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Ultimate Collection
                   </span>
                )}
                <h3 className={`text-[22px] font-bold font-serif mb-1 ${isFilm ? 'text-[#C5A059]' : 'text-[#F9F9F7]'}`}>{tier.name}</h3>
                <p className="text-[12px] text-white/50">{tier.desc}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                {isFilm ? <Film className="w-5 h-5 text-[#C5A059]" /> : <Sparkles className="w-5 h-5 text-white/70" />}
             </div>
          </div>

          <div className="flex items-baseline gap-1 mb-8">
             <span className={`text-[32px] font-bold font-serif ${isFilm ? 'text-[#C5A059]' : 'text-[#F9F9F7]'}`}>{tier.price}</span>
             {tier.id !== 'basic' && <span className="text-[12px] text-white/40">/ 部</span>}
          </div>

          <div className="space-y-4 mb-8">
             {tier.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px] text-white/80">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isFilm ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-white/10 text-white'}`}>
                      <Check className="w-3 h-3" />
                   </div>
                   <span>{feat}</span>
                </div>
             ))}
          </div>

          <button className={`w-full py-4 rounded-[4px] text-[14px] font-bold tracking-wide transition-all ${
             isFilm 
             ? 'bg-gradient-to-r from-[#C5A059] to-[#E6C685] text-[#1D1D1F] shadow-[0_4px_20px_rgba(197,160,89,0.3)]' 
             : tier.recommmended
                ? 'bg-[#B93A32] text-white shadow-[0_4px_20px_rgba(185,58,50,0.4)]'
                : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
          }`}>
             {tier.id === 'basic' ? '开始制作' : '预约尊享服务'}
          </button>
       </div>
    </div>
   );
};

// --- Main View ---

export const CinemaView = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'service'>('gallery');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <div className={`min-h-full flex flex-col pb-24 transition-colors duration-500 bg-[#000]`}>
       {/* Header */}
       <div className={`px-6 pt-14 pb-2 sticky top-0 backdrop-blur-md z-20 flex items-end justify-between border-b border-white/10 bg-black/80`}>
          <h1 className={`text-[24px] font-bold font-serif mb-2 text-[#F9F9F7]`}>家族大观</h1>
          <div className="flex gap-6 mb-3">
             <button 
                onClick={() => setActiveTab('gallery')}
                className={`text-[14px] font-medium transition-colors relative pb-1 ${activeTab === 'gallery' ? 'text-[#C5A059]' : 'text-white/40 hover:text-white'}`}
             >
                映画
                {activeTab === 'gallery' && <motion.div layoutId="cinemaTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A059]" />}
             </button>
             <button 
                onClick={() => setActiveTab('service')}
                className={`text-[14px] font-medium transition-colors relative pb-1 ${activeTab === 'service' ? 'text-[#C5A059]' : 'text-white/40 hover:text-white'}`}
             >
                定制
                {activeTab === 'service' && <motion.div layoutId="cinemaTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A059]" />}
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'gallery' ? (
             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Vertical Feed for Wide Screens/Mobile */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-bold text-[#F9F9F7] font-serif pl-1 border-l-2 border-[#C5A059] flex items-center gap-2">
                     推荐展映
                  </h2>
                </div>
                
                {MOCK_MOVIES.map(movie => (
                   <WideMovieCard 
                      key={movie.id} 
                      movie={movie} 
                      onClick={() => setSelectedMovie(movie)}
                   />
                ))}

                <div className="text-center pt-8 opacity-50">
                   <p className="text-[10px] text-white/40 font-serif tracking-widest">—— 记录每个家族的春秋 ——</p>
                </div>
             </div>
          ) : (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* My Project Entry */}
                <div className="mt-4">
                   <MyProjectCard />
                </div>

                {/* Introduction */}
                <div className="text-center space-y-4">
                   <h2 className="text-[28px] font-bold font-serif text-[#F9F9F7] leading-tight">
                      让家族故事<br/>成为<span className="text-[#C5A059]">传世影像</span>
                   </h2>
                   <p className="text-[13px] text-white/60 max-w-[80%] mx-auto leading-relaxed">
                      从老照片修复到专业导演组上门拍摄，<br/>我们为您提供奥斯卡级的家族纪录片定制服务。
                   </p>
                </div>

                {/* Production Process Timeline */}
                <div className="bg-[#1D1D1F] rounded-[16px] p-6 border border-white/10">
                   <h3 className="text-[16px] font-bold text-[#F9F9F7] font-serif mb-6 text-center">定制流程</h3>
                   <div className="pl-2">
                      <ProductionStep 
                         step="1" 
                         title="前期调研" 
                         desc="历史顾问上门访谈，梳理家族脉络，制定拍摄脚本。"
                         icon={FolderOpen}
                      />
                      <ProductionStep 
                         step="2" 
                         title="实地拍摄" 
                         desc="专业摄制组携带电影级设备，前往老宅、故乡取景。"
                         icon={Clapperboard}
                      />
                      <ProductionStep 
                         step="3" 
                         title="后期精修" 
                         desc="4K 剪辑调色，专业配音配乐，老照片 AI 修复增强。"
                         icon={MonitorPlay}
                      />
                      <ProductionStep 
                         step="4" 
                         title="交付首映" 
                         desc="交付蓝光母带，策划家族首映礼，永久云端存档。"
                         icon={Film}
                      />
                   </div>
                </div>

                {/* Pricing List */}
                <div className="space-y-8">
                   <div className="flex items-center gap-4 text-white/30">
                      <div className="h-[1px] bg-white/10 flex-1" />
                      <span className="text-[12px] font-serif tracking-widest">服务方案</span>
                      <div className="h-[1px] bg-white/10 flex-1" />
                   </div>
                   {PRICING_TIERS.map(tier => (
                      <PremiumPricingCard key={tier.id} tier={tier} />
                   ))}
                </div>
                
                <div className="text-center pb-8 border-t border-white/10 pt-8">
                   <p className="text-[10px] text-white/30">
                      服务由 银发青年Heritage 专业影像团队提供支持
                   </p>
                </div>
             </div>
          )}
       </div>

       {/* Movie Detail Modal */}
       <AnimatePresence>
          {selectedMovie && (
             <MovieDetailView 
                movie={selectedMovie} 
                onClose={() => setSelectedMovie(null)} 
             />
          )}
       </AnimatePresence>
    </div>
  );
};
