import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const demoIncidents = [
  {
    category_id: 'TRAFFIC', subcategory: 'traffic_accident',
    original_text: 'A car hit my bike near Koramangala Signal. The driver started arguing with me.',
    location: 'Koramangala Signal, Bengaluru', location_area: 'Koramangala',
    language: 'en', status: 'UNDER_REVIEW', ai_confidence: 96,
    ai_scenario_match: 'Road accident',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_pothole',
    original_text: 'Huge pothole on 80 Feet Road near Indiranagar. Very dangerous for two-wheelers.',
    location: '80 Feet Road, Indiranagar', location_area: 'Indiranagar',
    language: 'en', status: 'PROCEEDING', ai_confidence: 92,
    ai_scenario_match: 'Pothole',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_garbage',
    original_text: 'Garbage dumping near BTM Layout 2nd Stage. It has been there for a week.',
    location: 'BTM Layout 2nd Stage', location_area: 'BTM Layout',
    language: 'en', status: 'NEW', ai_confidence: 88,
    ai_scenario_match: 'Garbage dumping',
  },
  {
    category_id: 'GOVERNMENT', subcategory: 'unofficial_payment',
    original_text: 'Traffic police asked me for 250 instead of giving me the challan near MG Road.',
    location: 'MG Road, Bengaluru', location_area: 'MG Road',
    language: 'en', status: 'UNDER_REVIEW', ai_confidence: 94,
    ai_scenario_match: 'Alleged unofficial payment request',
  },
  {
    category_id: 'TRAFFIC', subcategory: 'traffic_parking',
    original_text: 'Car parked on footpath near HSR Layout. Pedestrians cannot walk.',
    location: 'HSR Layout, Bengaluru', location_area: 'HSR Layout',
    language: 'en', status: 'CLOSED', ai_confidence: 85,
    ai_scenario_match: 'Illegal parking',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_streetlight',
    original_text: 'Streetlight not working near Whitefield Main Road for 2 weeks.',
    location: 'Whitefield Main Road', location_area: 'Whitefield',
    language: 'en', status: 'PROCEEDING', ai_confidence: 90,
    ai_scenario_match: 'Streetlight failure',
  },
  {
    category_id: 'PUBLIC_SAFETY', subcategory: 'safety_harassment',
    original_text: 'Someone following me near JP Nagar. Feeling unsafe.',
    location: 'JP Nagar, Bengaluru', location_area: 'JP Nagar',
    language: 'en', status: 'MISSING_INFORMATION', ai_confidence: 78,
    ai_scenario_match: 'Safety concern',
  },
  {
    category_id: 'DIGITAL', subcategory: 'cybercrime',
    original_text: 'Received phishing link claiming to be from bank. Almost entered my details.',
    location: 'Online', location_area: '',
    language: 'en', status: 'NEW', ai_confidence: 82,
    ai_scenario_match: 'Cybercrime - phishing',
  },
  {
    category_id: 'HOUSING', subcategory: 'housing_tenant',
    original_text: 'Landlord not returning deposit even after 2 months of vacating. No proper notice given.',
    location: 'Electronic City, Bengaluru', location_area: 'Electronic City',
    language: 'en', status: 'UNDER_REVIEW', ai_confidence: 87,
    ai_scenario_match: 'Tenant-landlord dispute',
  },
  {
    category_id: 'ENVIRONMENT', subcategory: 'env_noise',
    original_text: 'Construction noise after 10 PM in residential area near Sarjapur Road.',
    location: 'Sarjapur Road, Bengaluru', location_area: 'Sarjapur',
    language: 'en', status: 'NEW', ai_confidence: 91,
    ai_scenario_match: 'Noise pollution',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_pothole',
    original_text: 'Multiple potholes on Outer Ring Road near Marathahalli bridge.',
    location: 'Outer Ring Road, Marathahalli', location_area: 'Marathahalli',
    language: 'en', status: 'UNDER_REVIEW', ai_confidence: 93,
    ai_scenario_match: 'Road damage',
  },
  {
    category_id: 'TRAFFIC', subcategory: 'traffic_interaction',
    original_text: 'Traffic police stopped me without any reason and asked for documents repeatedly.',
    location: 'Silk Board, Bengaluru', location_area: 'Silk Board',
    language: 'en', status: 'NEW', ai_confidence: 76,
    ai_scenario_match: 'Traffic stop concern',
  },
  {
    category_id: 'UTILITIES', subcategory: 'util_power',
    original_text: 'Power outage in entire layout since morning. No notice from BESCOM.',
    location: 'Kadugodi, Bengaluru', location_area: 'Kadugodi',
    language: 'en', status: 'PROCEEDING', ai_confidence: 95,
    ai_scenario_match: 'Power outage',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_drainage',
    original_text: 'Drainage blocked near banashankari causing water logging.',
    location: 'Banashankari, Bengaluru', location_area: 'Banashankari',
    language: 'en', status: 'NEW', ai_confidence: 89,
    ai_scenario_match: 'Drainage blockage',
  },
  {
    category_id: 'CIVIC', subcategory: 'civic_footpath',
    original_text: 'Footpath encroached by shops near Jayanagar 4th Block.',
    location: 'Jayanagar 4th Block, Bengaluru', location_area: 'Jayanagar',
    language: 'en', status: 'UNDER_REVIEW', ai_confidence: 86,
    ai_scenario_match: 'Footpath obstruction',
  },
];

const demoResources = [
  {
    title: 'Bangalore Traffic Police', category: 'TRAFFIC', authority: 'Bangalore City Traffic Police',
    official_url: 'https://www.bangaloretrafficpolice.gov.in', official_phone: '080-22943400',
    description: 'Traffic complaints and accident reports.', language: 'en', source: 'Official website', active: true,
  },
  {
    title: 'BBMP', category: 'CIVIC', authority: 'BBMP',
    official_url: 'https://bbmp.gov.in', official_phone: '1918',
    description: 'Civic issues: potholes, garbage, streetlights, drainage.', language: 'en', source: 'Official website', active: true,
  },
  {
    title: 'BESCOM', category: 'UTILITIES', authority: 'BESCOM',
    official_url: 'https://bescom.karnataka.gov.in', official_phone: '1912',
    description: 'Power outage and electricity complaints.', language: 'en', source: 'Official website', active: true,
  },
  {
    title: 'Cyber Crime Portal', category: 'DIGITAL', authority: 'MHA',
    official_url: 'https://cybercrime.gov.in', official_phone: '1930',
    description: 'Report cybercrime and online fraud.', language: 'en', source: 'Official website', active: true,
  },
  {
    title: 'Karnataka Police', category: 'PUBLIC_SAFETY', authority: 'KSP',
    official_url: 'https://karnataka.gov.in/police', official_phone: '100',
    description: 'Public safety and emergency.', language: 'en', source: 'Official website', active: true,
  },
];

async function seed() {
  console.log('Seeding demo incidents...');
  for (const inc of demoIncidents) {
    const { data: session } = await supabase.from('sessions').insert({ language: inc.language }).select().single();
    if (session) {
      const { data: incident } = await supabase.from('incidents').insert({
        ...inc,
        session_id: session.id,
        structured_interpretation: '',
        ai_summary: inc.original_text,
        ai_reason: `AI matched based on keywords in the description.`,
      }).select().single();

      if (incident) {
        await supabase.from('status_history').insert({
          incident_id: incident.id,
          previous_status: null,
          new_status: inc.status,
          admin_id: 'system',
          admin_note: 'Demo data',
        });
      }
    }
  }
  console.log('Demo incidents seeded.');

  console.log('Seeding official resources...');
  await supabase.from('official_resources').insert(demoResources);
  console.log('Resources seeded.');
}

seed().catch(console.error);
