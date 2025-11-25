import { featuresData } from '../../data/landing-page-data';
import { 
    IconBookOpen, 
    IconBarChart3, 
    IconBot, 
    IconRefreshCw, 
    IconUsers, 
    IconSmartphone 
} from '../ui/Icon';

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
        <section id="features" className="py-16 bg-gray-50 dark:bg-gray-900 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Tính năng mạnh mẽ hỗ trợ bạn</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Trading Journal cung cấp các công cụ chuyên nghiệp giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược giao dịch.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresData.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || IconBookOpen;
                        return (
                            <div key={index} className="feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                                <div className="text-blue-600 dark:text-blue-400 mb-4">
                                    <IconComponent className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
