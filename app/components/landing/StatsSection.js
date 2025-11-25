import { statsData } from '../../data/landing-page-data';
import { IconUsers, IconRefreshCw, IconLineChart, IconShield, IconArrowUp } from '../ui/Icon';

const iconMap = {
    'fas fa-users': IconUsers,
    'fas fa-exchange-alt': IconRefreshCw,
    'fas fa-chart-line': IconLineChart,
    'fas fa-shield-alt': IconShield,
};

export default function StatsSection() {
    return (
        <section className="py-16 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Tin cậy bởi hàng ngàn nhà đầu tư</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Những con số ấn tượng về sự phát triển và hiệu quả của Trading Journal.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {statsData.map((stat, index) => {
                        const IconComponent = iconMap[stat.icon] || IconUsers;
                        return (
                            <div key={index} className="p-4 flex flex-col items-center">
                                <IconComponent className={`w-10 h-10 text-blue-600 dark:text-blue-400 mb-3`} />
                                <p className={`text-4xl font-bold mb-2 ${stat.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-900 dark:text-blue-300'} flex items-center justify-center`}>
                                    {stat.value}
                                    {stat.hasArrow && <IconArrowUp className="ml-2 text-green-500 dark:text-green-400 w-8 h-8" />}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
