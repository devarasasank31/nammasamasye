// Namma Metro (BMRCL) stations used by the report flow so a metro complaint can
// name the exact station pair a citizen travelled between. Purple, Green and
// Yellow lines are operational; every station on them is listed below.

export type MetroLine = 'purple' | 'green' | 'yellow';

export interface MetroStation {
  name: string;
  line: MetroLine;
}

export const METRO_STATIONS: MetroStation[] = [
  // Purple Line — Whitefield (Kadugodi) to Challaghatta
  { name: 'Whitefield (Kadugodi)', line: 'purple' },
  { name: 'Hopefarm Channasandra', line: 'purple' },
  { name: 'Kadugodi Tree Park', line: 'purple' },
  { name: 'Pattandur Agrahara', line: 'purple' },
  { name: 'Sri Sathya Sai Hospital', line: 'purple' },
  { name: 'Nallurhalli', line: 'purple' },
  { name: 'Kundalahalli', line: 'purple' },
  { name: 'Seetharampalya', line: 'purple' },
  { name: 'Hoodi', line: 'purple' },
  { name: 'Garudacharpalya', line: 'purple' },
  { name: 'Singayyanapalya', line: 'purple' },
  { name: 'Krishnarajapura (K.R. Puram)', line: 'purple' },
  { name: 'Benniganahalli', line: 'purple' },
  { name: 'Baiyappanahalli', line: 'purple' },
  { name: 'Swami Vivekananda Road', line: 'purple' },
  { name: 'Indiranagar', line: 'purple' },
  { name: 'Halasuru', line: 'purple' },
  { name: 'Trinity', line: 'purple' },
  { name: 'MG Road', line: 'purple' },
  { name: 'Cubbon Park', line: 'purple' },
  { name: 'Dr. B.R. Ambedkar Station (Vidhana Soudha)', line: 'purple' },
  { name: 'Sir M. Visvesvaraya Station (Central College)', line: 'purple' },
  { name: 'Nadaprabhu Kempegowda Station (Majestic)', line: 'purple' },
  { name: 'KSR Railway Station', line: 'purple' },
  { name: 'Magadi Road', line: 'purple' },
  { name: 'Hosahalli', line: 'purple' },
  { name: 'Vijayanagar', line: 'purple' },
  { name: 'Attiguppe', line: 'purple' },
  { name: 'Deepanjali Nagar', line: 'purple' },
  { name: 'Mysuru Road', line: 'purple' },
  { name: 'Nayandahalli (Pantharapalya)', line: 'purple' },
  { name: 'Rajarajeshwari Nagar', line: 'purple' },
  { name: 'Jnanabharathi', line: 'purple' },
  { name: 'Pattanagere', line: 'purple' },
  { name: 'Kengeri Bus Terminal', line: 'purple' },
  { name: 'Kengeri', line: 'purple' },
  { name: 'Challaghatta', line: 'purple' },

  // Green Line — Madavara to Silk Institute
  { name: 'Madavara', line: 'green' },
  { name: 'Chikkabidarakallu', line: 'green' },
  { name: 'Manjunathanagara', line: 'green' },
  { name: 'Nagasandra', line: 'green' },
  { name: 'Dasarahalli', line: 'green' },
  { name: 'Jalahalli', line: 'green' },
  { name: 'Peenya Industry', line: 'green' },
  { name: 'Peenya', line: 'green' },
  { name: 'Goraguntepalya', line: 'green' },
  { name: 'Yeshwanthpur', line: 'green' },
  { name: 'Sandal Soap Factory', line: 'green' },
  { name: 'Mahalakshmi', line: 'green' },
  { name: 'Rajajinagar', line: 'green' },
  { name: 'Kuvempu Road', line: 'green' },
  { name: 'Srirampura', line: 'green' },
  { name: 'Sampige Road', line: 'green' },
  { name: 'Nadaprabhu Kempegowda Station (Majestic)', line: 'green' },
  { name: 'Chickpete', line: 'green' },
  { name: 'KR Market', line: 'green' },
  { name: 'National College', line: 'green' },
  { name: 'Lalbagh', line: 'green' },
  { name: 'South End Circle', line: 'green' },
  { name: 'Jayanagara', line: 'green' },
  { name: 'RV Road', line: 'green' },
  { name: 'Banashankari', line: 'green' },
  { name: 'JP Nagar', line: 'green' },
  { name: 'Yelachenahalli', line: 'green' },
  { name: 'Konanakunte Cross', line: 'green' },
  { name: 'Doddakallasandra', line: 'green' },
  { name: 'Vajarahalli', line: 'green' },
  { name: 'Thalaghattapura', line: 'green' },
  { name: 'Silk Institute', line: 'green' },

  // Yellow Line — RV Road to Bommasandra
  { name: 'RV Road', line: 'yellow' },
  { name: 'Ragigudda', line: 'yellow' },
  { name: 'Jayadeva Hospital', line: 'yellow' },
  { name: 'BTM Layout', line: 'yellow' },
  { name: 'Central Silk Board', line: 'yellow' },
  { name: 'Bommanahalli', line: 'yellow' },
  { name: 'Hongasandra', line: 'yellow' },
  { name: 'Kudlu Gate', line: 'yellow' },
  { name: 'Singasandra', line: 'yellow' },
  { name: 'Hosa Road', line: 'yellow' },
  { name: 'Beratena Agrahara', line: 'yellow' },
  { name: 'Electronic City', line: 'yellow' },
  { name: 'Infosys Agrahara', line: 'yellow' },
  { name: 'Huskur Road', line: 'yellow' },
  { name: 'Hebbagodi', line: 'yellow' },
  { name: 'Bommasandra', line: 'yellow' },
];

// Interchange stations (Majestic, RV Road) belong to two lines — one entry in
// the picker is enough, so names are de-duplicated here.
export const METRO_STATION_NAMES: string[] = Array.from(
  new Set(METRO_STATIONS.map(s => s.name))
).sort((a, b) => a.localeCompare(b));
