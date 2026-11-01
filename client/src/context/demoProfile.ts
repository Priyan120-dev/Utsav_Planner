import { EventProfile } from '@utsav/shared';

/**
 * Builds an authentic Indian celebration demo profile (6 months out).
 */
export function createDemoProfile(): EventProfile {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 6);
  const dateStr = targetDate.toISOString().split('T')[0];

  return {
    occasion: 'wedding',
    title: "Ananya & Rohit's Royal Palace Wedding",
    totalBudgetINR: 3500000, // 35 Lakhs INR
    expectedGuests: 350,
    eventDate: dateStr,
    city: 'Udaipur, Rajasthan',
    atmosphereTheme: 'Royal Mewar Heritage & Marigold Splendour',
    culturalNeeds: [
      'Sundowner Mehendi with Folk Langa Musicians',
      'High-Energy Bollywood Sangeet Night',
      'Traditional Vedic Pheras at Sunset',
      'Formal Reception Dinner'
    ],
    dietaryNeeds: [
      'Dedicated 100% Pure Vegetarian Kitchen',
      'Jain Cuisine Counter (No onion/garlic/root vegetables)',
      'Traditional Rajasthani Thali live station'
    ],
    accessibilityNeeds: [
      'Wheelchair access & ramp to Mandap stage',
      'Golf cart buggy transport for grandparents across the palace grounds'
    ],
    mustHaves: [
      'Cinematic Drone & 4K Wedding Film',
      'Live Shehnai and Nagada players during Barat'
    ],
    priorities: ['Catering & Dining', 'Photography & Cinematic Video', 'Decor, Mandap & Lighting'],
    recommendations: {
      themes: [
        'Rajputana Royalty: Deep crimson, antique gold & raw silk drapes',
        'Marigold Sunset: Thousands of fresh marigold cascades with brass lamps',
        'Courtyard Sufi Night: Candlelit lanterns, scented jasmine & shamiana'
      ],
      menuDirections: [
        'Royal Mewari Banquet: Daal Baati Churma, Ker Sangri, and Gatte ki Sabzi',
        'Live Chaat Bazaar: Benarasi Tamatar Chaat, Dahi Puri & Kulhad Chai',
        'Artisanal Mithai Counter: Warm Jalebi with Rabdi and Malpua'
      ],
      decorIdeas: [
        'Floating Brass Urli with rose petals and diyas along the palace walkway',
        'Carved wooden mandap pillars adorned with tuberose (rajnigandha)'
      ],
      culturalNotes: [
        'Coordinate Barat arrival 45 minutes prior to twilight muhurat',
        'Ensure family elders have comfortable cushioned seating near the mandap'
      ]
    }
  };
}
