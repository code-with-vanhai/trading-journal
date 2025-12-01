import { testimonialsData } from '../../data/landing-page-data';
import { IconStar } from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

export default function TestimonialsSection() {
    const getColorClass = (color) => {
        const colorMap = {
            blue: 'bg-blue-600',
            green: 'bg-green-600',
            purple: 'bg-purple-600',
        };
        return colorMap[color] || colorMap.blue;
    };

    return (
        <section className="py-20 px-4 relative">
            <div className="container mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Nhà đầu tư nói gì về <span className="text-gradient">Chúng Tôi</span></h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Hàng ngàn nhà đầu tư đã cải thiện hiệu suất giao dịch của họ với Trading Journal.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonialsData.map((testimonial, index) => (
                        <GlassCard key={index} className="p-8 relative overflow-hidden" hoverEffect={true}>
                             {/* Decorative Quote Icon */}
                             <div className="absolute top-4 right-4 text-6xl text-gray-900/5 dark:text-white/5 font-serif">"</div>
                            
                            <div className="text-yellow-500 dark:text-yellow-400 mb-6 flex">
                                {[...Array(5)].map((_, i) => {
                                    return (
                                        <IconStar 
                                            key={i} 
                                            className={`w-5 h-5 ${i < Math.floor(testimonial.rating) ? 'fill-current' : i === Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0 ? 'fill-current opacity-50' : 'opacity-30'}`}
                                        />
                                    );
                                })}
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 relative z-10 leading-relaxed italic">"{testimonial.content}"</p>
                            <div className="flex items-center relative z-10 border-t border-gray-200 dark:border-white/10 pt-6">
                                <div className={`${getColorClass(testimonial.color)} rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg ring-2 ring-white/20`}>
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-300">{testimonial.role}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
}
