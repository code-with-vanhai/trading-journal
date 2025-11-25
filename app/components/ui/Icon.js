/**
 * Icon Component Wrapper
 * Centralized icon exports from Lucide React
 * Makes it easy to replace icons in the future
 */

// Common icons used throughout the app
export {
  // Navigation & UI
  Menu as IconMenu,
  X as IconX,
  ChevronDown as IconChevronDown,
  ChevronUp as IconChevronUp,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  
  // Charts & Analytics
  TrendingUp as IconTrendingUp,
  TrendingDown as IconTrendingDown,
  LineChart as IconLineChart,
  BarChart as IconBarChart,
  PieChart as IconPieChart,
  Activity as IconActivity,
  
  // Finance & Trading
  DollarSign as IconDollarSign,
  Wallet as IconWallet,
  CreditCard as IconCreditCard,
  Receipt as IconReceipt,
  Calculator as IconCalculator,
  Coins as IconCoins,
  Percent as IconPercent,
  
  // Actions
  Plus as IconPlus,
  Minus as IconMinus,
  Edit as IconEdit,
  Trash2 as IconTrash,
  Eye as IconEye,
  EyeOff as IconEyeOff,
  Save as IconSave,
  Download as IconDownload,
  Upload as IconUpload,
  Search as IconSearch,
  Filter as IconFilter,
  Settings as IconSettings,
  
  // Status & Feedback
  Check as IconCheck,
  XCircle as IconXCircle,
  AlertCircle as IconAlertCircle,
  Info as IconInfo,
  CheckCircle as IconCheckCircle,
  
  // User & Account
  User as IconUser,
  UserCircle as IconUserCircle,
  LogOut as IconLogOut,
  LogIn as IconLogIn,
  Users as IconUsers,
  
  // Portfolio & Stocks
  Briefcase as IconBriefcase,
  Building2 as IconBuilding2,
  TrendingUp as IconStockUp,
  TrendingDown as IconStockDown,
  
  // Time & Date
  Calendar as IconCalendar,
  Clock as IconClock,
  
  // Other
  Home as IconHome,
  FileText as IconFileText,
  BookOpen as IconBookOpen,
  Bell as IconBell,
  Moon as IconMoon,
  Sun as IconSun,
  RefreshCw as IconRefresh,
  ArrowRight as IconArrowRight,
  ArrowLeft as IconArrowLeft,
  ArrowDown as IconArrowDown,
  ArrowUp as IconArrowUp,
  ExternalLink as IconExternalLink,
  Shield as IconShield,
  ShieldCheck as IconShieldCheck,
  Scale as IconScale,
  Factory as IconFactory,
  Gauge as IconGauge,
  Waves as IconWaves,
  AreaChart as IconAreaChart,
  BarChart3 as IconBarChart3,
  Bot as IconBot,
  RefreshCw as IconRefreshCw,
  Smartphone as IconSmartphone,
  MapPin as IconMapPin,
  Phone as IconPhone,
  Mail as IconMail,
  Facebook as IconFacebook,
  Twitter as IconTwitter,
  Linkedin as IconLinkedin,
  Youtube as IconYoutube,
  Star as IconStar,
  CheckCircle2 as IconCheckCircle2,
  Rocket as IconRocket,
  ChessKing as IconChessKing,
  Lock as IconLock,
  RotateCw as IconRotateCw,
  CalendarCheck as IconCalendarCheck,
  Inbox as IconInbox,
} from 'lucide-react';

// Helper function to map Font Awesome classes to Lucide icons
// This can be used during migration
export const iconMap = {
  'fa-chart-line': 'IconLineChart',
  'fa-user-circle': 'IconUserCircle',
  'fa-sign-out-alt': 'IconLogOut',
  'fa-sign-in-alt': 'IconLogIn',
  'fa-bars': 'IconMenu',
  'fa-times': 'IconX',
  'fa-plus': 'IconPlus',
  'fa-edit': 'IconEdit',
  'fa-trash': 'IconTrash',
  'fa-eye': 'IconEye',
  'fa-eye-slash': 'IconEyeOff',
  'fa-search': 'IconSearch',
  'fa-filter': 'IconFilter',
  'fa-settings': 'IconSettings',
  'fa-check': 'IconCheck',
  'fa-check-circle': 'IconCheckCircle',
  'fa-times-circle': 'IconXCircle',
  'fa-exclamation-triangle': 'IconAlertCircle',
  'fa-info-circle': 'IconInfo',
  'fa-briefcase': 'IconBriefcase',
  'fa-building': 'IconBuilding2',
  'fa-calendar': 'IconCalendar',
  'fa-clock': 'IconClock',
  'fa-home': 'IconHome',
  'fa-file-text': 'IconFileText',
  'fa-book-open': 'IconBookOpen',
  'fa-bell': 'IconBell',
  'fa-moon': 'IconMoon',
  'fa-sun': 'IconSun',
  'fa-refresh': 'IconRefresh',
  'fa-arrow-right': 'IconArrowRight',
  'fa-arrow-left': 'IconArrowLeft',
  'fa-external-link': 'IconExternalLink',
  'fa-download': 'IconDownload',
  'fa-upload': 'IconUpload',
  'fa-save': 'IconSave',
  'fa-dollar-sign': 'IconDollarSign',
  'fa-wallet': 'IconWallet',
  'fa-credit-card': 'IconCreditCard',
  'fa-receipt': 'IconReceipt',
  'fa-calculator': 'IconCalculator',
};

