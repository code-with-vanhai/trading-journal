import Link from 'next/link';
import { pricingData } from '../../data/landing-page-data';
import { IconCheck, IconX } from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

export default function PricingSection() {
    return (
        <section id="pricing" className="py-20 px-4 relative">
            <div className="container mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Gói dịch vụ <span className="text-gradient">Phù Hợp</span></h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Lựa chọn gói dịch vụ phù hợp với nhu cầu đầu tư của bạn.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {pricingData.map((plan, index) => (
                        <GlassCard 
                            key={index} 
                            className={`flex flex-col h-full relative overflow-hidden ${plan.highlight ? 'border-blue-500/50 dark:border-blue-400/50 shadow-lg dark:shadow-[0_0_30px_rgba(59,130,246,0.15)] transform scale-105 z-10' : ''}`}
                        >
                            {plan.highlight && (
                                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center py-2 font-bold text-sm tracking-wider uppercase shadow-lg">
                                    {plan.badge}
                                </div>
                            )}
                            <div className="p-8 flex-grow flex flex-col">
                                <h3 className={`text-xl font-bold mb-2 text-center ${plan.highlight ? 'text-blue-600 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center text-sm">{plan.description}</p>
                                <div className="mb-8 text-center">
                                    <span className={`text-5xl font-bold ${plan.highlight ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>{plan.price}</span>
                                    {plan.period && <span className="text-gray-500 block mt-2 text-sm">{plan.period}</span>}
                                </div>
                                <ul className="mb-8 space-y-4 text-gray-600 dark:text-gray-300 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={`flex items-start ${!feature.included ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                                            {feature.included ? (
                                                <IconCheck className="text-green-500 dark:text-green-400 mr-3 w-5 h-5 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <IconX className="text-gray-400 dark:text-gray-600 mr-3 w-5 h-5 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span className="text-sm">
                                                {feature.bold ? <strong className="text-gray-900 dark:text-gray-100">{feature.text}</strong> : feature.text}
                                                {feature.note && '*'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.note && <p className="text-xs text-gray-500 mt-4 text-center">{plan.note}</p>}
                            </div>
                            <div className="p-8 pt-0 mt-auto">
                                {plan.ctaLink.startsWith('mailto') ? (
                                    <a href={plan.ctaLink} className={`w-full py-3 rounded-xl font-bold transition-all duration-300 block text-center ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-gray-200 dark:border-white/10'}`}>
                                        {plan.cta}
                                    </a>
                                ) : (
                                    <Link href={plan.ctaLink} className={`w-full py-3 rounded-xl font-bold transition-all duration-300 block text-center ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-gray-200 dark:border-white/10'}`}>
                                        {plan.cta}
                                    </Link>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
}
