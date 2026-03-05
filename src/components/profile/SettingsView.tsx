import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, Bell, Lock, Eye, Globe, Moon, Volume2, 
  Database, Shield, FileText, HelpCircle, MessageSquare,
  Smartphone, Mail, Share2, Trash2, LogOut, User, Image,
  CheckCircle2, Info, Download, Upload, RefreshCw, AlertCircle
} from 'lucide-react';

// --- Types ---

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  icon: any;
  label: string;
  sub?: string;
  type: 'navigation' | 'toggle' | 'action' | 'info';
  value?: boolean;
  badge?: string;
  color?: string;
  onClick?: () => void;
}

// --- Sub-Components ---

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-12 h-7 rounded-full transition-colors relative ${
      checked ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
    }`}
  >
    <motion.div
      layout
      transition={{ type: "spring", damping: 20, stiffness: 500 }}
      className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 ${
        checked ? 'right-1' : 'left-1'
      }`}
    />
  </button>
);

const SettingRow = ({ item }: { item: SettingItem }) => {
  const [toggleValue, setToggleValue] = useState(item.value || false);

  const handleClick = () => {
    if (item.type === 'toggle') {
      setToggleValue(!toggleValue);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div
      onClick={item.type !== 'toggle' ? handleClick : undefined}
      className={`w-full flex items-center py-4 px-6 ${item.type !== 'toggle' && item.type !== 'info' ? 'cursor-pointer active:bg-[#F9F9F7]' : ''} transition-colors border-b border-[#F5F5F7] last:border-b-0 ${
        item.color ? 'bg-white' : ''
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
        item.color ? `bg-${item.color}/10` : 'bg-[#F5F5F7]'
      }`}>
        <item.icon className={`w-4 h-4 ${item.color || 'text-[#1D1D1F]'}`} />
      </div>

      <div className="text-left flex-1">
        <span className={`text-[14px] font-medium font-serif ${
          item.color || 'text-[#1D1D1F]'
        }`}>
          {item.label}
        </span>
        {item.sub && item.type !== 'info' && (
          <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-tight">{item.sub}</p>
        )}
      </div>

      {item.badge && (
        <span className="px-2 py-0.5 rounded-full bg-[#B93A32] text-white text-[10px] font-bold mr-2">
          {item.badge}
        </span>
      )}

      {item.type === 'toggle' && (
        <ToggleSwitch checked={toggleValue} onChange={setToggleValue} />
      )}

      {item.type === 'navigation' && (
        <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
      )}

      {item.type === 'info' && (
        <span className="text-[13px] text-[#8E8E93]">{item.sub}</span>
      )}
    </div>
  );
};

const SectionGroup = ({ section }: { section: SettingSection }) => (
  <div className="mb-6">
    <h3 className="text-[13px] text-[#8E8E93] font-medium px-6 mb-2 font-serif tracking-wide">
      {section.title}
    </h3>
    <div className="bg-white rounded-[12px] border border-[#EBEBE6] shadow-sm overflow-hidden">
      {section.items.map((item, i) => (
        <SettingRow key={i} item={item} />
      ))}
    </div>
  </div>
);

const AccountInfoModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[70] max-h-[70vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-[#F5F5F7]">
            <h2 className="text-[18px] font-bold font-serif text-[#1D1D1F] text-center mb-2">
              账户信息
            </h2>
            <p className="text-[12px] text-[#8E8E93] text-center">
              Account Information
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#B93A32] to-[#8E2219] flex items-center justify-center text-white text-[28px] font-bold border-4 border-white shadow-lg">
                林
              </div>
            </div>

            <div className="bg-[#F9F9F7] rounded-[8px] p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-[#8E8E93]">用户名</span>
                <span className="text-[14px] text-[#1D1D1F] font-medium">林志</span>
              </div>
              <div className="h-[1px] bg-[#EBEBE6]" />
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-[#8E8E93]">用户ID</span>
                <span className="text-[14px] text-[#1D1D1F] font-mono">8829103</span>
              </div>
              <div className="h-[1px] bg-[#EBEBE6]" />
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-[#8E8E93]">手机号</span>
                <span className="text-[14px] text-[#1D1D1F]">138****8829</span>
              </div>
              <div className="h-[1px] bg-[#EBEBE6]" />
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-[#8E8E93]">邮箱</span>
                <span className="text-[14px] text-[#1D1D1F]">lin***@gmail.com</span>
              </div>
              <div className="h-[1px] bg-[#EBEBE6]" />
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-[#8E8E93]">注册时间</span>
                <span className="text-[14px] text-[#1D1D1F]">2024年3月15日</span>
              </div>
            </div>

            <button className="w-full py-3 bg-[#1D1D1F] text-white rounded-[8px] font-medium">
              编辑资料
            </button>
          </div>

          <div className="p-6 pt-0 pb-8">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#F5F5F7] text-[#1D1D1F] rounded-[8px] font-medium"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const DataManagementModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('数据导出成功！已保存到本地相册');
    }, 2000);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('云端同步完成！');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[70]"
          >
            <div className="p-6 border-b border-[#F5F5F7]">
              <h2 className="text-[18px] font-bold font-serif text-[#1D1D1F] text-center mb-2">
                数据与备份
              </h2>
              <p className="text-[12px] text-[#8E8E93] text-center">
                Data Management
              </p>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-4 bg-[#F9F9F7] rounded-[8px] active:bg-[#EBEBE6] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 text-[#007AFF] ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-medium text-[#1D1D1F] font-serif">
                      {isSyncing ? '同步中...' : '云端同步'}
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">上次同步：今天 09:30</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-4 bg-[#F9F9F7] rounded-[8px] active:bg-[#EBEBE6] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                    <Download className={`w-5 h-5 text-[#34C759] ${isExporting ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-medium text-[#1D1D1F] font-serif">
                      {isExporting ? '导出中...' : '导出全部数据'}
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">包含照片、视频、文字记录</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-[#F9F9F7] rounded-[8px] active:bg-[#EBEBE6] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#FF9500]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-medium text-[#1D1D1F] font-serif">从备份恢复</p>
                    <p className="text-[11px] text-[#8E8E93]">选择本地备份文件恢复</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
              </button>

              <div className="mt-4 p-4 bg-[#FFF9E6] border border-[#FFE5B4] rounded-[8px]">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#FF9500] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-[#1D1D1F] mb-1 font-medium">温馨提示</p>
                    <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                      建议定期导出备份数据，防止意外丢失。导出的数据包含所有照片、视频、文字记录等家族记忆。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 pb-8">
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#F5F5F7] text-[#1D1D1F] rounded-[8px] font-medium"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Main Component ---

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);

  const sections: SettingSection[] = [
    {
      title: '账户与安全',
      items: [
        {
          icon: User,
          label: '账户信息',
          sub: '林志 · ID: 8829103',
          type: 'navigation',
          onClick: () => setShowAccountInfo(true)
        },
        {
          icon: Smartphone,
          label: '手机号绑定',
          sub: '138****8829',
          type: 'navigation'
        },
        {
          icon: Mail,
          label: '邮箱绑定',
          sub: 'lin***@gmail.com',
          type: 'navigation'
        },
        {
          icon: Lock,
          label: '修改密码',
          type: 'navigation'
        },
        {
          icon: Shield,
          label: '隐私设置',
          sub: '控制谁可以查看你的动态',
          type: 'navigation'
        }
      ]
    },
    {
      title: '通知与提醒',
      items: [
        {
          icon: Bell,
          label: '推送通知',
          sub: '动态更新、评论回复',
          type: 'toggle',
          value: true
        },
        {
          icon: Volume2,
          label: '声音提醒',
          type: 'toggle',
          value: true
        },
        {
          icon: Moon,
          label: '免打扰模式',
          sub: '每天 22:00 - 次日 08:00',
          type: 'toggle',
          value: false
        }
      ]
    },
    {
      title: '显示与界面',
      items: [
        {
          icon: Eye,
          label: '大字模式',
          sub: '适合长辈使用',
          type: 'toggle',
          value: false
        },
        {
          icon: Moon,
          label: '深色模式',
          type: 'toggle',
          value: false
        },
        {
          icon: Image,
          label: '流量节省',
          sub: '非Wi-Fi时不自动播放视频',
          type: 'toggle',
          value: true
        },
        {
          icon: Globe,
          label: '语言',
          sub: '简体中文',
          type: 'navigation'
        }
      ]
    },
    {
      title: '数据与存储',
      items: [
        {
          icon: Database,
          label: '数据备份',
          sub: '上次同步：今天 09:30',
          type: 'navigation',
          onClick: () => setShowDataManagement(true)
        },
        {
          icon: Download,
          label: '清理缓存',
          sub: '已使用 128 MB',
          type: 'navigation'
        }
      ]
    },
    {
      title: '帮助与反馈',
      items: [
        {
          icon: HelpCircle,
          label: '使用帮助',
          type: 'navigation'
        },
        {
          icon: MessageSquare,
          label: '意见反馈',
          type: 'navigation'
        },
        {
          icon: FileText,
          label: '用户协议',
          type: 'navigation'
        },
        {
          icon: Shield,
          label: '隐私政策',
          type: 'navigation'
        },
        {
          icon: Info,
          label: '关于林氏春秋',
          sub: 'v1.0.3',
          type: 'navigation'
        }
      ]
    },
    {
      title: '账户操作',
      items: [
        {
          icon: Share2,
          label: '推荐给好友',
          type: 'action',
          color: 'text-[#007AFF]'
        },
        {
          icon: Trash2,
          label: '注销账户',
          sub: '永久删除所有数据',
          type: 'action',
          color: 'text-[#B93A32]'
        },
        {
          icon: LogOut,
          label: '退出登录',
          type: 'action',
          color: 'text-[#FF3B30]'
        }
      ]
    }
  ];

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col"
      >
        {/* Header */}
        <div className="bg-white border-b border-[#EBEBE6] px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-black/5"
            >
              <ChevronRight className="w-6 h-6 rotate-180 text-[#1D1D1F]" />
            </button>
            <h1 className="text-[17px] font-bold font-serif text-[#1D1D1F]">设置</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto px-0 py-6">
          {sections.map((section, i) => (
            <SectionGroup key={i} section={section} />
          ))}

          {/* Version Info */}
          <div className="text-center py-8">
            <p className="text-[11px] text-[#C7C7CC] font-serif tracking-widest mb-2">
              Heritage v1.0.3
            </p>
            <p className="text-[10px] text-[#C7C7CC]">
              Made with ♡ for Family
            </p>
          </div>
        </div>

        {/* Bottom Safe Area */}
        <div className="h-6 bg-[#F9F9F7]" />
      </motion.div>

      {/* Modals */}
      <AccountInfoModal isOpen={showAccountInfo} onClose={() => setShowAccountInfo(false)} />
      <DataManagementModal isOpen={showDataManagement} onClose={() => setShowDataManagement(false)} />
    </>
  );
};