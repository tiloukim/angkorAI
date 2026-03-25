export type Plan = 'free' | 'pro' | 'business'

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 100,
  pro: 1000,
  business: Infinity,
}

export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    nameKh: 'ឥតគិតថ្លៃ',
    price: 0,
    limit: 100,
    description: '100 messages per day',
    descriptionKh: '១០០ សារក្នុងមួយថ្ងៃ',
    color: 'text-gray-400',
    badge: 'bg-gray-700 text-gray-300',
  },
  pro: {
    name: 'Pro',
    nameKh: 'ប្រូ',
    price: 4.99,
    limit: 1000,
    description: '1,000 messages per day',
    descriptionKh: '១,០០០ សារក្នុងមួយថ្ងៃ',
    color: 'text-accent',
    badge: 'bg-accent/20 text-accent',
  },
  business: {
    name: 'Business',
    nameKh: 'អាជីវកម្ម',
    price: 9.99,
    limit: Infinity,
    description: 'Unlimited messages',
    descriptionKh: 'សារគ្មានដែនកំណត់',
    color: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
  },
}
