import { useVenueStore } from '../../store/useVenueStore';
import { useTranslation, LanguageCode } from '../../locales';
import { api } from '../../services/api';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export interface SidebarController {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  activeSessionsCount: number;
  tenant: { name: string; staffName: string };
  openGatewaySettingsModal: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  langOptions: LanguageOption[];
  t: (key: any) => string;
  handleLogout: () => Promise<void>;
}

export const useSidebarController = (): SidebarController => {
  const { activeTab, setActiveTab, resources, tenant, openGatewaySettingsModal, language, setLanguage } = useVenueStore();
  const { t } = useTranslation();
  const activeSessionsCount = resources.filter((r) => r.status === 'IN_PROGRESS').length;

  const langOptions: LanguageOption[] = [
    { code: 'en', label: 'EN' },
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const handleLogout = async () => {
    if (window.confirm('Sign out and revoke this session?')) {
      await api.logout();
      window.location.reload();
    }
  };

  return {
    activeTab,
    setActiveTab,
    activeSessionsCount,
    tenant,
    openGatewaySettingsModal,
    language,
    setLanguage,
    langOptions,
    t,
    handleLogout,
  };
};
