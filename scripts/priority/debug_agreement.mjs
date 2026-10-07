import { analyzePriorityLocal } from '../../.eval-build/src/lib/priority-engine/analyze.js';

const cases = [
  ['water_supply_en', 'there is no water supply near Indiranagar 100ft Lane since 3 days'],
  ['water_supply_kn', 'Indiranagar 100ft Lane ಬಳಿ ಮೂರು ದಿನಗಳಿಂದ ಕುಡಿಯುವ ನೀರು ಇಲ್ಲ'],
  ['power_en', 'there is no electricity near HSR Layout Sector 2 since morning'],
  ['noise_kn', 'Jayanagar 4th Block ಬಳಿ ರಾತ್ರಿ ಜೋರಾಗಿ ಸಂಗೀತ ಹಾಕುತ್ತಿದ್ದಾರೆ'],
  ['bus_en', 'the bus is not coming near Domlur Flyover Stretch for 40 minutes'],
  ['bus_te', 'Indiranagar 100ft Lane దగ్గర 40 నిమిషాలుగా బస్సు రావడం లేదు'],
  ['govt_en', 'my application at the office near Whitefield ITPL Main is pending for 20 days'],
  ['bribe_te', 'Banashankari 3rd Stage దగ్గర ఆఫీసులో లంచం అడుగుతున్నారు'],
  ['streetlight_te', 'Yelahanka New Town దగ్ಗర స్ట్రీట్ లైట్ వెలగడం లేదు'],
  ['housing_en', 'my landlord has not returned the deposit near Marathahalli Bridge Area for 2 months'],
  ['minor_te', 'Domlur Flyover Stretch దగ్గర చిన్న ప్రమాదం, ఎవరికీ గాయం కాలేదు'],
  ['stray_en', 'a stray dog bit my child near Bellandur Lake View but there is no bleeding'],
  ['stray_hl', 'Kengeri Satellite Town ke paas stray dog ne bachche ko kaata, bleeding nahi ho rahi'],
  ['assault_hl', 'HSR Layout Sector 2 ke paas lathi se attack hua, bleeding ho rahi hai'],
  ['collapse_en', 'a wall of the house at Cunningham Road is collapsing'],
  ['collapse_en2', 'an old building near Tumkur Road Stretch is about to fall, need this resolved soon'],
  ['stab_en', 'someone is trying to kill me near Hoskote Town Center with a weapon, kindly attend to this'],
  ['wl_te', 'Yelahanka New Town దగ్గర రోడ్డు 4 రోజులుగా బ్లాక్, నీరునిలిచిపోయింది'],
  ['wl_en_80', 'water logging near Adugodi Metro Area, the road is blocked for 5 days, kindly look into this'],
  ['wl_hi_80', 'Marathahalli Bridge Area के पास पानी भरा है और रास्ता 4 दिन से बंद है, please take action on this'],
  ['wl_kn_74', 'Adugodi Metro Area ಬಳಿ ರಸ್ತೆ ಬ್ಲಾಕ್ ಆಗಿದೆ, ನೀರು ನಿಂತು 4 ದಿನ ಆಗಿದೆ, kindly look into this'],
  ['sew_en_p3', 'the road near Rajajinagar 2nd Block is blocked by sewage overflow since 3 days, need this resolved soon'],
  ['sew_en_80', 'sewage overflow near Adugodi Metro Area has made the road blocked for 5 days'],
  ['hi_bleed', 'Banashankari 3rd Stage के पास सड़क पर खून बह रहा है, काफी खून, kindly attend to this'],
  ['dog_te', 'HSR Layout Sector 2 దగ్గర వీధి కుక్క కరిచింది, రక్తం వస్తోంది'],
];

for (const [name, text] of cases) {
  const a = analyzePriorityLocal({ text, language: undefined });
  const f = a.facts;
  const d = a.breakdown || a.scoreBreakdown || a.scores || null;
  console.log(`\n=== ${name} → ${a.outOfDistribution ? 'OOD' : a.priority} (score ${a.score}${a.safetyOverride ? ' OVERRULED:' + a.safetyRules.join(',') : ''})`);
  console.log(`  types=${JSON.stringify(f.incidentTypes)} outOfDist=${f.outOfDistribution} immed=${f.immediateDanger} imminent=${f.imminentDanger} sevFlood=${f.severeFlood} emg=${f.emergencyAccessBlocked} people=${f.peopleAffected} acc=${f.accidentInvolved} wire=${f.wireDown} resolved=${f.resolvedNow}`);
  console.log(`  injuries=${JSON.stringify(f.injuries.map(i => i.kind))} days=${f.daysActive} matchCount=${a.matchCount ?? a.matches?.length ?? '?'}`);
  if (d) console.log(`  dims=${JSON.stringify(d)}`);
}
