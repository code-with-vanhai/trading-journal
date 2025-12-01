import { featuresData } from '../../data/landing-page-data';
import { 
    IconBookOpen, 
    IconBarChart3, 
    IconBot, 
    IconRefreshCw, 
    IconUsers, 
    IconSmartphone 
} from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

const iconMap = {
    'fas fa-book': IconBookOpen,
    'fas fa-chart-bar': IconBarChart3,
    'fas fa-robot': IconBot,
    'fas fa-sync-alt': IconRefreshCw,
    'fas fa-users': IconUsers,
    'fas fa-mobile-alt': IconSmartphone,
};

export default function FeaturesSection() {
    return (
        <section id="features" className="py-20 px-4 relative">
            <div className="container mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Tính năng <span className="text-gradient">Mạnh Mẽ</span></h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Trading Journal cung cấp các công cụ chuyên nghiệp giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược giao dịch.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresData.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || IconBookOpen;
                        return (
                            <GlassCard key={index} hoverEffect={true} className="p-8 h-full">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center mb-6 border border-blue-200 dark:border-white/10">
                                    <IconComponent className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
