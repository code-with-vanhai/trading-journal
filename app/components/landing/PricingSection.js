import Link from 'next/link';
import { pricingData } from '../../data/landing-page-data';
import { IconCheck, IconX } from '../ui/Icon';

export default function PricingSection() {
    return (
        <section id="pricing" className="py-16 bg-gray-50 dark:bg-gray-900 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Gói dịch vụ phù hợp cho bạn</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Lựa chọn gói dịch vụ phù hợp với nhu cầu đầu tư của bạn.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {pricingData.map((plan, index) => (
                        <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col border ${plan.highlight ? 'border-4 border-blue-600 dark:border-blue-500 shadow-2xl' : 'border-gray-200 dark:border-gray-700'}`}>
                            {plan.highlight && (
                                <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-2">
                                    <p className="font-bold text-sm">{plan.badge}</p>
                                </div>
                            )}
                            <div className="p-6 flex-grow">
                                <h3 className={`text-xl font-bold mb-2 text-center ${plan.highlight ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">{plan.description}</p>
                                <div className="mb-6 text-center">
                                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                                    {plan.period && <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>}
                                </div>
                                <ul className="mb-8 space-y-3 text-gray-700 dark:text-gray-300">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={`flex items-center ${!feature.included ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                                            {feature.included ? (
                                                <IconCheck className="text-green-500 dark:text-green-400 mr-3 w-5 h-5 flex-shrink-0" />
                                            ) : (
                                                <IconX className="text-red-500 dark:text-red-400 mr-3 w-5 h-5 flex-shrink-0" />
                                            )}
                                            {feature.bold ? <strong>{feature.text}</strong> : feature.text}
                                            {feature.note && '*'}
                                        </li>
                                    ))}
                                </ul>
                                {plan.note && <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">{plan.note}</p>}
                            </div>
                            <div className={`p-6 ${plan.highlight ? 'bg-blue-600 dark:bg-blue-700' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                {plan.ctaLink.startsWith('mailto') ? (
                                    <a href={plan.ctaLink} className={`w-full py-3 rounded-lg font-medium transition block text-center ${plan.highlight ? 'bg-white dark:bg-gray-100 text-blue-700 dark:text-blue-900 font-bold hover:bg-blue-100 dark:hover:bg-gray-200 shadow-md' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900'}`}>
                                        {plan.cta}
                                    </a>
                                ) : (
                                    <Link href={plan.ctaLink} className={`w-full py-3 rounded-lg font-medium transition block text-center ${plan.highlight ? 'bg-white dark:bg-gray-100 text-blue-700 dark:text-blue-900 font-bold hover:bg-blue-100 dark:hover:bg-gray-200 shadow-md' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900'}`}>
                                        {plan.cta}
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
