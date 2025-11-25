import { testimonialsData } from '../../data/landing-page-data';
import { IconStar } from '../ui/Icon';

export default function TestimonialsSection() {
    const getColorClass = (color) => {
        const colorMap = {
            blue: 'bg-blue-600 dark:bg-blue-700',
            green: 'bg-green-600 dark:bg-green-700',
            purple: 'bg-purple-600 dark:bg-purple-700',
        };
        return colorMap[color] || colorMap.blue;
    };

    return (
        <section className="py-16 bg-white dark:bg-gray-900 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Nhà đầu tư nói gì về chúng tôi</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Hàng ngàn nhà đầu tư đã cải thiện hiệu suất giao dịch của họ với Trading Journal.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonialsData.map((testimonial, index) => (
                        <div key={index} className="testimonial-card bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <div className="text-yellow-500 dark:text-yellow-400 mb-4 flex">
                                {[...Array(5)].map((_, i) => {
                                    const isHalfStar = i >= Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0 && i === Math.floor(testimonial.rating);
                                    return (
                                        <IconStar 
                                            key={i} 
                                            className={`w-5 h-5 ${i < Math.floor(testimonial.rating) ? 'fill-current' : i === Math.floor(testimonial.rating) && testimonial.rating % 1 !== 0 ? 'fill-current opacity-50' : 'opacity-30'}`}
                                        />
                                    );
                                })}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-6 relative z-10">{testimonial.content}</p>
                            <div className="flex items-center relative z-10">
                                <div className={`${getColorClass(testimonial.color)} rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md`}>
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
