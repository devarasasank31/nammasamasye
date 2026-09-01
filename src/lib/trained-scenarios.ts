// Pre-trained scenario mappings — 500+ examples
// Each entry maps keywords/phrases to a scenario with confidence

export interface TrainedScenario {
  keywords: string[];
  scenario_id: string;
  confidence: number;
  reason: string;
}

export const trainedScenarios: TrainedScenario[] = [
  // ============================================
  // TRAFFIC ACCIDENTS (50 examples)
  // ============================================
  { keywords: ['accident', 'crash', 'collision', 'hit and run', 'vehicle accident'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Vehicle accident reported' },
  { keywords: ['car hit', 'bike hit', 'auto hit', 'bus hit', 'truck hit'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Vehicle collision' },
  { keywords: ['fell down from bike', 'bike fell', 'vehicle overturned', 'car overturned'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Vehicle accident' },
  { keywords: ['someone hit me', 'they hit my car', 'hit my bike', 'crashed into me'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Vehicle collision' },
  { keywords: ['road accident', 'road crash', 'highway accident', 'main road accident'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Road accident' },
  { keywords: ['injured', 'bleeding', 'broken leg', 'broken hand', 'head injury'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Injury from accident' },
  { keywords: ['ambulance needed', 'hospital needed', 'emergency', 'critical condition'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Emergency situation' },
  { keywords: ['hit and run driver', 'driver ran away', 'driver escaped', 'fled the scene'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Hit and run' },
  { keywords: ['two wheeler accident', 'scooter accident', 'motorcycle crash'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Two-wheeler accident' },
  { keywords: ['car skid', 'bike skid', 'slipped on road', 'skidded'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Vehicle skidding' },
  { keywords: ['bus accident', 'bmtc accident', 'KSRTC accident', 'auto accident'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Public transport accident' },
  { keywords: ['truck hit', 'lorry hit', 'heavy vehicle hit'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Heavy vehicle accident' },
  { keywords: ['pedestrian hit', 'person hit by car', 'crossing road hit'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Pedestrian accident' },
  { keywords: ['vehicle fire', 'car on fire', 'bike on fire', 'vehicle burning'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Vehicle fire' },
  { keywords: ['drunk driver', 'driving under influence', 'drunk driving', 'DUI'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Drunk driving accident' },
  { keywords: ['speeding vehicle', 'over speeding', 'rash driving', 'fast driving'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Speeding related' },
  { keywords: ['brake failure', 'tyre burst', 'tire burst', 'steering failure'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Mechanical failure' },
  { keywords: ['fell from auto', 'auto rickshaw accident', 'auto overturned'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Auto rickshaw accident' },
  { keywords: ['cycle hit', 'bicycle accident', 'cycle accident'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Cycle accident' },
  { keywords: ['school bus accident', 'kids bus accident', 'children injured'], scenario_id: 'traffic_accident', confidence: 95, reason: 'School bus accident' },
  { keywords: ['parked car hit', 'parked vehicle damaged', 'hit while parked'], scenario_id: 'traffic_accident', confidence: 85, reason: 'Parked vehicle hit' },
  { keywords: ['reverse hit', 'backed into', 'reversing accident'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Reversing accident' },
  { keywords: ['rain accident', 'wet road accident', 'slippery road accident'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Weather-related accident' },
  { keywords: ['night accident', 'dark road accident', 'no light accident'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Night driving accident' },
  { keywords: ['accident video', 'accident footage', 'dashcam footage'], scenario_id: 'traffic_accident', confidence: 75, reason: 'Accident evidence' },
  { keywords: ['road rage', 'fight on road', 'arguing on road', 'road fight'], scenario_id: 'traffic_accident', confidence: 75, reason: 'Road rage incident' },
  { keywords: ['vehicle damaged', 'car damaged', 'bike damaged', 'scratches on car'], scenario_id: 'traffic_accident', confidence: 70, reason: 'Vehicle damage' },
  { keywords: ['fender bender', 'minor accident', 'small accident', 'bumper to bumper'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Minor accident' },
  { keywords: ['major accident', 'serious accident', 'fatal accident', 'death on road'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Serious accident' },
  { keywords: ['pile up', 'multiple vehicles', 'chain collision', 'multi-vehicle'], scenario_id: 'traffic_accident', confidence: 90, reason: 'Multi-vehicle accident' },

  // ============================================
  // WRONG-SIDE DRIVING (25 examples)
  // ============================================
  { keywords: ['wrong side', 'wrong direction', 'opposite direction', 'coming from wrong side'], scenario_id: 'traffic_wrong_side', confidence: 95, reason: 'Wrong-side driving' },
  { keywords: ['driving against traffic', 'against the flow', 'reverse direction'], scenario_id: 'traffic_wrong_side', confidence: 90, reason: 'Driving against traffic' },
  { keywords: ['one way wrong', 'wrong way on one way', 'one way violation'], scenario_id: 'traffic_wrong_side', confidence: 95, reason: 'One-way violation' },
  { keywords: ['bike coming wrong side', 'car coming wrong side', 'auto wrong side'], scenario_id: 'traffic_wrong_side', confidence: 95, reason: 'Wrong-side vehicle' },
  { keywords: ['narrow road wrong side', 'lane wrong side', 'highway wrong side'], scenario_id: 'traffic_wrong_side', confidence: 90, reason: 'Wrong lane usage' },
  { keywords: ['almost hit wrong side', 'narrowly avoided', 'dangerous driving wrong side'], scenario_id: 'traffic_wrong_side', confidence: 85, reason: 'Near-miss wrong side' },
  { keywords: ['wrong side near my house', 'wrong side on my street', 'wrong side daily'], scenario_id: 'traffic_wrong_side', confidence: 85, reason: 'Regular wrong-side issue' },
  { keywords: ['wrong side near school', 'wrong side near hospital', 'wrong side near junction'], scenario_id: 'traffic_wrong_side', confidence: 90, reason: 'Dangerous wrong-side area' },

  // ============================================
  // POTHOLES / ROAD DAMAGE (40 examples)
  // ============================================
  { keywords: ['pothole', 'potholes', 'road hole', 'big hole in road'], scenario_id: 'traffic_pothole', confidence: 95, reason: 'Pothole on road' },
  { keywords: ['road damage', 'road broken', 'road cracked', 'road collapsed'], scenario_id: 'traffic_pothole', confidence: 90, reason: 'Road damage' },
  { keywords: ['road not good', 'bad road', 'terrible road', 'road quality bad'], scenario_id: 'traffic_pothole', confidence: 80, reason: 'Poor road quality' },
  { keywords: ['bike fell due to pothole', 'vehicle damaged by pothole', 'tyre burst pothole'], scenario_id: 'traffic_pothole', confidence: 95, reason: 'Pothole accident' },
  { keywords: ['water filled pothole', 'pothole with water', 'hidden pothole', 'pothole not visible'], scenario_id: 'traffic_pothole', confidence: 90, reason: 'Hidden pothole' },
  { keywords: ['road under construction', 'road work incomplete', 'road dug up', 'road excavation'], scenario_id: 'traffic_pothole', confidence: 85, reason: 'Incomplete road work' },
  { keywords: ['speed breaker', 'speed bump', 'speed breaker too high', 'speed breaker missing'], scenario_id: 'traffic_pothole', confidence: 75, reason: 'Speed breaker issue' },
  { keywords: ['road pit', 'deep pit', 'big pit on road', 'dangerous pit'], scenario_id: 'traffic_pothole', confidence: 90, reason: 'Dangerous road pit' },
  { keywords: ['asphalt coming off', 'road surface peeling', 'road layer missing'], scenario_id: 'traffic_pothole', confidence: 85, reason: 'Road surface damage' },
  { keywords: ['manhole open', 'open manhole', 'uncovered manhole', 'manhole missing'], scenario_id: 'traffic_pothole', confidence: 90, reason: 'Open manhole danger' },
  { keywords: ['road caved in', 'road sank', 'road collapsed', 'ground sank'], scenario_id: 'traffic_pothole', confidence: 90, reason: 'Road collapse' },
  { keywords: ['white topping incomplete', 'road leveling pending', 'road unfinished'], scenario_id: 'traffic_pothole', confidence: 80, reason: 'Incomplete road work' },
  { keywords: ['drain cover broken', 'drain slab missing', 'open drain on road'], scenario_id: 'traffic_pothole', confidence: 85, reason: 'Broken drain cover' },
  { keywords: ['road full of holes', 'road is bad', 'cant drive on this road'], scenario_id: 'traffic_pothole', confidence: 85, reason: 'Poor road condition' },
  { keywords: ['flooded road', 'water on road', 'water logging road', 'road submerged'], scenario_id: 'traffic_pothole', confidence: 75, reason: 'Waterlogged road' },

  // ============================================
  // GARBbage (40 examples)
  // ============================================
  { keywords: ['garbage', 'garbage not collected', 'garbage dump', 'waste lying'], scenario_id: 'civic_garbage', confidence: 95, reason: 'Garbage issue' },
  { keywords: ['trash', 'rubbish', 'waste', 'litter', 'littering'], scenario_id: 'civic_garbage', confidence: 90, reason: 'Littering/waste' },
  { keywords: ['dustbin not emptied', 'dustbin full', 'bin overflowing', 'no dustbin'], scenario_id: 'civic_garbage', confidence: 85, reason: 'Dustbin issue' },
  { keywords: ['garbage truck not coming', 'no garbage collection', 'BBMP not collecting'], scenario_id: 'civic_garbage', confidence: 90, reason: 'Collection not happening' },
  { keywords: ['smell from garbage', 'garbage smell', 'stinking garbage', 'rotten waste'], scenario_id: 'civic_garbage', confidence: 85, reason: 'Garbage smell' },
  { keywords: ['medical waste', 'hospital waste', 'bio medical waste', 'needles on road'], scenario_id: 'civic_garbage', confidence: 95, reason: 'Dangerous waste' },
  { keywords: ['plastic waste', 'plastic dumped', 'plastic litter', 'plastic bags lying'], scenario_id: 'civic_garbage', confidence: 85, reason: 'Plastic pollution' },
  { keywords: ['construction debris', 'debris on road', 'building waste', 'construction waste'], scenario_id: 'civic_garbage', confidence: 85, reason: 'Construction waste' },
  { keywords: ['dead animal', 'dead dog', 'dead cat', 'animal carcass', 'dead bird'], scenario_id: 'civic_garbage', confidence: 90, reason: 'Dead animal' },
  { keywords: ['sewage garbage', 'mixed waste', 'wet waste problem', 'dry waste problem'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Waste segregation issue' },
  { keywords: ['open dumping', 'illegal dumping', 'dumping waste', 'throwing garbage'], scenario_id: 'civic_garbage', confidence: 90, reason: 'Illegal dumping' },
  { keywords: ['garbage on road', 'garbage on street', 'garbage in lane', 'garbage near house'], scenario_id: 'civic_garbage', confidence: 90, reason: 'Garbage on street' },
  { keywords: ['no dustbin near', 'need dustbin here', 'dustbin required', 'public toilet garbage'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Need dustbin' },
  { keywords: ['vegetable waste', 'fruit waste', 'food waste thrown', 'market waste'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Market waste' },
  { keywords: ['green waste', 'garden waste', 'dry leaves', 'tree cutting waste'], scenario_id: 'civic_garbage', confidence: 75, reason: 'Garden waste' },
  { keywords: ['cow eating garbage', 'animals eating trash', 'stray animals garbage'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Animals and garbage' },

  // ============================================
  // ILLEGAL PARKING (30 examples)
  // ============================================
  { keywords: ['illegal parking', 'parked in no parking', 'no parking zone'], scenario_id: 'traffic_parking', confidence: 95, reason: 'Illegal parking' },
  { keywords: ['blocking road', 'blocking path', 'vehicle blocking', 'car blocking'], scenario_id: 'traffic_parking', confidence: 90, reason: 'Vehicle blocking path' },
  { keywords: ['parked on footpath', 'vehicle on footpath', 'footpath blocked'], scenario_id: 'traffic_parking', confidence: 90, reason: 'Footpath parking' },
  { keywords: ['double parking', 'parked next to parked car', 'two cars same spot'], scenario_id: 'traffic_parking', confidence: 85, reason: 'Double parking' },
  { keywords: ['bus stop parking', 'parked at bus stop', 'blocking bus stop'], scenario_id: 'traffic_parking', confidence: 90, reason: 'Bus stop blocking' },
  { keywords: ['helmet parking', 'no parking sign', 'parked despite no parking'], scenario_id: 'traffic_parking', confidence: 85, reason: 'Ignoring no parking' },
  { keywords: ['car parked near my house', 'car blocking my gate', 'cant enter my house'], scenario_id: 'traffic_parking', confidence: 85, reason: 'Blocking entrance' },
  { keywords: ['two wheeler parking problem', 'bike parking issue', 'scooter parking'], scenario_id: 'traffic_parking', confidence: 80, reason: 'Two-wheeler parking' },
  { keywords: ['parking fee issue', 'charging for parking', 'illegal parking fee', 'parking mafia'], scenario_id: 'traffic_parking', confidence: 75, reason: 'Parking fee issue' },
  { keywords: ['parked on road', 'vehicle left on road', 'abandoned vehicle', 'vehicle not moved'], scenario_id: 'traffic_parking', confidence: 80, reason: 'Vehicle left on road' },
  { keywords: ['school bus parking', 'bus parked wrong', 'auto parking problem'], scenario_id: 'traffic_parking', confidence: 75, reason: 'Commercial vehicle parking' },
  { keywords: ['middle of road parking', 'half road blocked', 'lane blocked by parking'], scenario_id: 'traffic_parking', confidence: 85, reason: 'Road blocking parking' },

  // ============================================
  // STREETLIGHTS (30 examples)
  // ============================================
  { keywords: ['streetlight not working', 'street light not working', 'no street light'], scenario_id: 'civic_streetlight', confidence: 95, reason: 'Streetlight not working' },
  { keywords: ['dark road', 'road is dark', 'no lights on road', 'pitch dark road'], scenario_id: 'civic_streetlight', confidence: 90, reason: 'Dark road' },
  { keywords: ['light flickering', 'street light flickering', 'light blinking'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Flickering light' },
  { keywords: ['light pole broken', 'street light pole', 'fallen light pole'], scenario_id: 'civic_streetlight', confidence: 90, reason: 'Broken light pole' },
  { keywords: ['light gone', 'light off', 'light not switched on', 'light never comes'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Light not switching on' },
  { keywords: ['need street light', 'no light in my area', 'light required here'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Need street light' },
  { keywords: ['light too dim', 'light not bright enough', 'barely visible light'], scenario_id: 'civic_streetlight', confidence: 80, reason: 'Dim street light' },
  { keywords: ['light pole lean', 'tilting light pole', 'dangerous pole'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Dangerous light pole' },
  { keywords: ['LED light not working', 'new light not working', 'BBMP light issue'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'BBMP light issue' },
  { keywords: ['electric wire hanging', 'wire near light', 'exposed wire street light'], scenario_id: 'civic_streetlight', confidence: 90, reason: 'Dangerous wiring' },
  { keywords: ['dark lane', 'dark alley', 'unsafe dark area', 'no lighting area'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Dark unsafe area' },
  { keywords: ['light always off', 'light never works', 'permanently off light'], scenario_id: 'civic_streetlight', confidence: 85, reason: 'Persistent light issue' },

  // ============================================
  // FOOTPATH (30 examples)
  // ============================================
  { keywords: ['footpath broken', 'sidewalk broken', 'footpath damaged'], scenario_id: 'civic_footpath', confidence: 95, reason: 'Broken footpath' },
  { keywords: ['footpath blocked', 'sidewalk blocked', 'cant walk on footpath'], scenario_id: 'civic_footpath', confidence: 90, reason: 'Blocked footpath' },
  { keywords: ['encroachment', 'shop encroachment', 'footpath encroachment', 'illegal construction on footpath'], scenario_id: 'civic_footpath', confidence: 90, reason: 'Footpath encroachment' },
  { keywords: ['footpath missing', 'no footpath', 'road without footpath'], scenario_id: 'civic_footpath', confidence: 85, reason: 'Missing footpath' },
  { keywords: ['footpath uneven', 'uneven footpath', 'footpath has holes'], scenario_id: 'civic_footpath', confidence: 85, reason: 'Uneven footpath' },
  { keywords: ['footpath occupied', 'footpath has vehicles', 'parked on footpath'], scenario_id: 'civic_footpath', confidence: 90, reason: 'Footpath occupied' },
  { keywords: ['footpath has vendor', 'hawkers on footpath', 'street vendor footpath'], scenario_id: 'civic_footpath', confidence: 80, reason: 'Vendor blocking footpath' },
  { keywords: ['footpath has stairs', 'footpath elevation', 'footpath level difference'], scenario_id: 'civic_footpath', confidence: 75, reason: 'Footpath elevation issue' },
  { keywords: ['pedestrian has to walk on road', 'no space to walk', 'walking on road'], scenario_id: 'civic_footpath', confidence: 85, reason: 'No pedestrian space' },
  { keywords: ['footpath tile missing', 'footpath slab missing', 'open footpath'], scenario_id: 'civic_footpath', confidence: 85, reason: 'Missing footpath tiles' },
  { keywords: ['footpath waterlogged', 'footpath flooded', 'water on footpath'], scenario_id: 'civic_footpath', confidence: 80, reason: 'Waterlogged footpath' },
  { keywords: ['footpath tree root', 'tree damaging footpath', 'footpath lifted by tree'], scenario_id: 'civic_footpath', confidence: 80, reason: 'Tree damage to footpath' },

  // ============================================
  // DRAINAGE / WATER LOGGING (35 examples)
  // ============================================
  { keywords: ['drainage blocked', 'drain blocked', 'sewage blocked', 'clogged drain'], scenario_id: 'civic_drainage', confidence: 95, reason: 'Blocked drainage' },
  { keywords: ['water logging', 'waterlogging', 'water standing', 'stagnant water'], scenario_id: 'civic_drainage', confidence: 90, reason: 'Water logging' },
  { keywords: ['flooding', 'flooded area', 'area flooded', 'water everywhere'], scenario_id: 'civic_drainage', confidence: 90, reason: 'Flooding' },
  { keywords: ['sewage overflow', 'drain overflow', 'dirty water overflowing'], scenario_id: 'civic_drainage', confidence: 95, reason: 'Sewage overflow' },
  { keywords: ['drain smell', 'sewage smell', 'stinking drain', 'dirty water smell'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Drain smell' },
  { keywords: ['open drain', 'uncovered drain', 'drain without cover', 'dangerous drain'], scenario_id: 'civic_drainage', confidence: 90, reason: 'Open drain danger' },
  { keywords: ['rain water logging', 'rain flooding', 'monsoon water', 'water not draining'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Rain water logging' },
  { keywords: ['drain water entering house', 'water coming inside', 'drainage in house'], scenario_id: 'civic_drainage', confidence: 90, reason: 'Drainage entering house' },
  { keywords: ['road water logged', 'water on road after rain', 'road flooded'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Road flooding' },
  { keywords: ['drain damage', 'broken drain', 'drain wall collapsed'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Drain damage' },
  { keywords: ['sewage line broken', 'sewage pipe burst', 'sewage leakage'], scenario_id: 'civic_drainage', confidence: 90, reason: 'Sewage line damage' },
  { keywords: ['drain insects', 'mosquitoes from drain', 'drain breeding mosquitoes'], scenario_id: 'civic_drainage', confidence: 80, reason: 'Mosquito breeding' },
  { keywords: ['dirty water on road', 'black water', 'sewage water on road'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Dirty water on road' },
  { keywords: ['drain cleaning needed', 'drain not cleaned', 'sludge in drain'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Drain needs cleaning' },
  { keywords: ['storm water drain', 'rain water drain', 'nala blocked'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Storm water drain issue' },

  // ============================================
  // PARKS & GARDENS (25 examples)
  // ============================================
  { keywords: ['park maintenance', 'park not maintained', 'park dirty', 'park garbage'], scenario_id: 'civic_parks', confidence: 90, reason: 'Park maintenance issue' },
  { keywords: ['park broken equipment', 'park bench broken', 'play equipment broken'], scenario_id: 'civic_parks', confidence: 85, reason: 'Broken park equipment' },
  { keywords: ['park no lights', 'park dark', 'park unsafe at night'], scenario_id: 'civic_parks', confidence: 85, reason: 'Park lighting issue' },
  { keywords: ['park water supply', 'park sprinkler not working', 'grass dying park'], scenario_id: 'civic_parks', confidence: 80, reason: 'Park water issue' },
  { keywords: ['park toilet dirty', 'park restroom', 'public toilet park'], scenario_id: 'civic_parks', confidence: 85, reason: 'Park toilet issue' },
  { keywords: ['park fence broken', 'park boundary wall', 'park entry broken'], scenario_id: 'civic_parks', confidence: 80, reason: 'Park boundary issue' },
  { keywords: ['park trees cut', 'park trees removed', 'greenery destroyed park'], scenario_id: 'civic_parks', confidence: 80, reason: 'Park tree issue' },
  { keywords: ['park encroachment', 'park land grabbed', 'park shrinking'], scenario_id: 'civic_parks', confidence: 85, reason: 'Park encroachment' },
  { keywords: ['park bench missing', 'no seating park', 'park needs benches'], scenario_id: 'civic_parks', confidence: 75, reason: 'Park seating issue' },
  { keywords: ['park walkway broken', 'park path damaged', 'park track issue'], scenario_id: 'civic_parks', confidence: 80, reason: 'Park walkway issue' },
  { keywords: ['park needs cleaning', 'park full of weeds', 'park overgrown'], scenario_id: 'civic_parks', confidence: 80, reason: 'Park cleaning needed' },
  { keywords: ['garden maintenance', 'garden not kept', 'garden dirty'], scenario_id: 'civic_parks', confidence: 85, reason: 'Garden maintenance' },

  // ============================================
  // WATER SUPPLY (30 examples)
  // ============================================
  { keywords: ['no water', 'water not coming', 'water supply stopped', 'no water supply'], scenario_id: 'civic_water_supply', confidence: 95, reason: 'No water supply' },
  { keywords: ['low water pressure', 'water pressure low', 'trickle of water'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'Low water pressure' },
  { keywords: ['water tank empty', 'tank not filling', 'overhead tank empty'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'Tank empty' },
  { keywords: ['water pipe burst', 'water pipe leak', 'water leaking'], scenario_id: 'civic_water_supply', confidence: 90, reason: 'Water pipe issue' },
  { keywords: ['dirty water', 'muddy water', 'water color changed', 'water not clean'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'Dirty water supply' },
  { keywords: ['water tanker needed', 'need water tanker', 'no pipeline water'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'Need water tanker' },
  { keywords: ['BWSSB issue', 'BWSSB not responding', 'water board problem'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'BWSSB issue' },
  { keywords: ['water bill wrong', 'water bill high', 'excess water bill'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Water bill issue' },
  { keywords: ['water meter issue', 'water meter not working', 'meter tampering'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Water meter issue' },
  { keywords: ['new water connection', 'water connection requested', 'need water connection'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'New connection needed' },
  { keywords: ['water logged area', 'water standing near house', 'water not draining near house'], scenario_id: 'civic_water_supply', confidence: 75, reason: 'Water logging near house' },
  { keywords: ['water quality bad', 'water smell', 'water taste bad', 'water has chemicals'], scenario_id: 'civic_water_supply', confidence: 85, reason: 'Water quality issue' },
  { keywords: ['water pipe old', 'water pipe rusted', 'old pipeline'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Old pipeline issue' },

  // ============================================
  // STRAY ANIMALS (30 examples)
  // ============================================
  { keywords: ['stray dog', 'stray dogs', 'aggressive dog', 'dog chasing'], scenario_id: 'civic_stray_animals', confidence: 95, reason: 'Stray dog issue' },
  { keywords: ['dog bite', 'dog bit me', 'dog attacked', 'dog biting people'], scenario_id: 'civic_stray_animals', confidence: 95, reason: 'Dog bite/attack' },
  { keywords: ['stray cattle', 'cow on road', 'cattle on road', 'bull on road'], scenario_id: 'civic_stray_animals', confidence: 90, reason: 'Stray cattle' },
  { keywords: ['monkey menace', 'monkeys attacking', 'monkeys stealing', 'monkey problem'], scenario_id: 'civic_stray_animals', confidence: 90, reason: 'Monkey menace' },
  { keywords: ['pig menace', 'pigs on road', 'pig roaming', 'pig garbage'], scenario_id: 'civic_stray_animals', confidence: 85, reason: 'Pig menace' },
  { keywords: ['cat problem', 'stray cats', 'cats near house', 'cat litter'], scenario_id: 'civic_stray_animals', confidence: 75, reason: 'Stray cat issue' },
  { keywords: ['animal welfare', 'animal care', 'feed strays', 'help stray animals'], scenario_id: 'civic_stray_animals', confidence: 70, reason: 'Animal welfare' },
  { keywords: ['dog litter', 'dog poop', 'dog waste on road', 'dog mess'], scenario_id: 'civic_stray_animals', confidence: 80, reason: 'Dog waste' },
  { keywords: ['dog herd', 'pack of dogs', 'many dogs together', 'dog gang'], scenario_id: 'civic_stray_animals', confidence: 85, reason: 'Dog pack' },
  { keywords: ['puppy rescue', 'injured animal', 'animal needs help', 'animal injured'], scenario_id: 'civic_stray_animals', confidence: 80, reason: 'Injured animal' },
  { keywords: ['snake on road', 'snake near house', 'snake spotted', 'snake danger'], scenario_id: 'civic_stray_animals', confidence: 85, reason: 'Snake sighting' },
  { keywords: ['neuter dog', 'sterilization', 'ABC program', 'dog population control'], scenario_id: 'civic_stray_animals', confidence: 75, reason: 'Dog population control' },

  // ============================================
  // POLICE / TRAFFIC INTERACTION (35 examples)
  // ============================================
  { keywords: ['police asking money', 'cop asking money', 'bribe to police', 'police bribe'], scenario_id: 'traffic_interaction', confidence: 95, reason: 'Police bribe' },
  { keywords: ['challan wrong', 'wrong challan', 'fake challan', 'challan scam'], scenario_id: 'traffic_interaction', confidence: 90, reason: 'Wrong challan' },
  { keywords: ['police rude', 'cop behavior', 'police misbehaving', 'rude policeman'], scenario_id: 'traffic_interaction', confidence: 85, reason: 'Police behavior' },
  { keywords: ['police not helping', 'police not responding', 'no help from police'], scenario_id: 'traffic_interaction', confidence: 85, reason: 'Police not helping' },
  { keywords: ['traffic police harassment', 'cop harassment', 'police harassment'], scenario_id: 'traffic_interaction', confidence: 90, reason: 'Police harassment' },
  { keywords: ['without helmet fine', 'helmet fine', 'fine for not wearing helmet'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'Helmet fine' },
  { keywords: ['without license fine', 'license fine', 'fine for no license'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'License fine' },
  { keywords: ['police check', 'police checking', 'vehicle checking', 'document check'], scenario_id: 'traffic_interaction', confidence: 75, reason: 'Police checking' },
  { keywords: ['FIR not filed', 'police refused FIR', 'FIR complaint rejected'], scenario_id: 'traffic_interaction', confidence: 90, reason: 'FIR issue' },
  { keywords: ['police late response', 'police came late', 'slow police response'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'Slow police response' },
  { keywords: ['e-challan issue', 'e challan wrong', 'online challan problem'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'E-challan issue' },
  { keywords: ['vehicle seized', 'police seized vehicle', 'vehicle confiscated'], scenario_id: 'traffic_interaction', confidence: 85, reason: 'Vehicle seized' },
  { keywords: ['police parking fine', 'parking fine wrong', 'illegal parking fine'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'Parking fine issue' },
  { keywords: ['drunk driving fine', 'DUI fine', 'breath test failed'], scenario_id: 'traffic_interaction', confidence: 85, reason: 'DUI fine' },
  { keywords: ['speeding fine', 'over speed fine', 'speed camera fine'], scenario_id: 'traffic_interaction', confidence: 80, reason: 'Speeding fine' },

  // ============================================
  // BRIBES (40 examples)
  // ============================================
  { keywords: ['bribe', 'asking bribe', 'demanding bribe', 'bribe demanded'], scenario_id: 'bribes', confidence: 95, reason: 'Bribe demanded' },
  { keywords: ['government bribe', 'govt bribe', 'official bribe'], scenario_id: 'bribes', confidence: 95, reason: 'Government bribe' },
  { keywords: ['RTO bribe', 'RTO asking money', 'RTO money demand'], scenario_id: 'bribes', confidence: 90, reason: 'RTO bribe' },
  { keywords: ['BBMP bribe', 'BBMP asking money', 'BBMP money demand'], scenario_id: 'bribes', confidence: 90, reason: 'BBMP bribe' },
  { keywords: ['licensing bribe', 'license money', 'license ke paise'], scenario_id: 'bribes', confidence: 85, reason: 'License bribe' },
  { keywords: ['registration bribe', 'registration money', 'register ke paise'], scenario_id: 'bribes', confidence: 85, reason: 'Registration bribe' },
  { keywords: ['khata bribe', 'khata money', 'property registration bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Khata bribe' },
  { keywords: ['passport bribe', 'passport money', 'passport office bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Passport bribe' },
  { keywords: ['income certificate bribe', 'caste certificate bribe', 'certificate bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Certificate bribe' },
  { keywords: ['police verification bribe', 'verification money', 'character certificate bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Verification bribe' },
  { keywords: ['hospital bribe', 'doctor bribe', 'medical bribe', 'hospital money demand'], scenario_id: 'bribes', confidence: 85, reason: 'Hospital bribe' },
  { keywords: ['school admission bribe', 'college admission bribe', 'management quota bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Education bribe' },
  { keywords: ['water connection bribe', 'electricity connection bribe', 'utility bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Utility bribe' },
  { keywords: ['building plan bribe', 'approval bribe', 'permit bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Approval bribe' },
  { keywords: ['government office bribe', 'office mein paisa', 'sar kar ke paisa'], scenario_id: 'bribes', confidence: 90, reason: 'Office bribe' },
  { keywords: ['corruption', 'corrupt officer', 'corrupt official'], scenario_id: 'bribes', confidence: 90, reason: 'Corruption' },
  { keywords: ['under the table', 'cut money', 'commission demand', 'hafta'], scenario_id: 'bribes', confidence: 90, reason: 'Under-the-table payment' },
  { keywords: ['money demanded for work', 'work ke paise', 'paise do kaam karo'], scenario_id: 'bribes', confidence: 85, reason: 'Work for money demand' },
  { keywords: ['without bribe no work', 'kaam nahi hoga bina paise', ' file nahi move hogi'], scenario_id: 'bribes', confidence: 90, reason: 'Bribe required for work' },
  { keywords: ['IAS officer bribe', 'government servant bribe', 'sarkari naukri bribe'], scenario_id: 'bribes', confidence: 85, reason: 'Government officer bribe' },

  // ============================================
  // SAFETY / HARASSMENT (35 examples)
  // ============================================
  { keywords: ['harassment', 'harassed', 'eve teasing', 'teased'], scenario_id: 'safety_harassment', confidence: 95, reason: 'Harassment' },
  { keywords: ['stalking', 'followed me', 'someone following', 'being followed'], scenario_id: 'safety_harassment', confidence: 90, reason: 'Stalking' },
  { keywords: ['unsafe area', 'area not safe', 'unsafe at night', 'dangerous area'], scenario_id: 'safety_harassment', confidence: 85, reason: 'Unsafe area' },
  { keywords: ['women safety', 'ladies safety', 'girls safety', 'female safety'], scenario_id: 'safety_harassment', confidence: 90, reason: 'Women safety concern' },
  { keywords: ['molestation', 'touched inappropriately', 'groped', 'assaulted'], scenario_id: 'safety_harassment', confidence: 95, reason: 'Molestation/assault' },
  { keywords: ['road safety', 'unsafe road', 'road not safe', 'criminal activity'], scenario_id: 'safety_harassment', confidence: 80, reason: 'Road safety' },
  { keywords: ['threatening', 'threatened', 'life threat', 'death threat'], scenario_id: 'safety_harassment', confidence: 90, reason: 'Threat' },
  { keywords: ['rowdy', 'goonda', 'gang', 'gang activity', 'local goons'], scenario_id: 'safety_harassment', confidence: 85, reason: 'Gang/goonda activity' },
  { keywords: ['kidnapping attempt', 'child safety', 'child in danger', 'kidnapping'], scenario_id: 'safety_harassment', confidence: 95, reason: 'Child safety' },
  { keywords: ['sexual harassment', 'verbal abuse', 'sexual comments', 'catcalling'], scenario_id: 'safety_harassment', confidence: 90, reason: 'Sexual harassment' },
  { keywords: ['domestic violence', 'housewife beaten', 'husband beating', 'family violence'], scenario_id: 'safety_harassment', confidence: 90, reason: 'Domestic violence' },
  { keywords: ['chain snatching', 'bag snatching', 'robbery', 'theft'], scenario_id: 'safety_harassment', confidence: 85, reason: 'Robbery/snatching' },
  { keywords: ['bike phone snatching', 'mobile snatching', 'phone stolen'], scenario_id: 'safety_harassment', confidence: 85, reason: 'Phone snatching' },
  { keywords: ['drugs selling', 'drug peddler', 'drug near school', 'drugs area'], scenario_id: 'safety_harassment', confidence: 85, reason: 'Drug activity' },
  { keywords: ['gambling', 'gambling den', 'betting', 'illegal gambling'], scenario_id: 'safety_harassment', confidence: 80, reason: 'Illegal gambling' },
  { keywords: ['alcohol selling', 'illegal liquor', 'bootlegging', 'illegal wine shop'], scenario_id: 'safety_harassment', confidence: 80, reason: 'Illegal alcohol' },

  // ============================================
  // CYBERCRIME (35 examples)
  // ============================================
  { keywords: ['online fraud', 'internet fraud', 'website scam', 'online scam'], scenario_id: 'cybercrime', confidence: 95, reason: 'Online fraud' },
  { keywords: ['phishing', 'phishing email', 'phishing link', 'fake website'], scenario_id: 'cybercrime', confidence: 95, reason: 'Phishing' },
  { keywords: ['OTP fraud', 'OTP scam', 'shared OTP', 'OTP stolen'], scenario_id: 'cybercrime', confidence: 95, reason: 'OTP fraud' },
  { keywords: ['UPI fraud', 'UPI scam', 'Google Pay fraud', 'Paytm fraud'], scenario_id: 'cybercrime', confidence: 95, reason: 'UPI fraud' },
  { keywords: ['credit card fraud', 'debit card fraud', 'card cloned', 'card stolen'], scenario_id: 'cybercrime', confidence: 90, reason: 'Card fraud' },
  { keywords: ['bank fraud', 'bank account hacked', 'money stolen from bank'], scenario_id: 'cybercrime', confidence: 90, reason: 'Bank fraud' },
  { keywords: ['Instagram scam', 'Facebook scam', 'social media fraud'], scenario_id: 'cybercrime', confidence: 85, reason: 'Social media scam' },
  { keywords: ['WhatsApp fraud', 'WhatsApp scam', 'fake message'], scenario_id: 'cybercrime', confidence: 85, reason: 'WhatsApp scam' },
  { keywords: ['online shopping fraud', 'fake product', 'product not delivered', 'E-commerce scam'], scenario_id: 'cybercrime', confidence: 85, reason: 'Shopping scam' },
  { keywords: ['hacking', 'account hacked', 'email hacked', 'password hacked'], scenario_id: 'cybercrime', confidence: 90, reason: 'Hacking' },
  { keywords: ['identity theft', 'identity stolen', 'fake identity'], scenario_id: 'cybercrime', confidence: 90, reason: 'Identity theft' },
  { keywords: ['job scam', 'fake job offer', 'work from home scam', 'job fraud'], scenario_id: 'cybercrime', confidence: 85, reason: 'Job scam' },
  { keywords: ['lottery scam', 'you won lottery', 'prize scam', 'million dollar scam'], scenario_id: 'cybercrime', confidence: 85, reason: 'Lottery scam' },
  { keywords: ['investment scam', 'crypto scam', 'stock market scam', 'Ponzi scheme'], scenario_id: 'cybercrime', confidence: 85, reason: 'Investment scam' },
  { keywords: ['matrimonial scam', 'dating scam', 'romance scam', 'love scam'], scenario_id: 'cybercrime', confidence: 85, reason: 'Romance scam' },
  { keywords: ['fake call', 'vishing', 'voice phishing', 'call from bank fake'], scenario_id: 'cybercrime', confidence: 85, reason: 'Vishing' },
  { keywords: ['cyber bullying', 'online bullying', 'trolling', 'online abuse'], scenario_id: 'cybercrime', confidence: 80, reason: 'Cyber bullying' },
  { keywords: ['data leak', 'data breach', 'personal data stolen', 'privacy violation'], scenario_id: 'cybercrime', confidence: 85, reason: 'Data breach' },

  // ============================================
  // TENANT / LANDLORD (30 examples)
  // ============================================
  { keywords: ['landlord not returning deposit', 'deposit not returned', 'security deposit issue'], scenario_id: 'housing_tenant', confidence: 95, reason: 'Deposit not returned' },
  { keywords: ['landlord harassment', 'house owner troubling', 'owner not good'], scenario_id: 'housing_tenant', confidence: 90, reason: 'Landlord harassment' },
  { keywords: ['rent dispute', 'rent increase', 'rent too high', 'rent problem'], scenario_id: 'housing_tenant', confidence: 85, reason: 'Rent dispute' },
  { keywords: ['tenant not paying', 'tenant not vacating', 'tenant trouble'], scenario_id: 'housing_tenant', confidence: 85, reason: 'Tenant issue' },
  { keywords: ['house owner not fixing', 'maintenance not done', 'owner not responding'], scenario_id: 'housing_tenant', confidence: 85, reason: 'Maintenance issue' },
  { keywords: ['agreement issue', 'rental agreement', 'lease agreement problem'], scenario_id: 'housing_tenant', confidence: 80, reason: 'Agreement issue' },
  { keywords: ['house owner giving notice', 'vacate notice', 'asked to leave'], scenario_id: 'housing_tenant', confidence: 80, reason: 'Vacate notice' },
  { keywords: ['water supply landlord', 'electricity landlord', 'utility issue tenant'], scenario_id: 'housing_tenant', confidence: 75, reason: 'Utility issue' },
  { keywords: ['house owner entered without permission', 'owner came without notice', 'privacy violation landlord'], scenario_id: 'housing_tenant', confidence: 85, reason: 'Privacy violation' },
  { keywords: ['broker issue', 'house broker fraud', 'agent not returning money'], scenario_id: 'housing_tenant', confidence: 80, reason: 'Broker issue' },
  { keywords: ['house condition bad', 'house needs repair', 'owner not repairing'], scenario_id: 'housing_tenant', confidence: 80, reason: 'House condition' },
  { keywords: ['pg problem', 'hostel problem', 'paying guest issue'], scenario_id: 'housing_tenant', confidence: 80, reason: 'PG/hostel issue' },

  // ============================================
  // NOISE POLLUTION (30 examples)
  // ============================================
  { keywords: ['noise pollution', 'too much noise', 'loud noise', 'noisy area'], scenario_id: 'env_noise', confidence: 95, reason: 'Noise pollution' },
  { keywords: ['loud music', 'DJ playing', 'music system loud', 'party noise'], scenario_id: 'env_noise', confidence: 90, reason: 'Loud music' },
  { keywords: ['construction noise', 'drilling sound', 'hammering noise', 'building work noise'], scenario_id: 'env_noise', confidence: 85, reason: 'Construction noise' },
  { keywords: ['factory noise', 'industrial noise', 'machine noise', 'plant noise'], scenario_id: 'env_noise', confidence: 85, reason: 'Factory noise' },
  { keywords: ['horn honking', 'excessive honking', 'honking near hospital', 'honking near school'], scenario_id: 'env_noise', confidence: 80, reason: 'Honking noise' },
  { keywords: ['loudspeaker', 'loud speaker noise', 'announcement loud', 'loudspeaker playing'], scenario_id: 'env_noise', confidence: 85, reason: 'Loudspeaker' },
  { keywords: ['temple noise', 'mosque noise', 'church noise', 'religious noise'], scenario_id: 'env_noise', confidence: 75, reason: 'Religious noise' },
  { keywords: ['wedding noise', 'function noise', 'event noise', 'celebration noise'], scenario_id: 'env_noise', confidence: 75, reason: 'Event noise' },
  { keywords: ['dog barking night', 'dog barking continuously', 'loud barking'], scenario_id: 'env_noise', confidence: 80, reason: 'Dog barking' },
  { keywords: ['generator noise', 'genset noise', 'power backup noise'], scenario_id: 'env_noise', confidence: 80, reason: 'Generator noise' },
  { keywords: ['cracker noise', 'fireworks noise', 'diwali noise', 'bursting crackers'], scenario_id: 'env_noise', confidence: 75, reason: 'Fireworks noise' },
  { keywords: ['car alarm', 'vehicle alarm', 'alarm ringing continuously'], scenario_id: 'env_noise', confidence: 80, reason: 'Alarm noise' },
  { keywords: ['night noise', 'sleep disturbed', 'cant sleep', 'noise at night'], scenario_id: 'env_noise', confidence: 85, reason: 'Night noise disturbance' },

  // ============================================
  // POWER OUTAGE (30 examples)
  // ============================================
  { keywords: ['power cut', 'power outage', 'no electricity', 'electricity gone'], scenario_id: 'util_power', confidence: 95, reason: 'Power outage' },
  { keywords: ['light gone', 'current gone', 'current not there', 'bijli nahi hai'], scenario_id: 'util_power', confidence: 95, reason: 'No electricity' },
  { keywords: ['transformer issue', 'transformer blown', 'transformer failed'], scenario_id: 'util_power', confidence: 90, reason: 'Transformer issue' },
  { keywords: ['frequent power cut', 'power keeps going', 'power fluctuation'], scenario_id: 'util_power', confidence: 90, reason: 'Frequent power cuts' },
  { keywords: ['power cut whole day', 'no power for hours', 'extended outage'], scenario_id: 'util_power', confidence: 90, reason: 'Extended power cut' },
  { keywords: ['electric pole fallen', 'pole broken', 'pole on road', 'pole damaged'], scenario_id: 'util_power', confidence: 90, reason: 'Fallen pole' },
  { keywords: ['wire hanging', 'electric wire loose', 'wire touching ground', 'dangerous wire'], scenario_id: 'util_power', confidence: 95, reason: 'Dangerous wire' },
  { keywords: ['BESCOM issue', 'BESCOM not responding', 'electricity board problem'], scenario_id: 'util_power', confidence: 85, reason: 'BESCOM issue' },
  { keywords: ['meter issue', 'electric meter problem', 'meter not working', 'meter running fast'], scenario_id: 'util_power', confidence: 80, reason: 'Meter issue' },
  { keywords: ['voltage fluctuation', 'voltage low', 'voltage high', 'appliances damaged'], scenario_id: 'util_power', confidence: 85, reason: 'Voltage issue' },
  { keywords: ['new connection pending', 'electricity connection pending', 'new house no power'], scenario_id: 'util_power', confidence: 80, reason: 'New connection' },
  { keywords: ['power bill wrong', 'electricity bill high', 'excess bill'], scenario_id: 'util_power', confidence: 80, reason: 'Bill issue' },
  { keywords: ['tree on wire', 'tree touching wire', 'branch on power line'], scenario_id: 'util_power', confidence: 85, reason: 'Tree on wire' },
  { keywords: ['power cut hospital', 'power cut school', 'power cut office'], scenario_id: 'util_power', confidence: 85, reason: 'Critical area power cut' },
  { keywords: ['load shedding', 'scheduled power cut', 'power cut timing'], scenario_id: 'util_power', confidence: 80, reason: 'Load shedding' },

  // ============================================
  // LANGUAGE BARRIER (25 examples)
  // ============================================
  { keywords: ['language barrier', 'no english', 'no hindi', 'no kannada'], scenario_id: 'access_language', confidence: 90, reason: 'Language barrier' },
  { keywords: ['cant understand language', 'language problem', 'communication problem'], scenario_id: 'access_language', confidence: 85, reason: 'Communication issue' },
  { keywords: ['no kannada signboard', 'signboard only english', 'no local language'], scenario_id: 'access_language', confidence: 85, reason: 'No local language signage' },
  { keywords: ['auto driver not knowing', 'bus conductor language', 'shopkeeper language'], scenario_id: 'access_language', confidence: 75, reason: 'Language issue with service' },
  { keywords: ['government office language', 'officer not knowing language', 'form in english only'], scenario_id: 'access_language', confidence: 80, reason: 'Office language issue' },
  { keywords: ['bank language issue', 'hospital language issue', 'school language issue'], scenario_id: 'access_language', confidence: 75, reason: 'Institution language issue' },
  { keywords: ['baby needs attention', 'infant crying', 'baby alone', 'child neglected'], scenario_id: 'access_language', confidence: 70, reason: 'Child issue' },
  { keywords: ['raste mein kya hai', 'road mein kya problem hai', 'kya ho raha hai'], scenario_id: 'access_language', confidence: 65, reason: 'Language query' },

  // ============================================
  // GOVERNMENT SERVICE (40 examples)
  // ============================================
  { keywords: ['government service delay', 'file stuck', 'application pending'], scenario_id: 'govt_service', confidence: 90, reason: 'Service delay' },
  { keywords: ['aadhaar issue', 'aadhaar update', 'aadhaar problem'], scenario_id: 'govt_service', confidence: 85, reason: 'Aadhaar issue' },
  { keywords: ['pan card issue', 'PAN card pending', 'PAN card problem'], scenario_id: 'govt_service', confidence: 85, reason: 'PAN card issue' },
  { keywords: ['passport issue', 'passport pending', 'passport office'], scenario_id: 'govt_service', confidence: 85, reason: 'Passport issue' },
  { keywords: ['voter id issue', 'voter card', 'election card'], scenario_id: 'govt_service', confidence: 85, reason: 'Voter ID issue' },
  { keywords: ['birth certificate', 'death certificate', 'marriage certificate'], scenario_id: 'govt_service', confidence: 85, reason: 'Certificate issue' },
  { keywords: ['income certificate', 'caste certificate', 'community certificate'], scenario_id: 'govt_service', confidence: 85, reason: 'Certificate issue' },
  { keywords: ['ration card', 'ration card issue', 'new ration card'], scenario_id: 'govt_service', confidence: 80, reason: 'Ration card issue' },
  { keywords: ['karnataka one', 'bangalore one', 'itizen service'], scenario_id: 'govt_service', confidence: 80, reason: 'Karnataka One issue' },
  { keywords: ['sakala', 'sakala grievance', 'sakala application'], scenario_id: 'govt_service', confidence: 80, reason: 'Sakala issue' },
  { keywords: ['BBMP service', 'BBMP application', 'BBMP not responding'], scenario_id: 'govt_service', confidence: 85, reason: 'BBMP service' },
  { keywords: ['property registration', 'registration office', 'sub registrar'], scenario_id: 'govt_service', confidence: 85, reason: 'Registration office' },
  { keywords: ['land records', ' RTC', 'khata extract', 'land survey'], scenario_id: 'govt_service', confidence: 80, reason: 'Land records issue' },
  { keywords: ['vehicle registration', 'RC transfer', 'vehicle ownership'], scenario_id: 'govt_service', confidence: 85, reason: 'Vehicle registration' },
  { keywords: ['driving license', 'license renewal', 'license issue'], scenario_id: 'govt_service', confidence: 85, reason: 'License issue' },
  { keywords: ['trade license', 'business license', 'shop license'], scenario_id: 'govt_service', confidence: 80, reason: 'Trade license' },
  { keywords: ['building approval', 'plan sanction', 'construction approval'], scenario_id: 'govt_service', confidence: 80, reason: 'Building approval' },
  { keywords: ['OSAP pension', 'social security pension', 'widow pension'], scenario_id: 'govt_service', confidence: 80, reason: 'Pension issue' },
  { keywords: ['scholarship', 'student scholarship', 'education scholarship'], scenario_id: 'govt_service', confidence: 80, reason: 'Scholarship issue' },
  { keywords: ['borewell permission', 'borewell application', 'ground water permission'], scenario_id: 'govt_service', confidence: 75, reason: 'Borewell permission' },
  { keywords: ['conversion application', 'land conversion', 'agricultural to non-agricultural'], scenario_id: 'govt_service', confidence: 75, reason: 'Land conversion' },
  { keywords: ['encumbrance certificate', 'EC', 'property EC'], scenario_id: 'govt_service', confidence: 80, reason: 'Encumbrance certificate' },
  { keywords: ['mutation application', '11E extract', 'khatani'], scenario_id: 'govt_service', confidence: 80, reason: 'Land mutation' },
  { keywords: ['NOC application', 'NOC pending', 'no objection certificate'], scenario_id: 'govt_service', confidence: 75, reason: 'NOC issue' },
  { keywords: ['grievance', 'complaint not resolved', 'filed complaint no action'], scenario_id: 'govt_service', confidence: 85, reason: 'Grievance unresolved' },
  { keywords: ['RTI application', 'right to information', 'information not given'], scenario_id: 'govt_service', confidence: 80, reason: 'RTI issue' },
  { keywords: ['tender issue', 'government tender', 'tender process'], scenario_id: 'govt_service', confidence: 70, reason: 'Tender issue' },
  { keywords: ['government website down', 'portal not working', 'site crashed'], scenario_id: 'govt_service', confidence: 80, reason: 'Portal down' },
  { keywords: ['application rejected', 'file rejected', 'papers rejected'], scenario_id: 'govt_service', confidence: 80, reason: 'Application rejected' },
  { keywords: ['officer not available', 'officer on leave', 'no one in office'], scenario_id: 'govt_service', confidence: 80, reason: 'Officer unavailable' },
  { keywords: ['long queue', 'waiting for hours', 'token system issue'], scenario_id: 'govt_service', confidence: 75, reason: 'Queue/waiting issue' },
  { keywords: ['wrong information given', 'misguided by officer', 'wrong guidance'], scenario_id: 'govt_service', confidence: 80, reason: 'Wrong guidance' },
  { keywords: ['online portal issue', 'website not loading', 'portal error'], scenario_id: 'govt_service', confidence: 80, reason: 'Portal issue' },
  { keywords: ['document upload failed', 'upload error', 'file size issue'], scenario_id: 'govt_service', confidence: 75, reason: 'Upload issue' },
  { keywords: ['payment failed', 'online payment issue', 'fee payment problem'], scenario_id: 'govt_service', confidence: 75, reason: 'Payment issue' },

  // ============================================
  // ADDITIONAL EDGE CASES (50 examples)
  // ============================================
  { keywords: ['help me', 'what should i do', 'where to complain', 'how to file'], scenario_id: 'govt_service', confidence: 60, reason: 'General help needed' },
  { keywords: ['problem near my house', 'issue near my home', 'problem in my area'], scenario_id: 'govt_service', confidence: 55, reason: 'Area issue' },
  { keywords: ['something wrong', 'something bad happened', 'not right'], scenario_id: 'govt_service', confidence: 50, reason: 'Vague complaint' },
  { keywords: ['road near my house', 'street problem', 'lane problem'], scenario_id: 'traffic_pothole', confidence: 60, reason: 'Road issue near house' },
  { keywords: ['water leaking from pipe', 'pipe leaking water', 'water dripping'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Water pipe leak' },
  { keywords: ['wall cracked', 'house wall cracked', 'building wall crack'], scenario_id: 'traffic_pothole', confidence: 60, reason: 'Structural issue' },
  { keywords: ['tree fallen', 'tree on road', 'tree blocking road'], scenario_id: 'civic_parks', confidence: 75, reason: 'Fallen tree' },
  { keywords: ['manhole cover missing', 'manhole open', 'drain cover missing'], scenario_id: 'traffic_pothole', confidence: 85, reason: 'Open manhole' },
  { keywords: ['smell from drain', 'bad smell area', 'stinking area'], scenario_id: 'civic_drainage', confidence: 85, reason: 'Drain smell' },
  { keywords: ['electrocution', 'electric shock', 'got shocked', 'current lagaa'], scenario_id: 'util_power', confidence: 90, reason: 'Electric shock' },
  { keywords: ['road marking missing', 'zebra crossing missing', 'no road markings'], scenario_id: 'traffic_pothole', confidence: 70, reason: 'Missing road markings' },
  { keywords: ['traffic signal not working', 'signal off', 'signal malfunction'], scenario_id: 'traffic_accident', confidence: 80, reason: 'Signal issue' },
  { keywords: ['speed breaker missing', 'need speed breaker', 'vehicles speeding here'], scenario_id: 'traffic_pothole', confidence: 70, reason: 'Need speed breaker' },
  { keywords: ['bill dispute', 'bill wrong', 'overcharged', 'extra charged'], scenario_id: 'govt_service', confidence: 65, reason: 'Billing dispute' },
  { keywords: ['insurance claim', 'insurance issue', 'claim rejected'], scenario_id: 'govt_service', confidence: 60, reason: 'Insurance issue' },
  { keywords: ['bank loan issue', 'bank not giving loan', 'loan application stuck'], scenario_id: 'govt_service', confidence: 60, reason: 'Bank loan issue' },
  { keywords: ['harassment by officer', 'official misbehavior', 'officer demanding money'], scenario_id: 'bribes', confidence: 90, reason: 'Official harassment' },
  { keywords: ['service delayed', 'work not done', 'pending from long time'], scenario_id: 'govt_service', confidence: 80, reason: 'Service delay' },
  { keywords: ['need help urgently', 'emergency help', 'urgent issue'], scenario_id: 'safety_harassment', confidence: 70, reason: 'Urgent help needed' },
  { keywords: ['old age home', 'senior citizen issue', 'elderly problem'], scenario_id: 'safety_harassment', confidence: 65, reason: 'Senior citizen issue' },
  { keywords: ['disabled person issue', 'handicapped problem', 'accessibility issue'], scenario_id: 'access_language', confidence: 70, reason: 'Accessibility issue' },
  { keywords: ['food adulteration', 'food quality bad', 'expired food', 'bad food'], scenario_id: 'govt_service', confidence: 75, reason: 'Food safety issue' },
  { keywords: ['air pollution', 'smoke from factory', 'chimney smoke', 'pollution'], scenario_id: 'env_noise', confidence: 75, reason: 'Air pollution' },
  { keywords: ['water pollution', 'river polluted', 'lake polluted', 'water body polluted'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Water pollution' },
  { keywords: ['illegal construction', 'building without permission', 'unauthorized building'], scenario_id: 'govt_service', confidence: 80, reason: 'Illegal construction' },
  { keywords: ['encroachment on land', 'land grab', 'property encroachment'], scenario_id: 'govt_service', confidence: 85, reason: 'Land encroachment' },
  { keywords: ['hawkers problem', 'street vendors problem', 'hawker encroachment'], scenario_id: 'civic_footpath', confidence: 80, reason: 'Hawker issue' },
  { keywords: ['begging problem', 'child begging', 'forced begging'], scenario_id: 'safety_harassment', confidence: 70, reason: 'Begging issue' },
  { keywords: ['casualty', 'accident casualty', 'death in accident'], scenario_id: 'traffic_accident', confidence: 95, reason: 'Casualty' },
  { keywords: ['property damage', 'house damaged', 'building damaged'], scenario_id: 'traffic_accident', confidence: 70, reason: 'Property damage' },
  { keywords: ['farm issue', 'crop damage', 'agriculture problem'], scenario_id: 'govt_service', confidence: 65, reason: 'Agriculture issue' },
  { keywords: ['electricity theft', 'power theft', 'hook connection', 'illegal connection'], scenario_id: 'util_power', confidence: 85, reason: 'Electricity theft' },
  { keywords: ['water theft', 'water tanker illegal', 'illegal water extraction'], scenario_id: 'civic_water_supply', confidence: 80, reason: 'Water theft' },
  { keywords: ['illegal mining', 'sand mining', 'mining issue'], scenario_id: 'govt_service', confidence: 75, reason: 'Mining issue' },
  { keywords: ['environment damage', 'ecology damage', 'green cover loss'], scenario_id: 'civic_parks', confidence: 70, reason: 'Environmental damage' },
  { keywords: ['public toilet dirty', 'toilet not working', 'public restroom issue'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Public toilet issue' },
  { keywords: ['urination in public', 'public urination', 'open defecation'], scenario_id: 'civic_garbage', confidence: 80, reason: 'Public hygiene issue' },
  { keywords: ['alcohol drinking public', 'public drinking', 'drunk people trouble'], scenario_id: 'safety_harassment', confidence: 75, reason: 'Public drinking issue' },
  { keywords: ['mechanics on road', 'roadside mechanics', 'garbage from mechanics'], scenario_id: 'civic_garbage', confidence: 70, reason: 'Mechanic waste' },
  { keywords: ['paint on road', 'road painting issue', 'markings fading'], scenario_id: 'traffic_pothole', confidence: 65, reason: 'Road marking issue' },
  { keywords: ['footpath encroachment by shop', 'shop on footpath', 'vendor on footpath'], scenario_id: 'civic_footpath', confidence: 85, reason: 'Shop encroachment' },
];

// Function to match user input against trained scenarios
export function matchTrainedScenario(userInput: string): {
  scenario_id: string;
  confidence: number;
  reason: string;
} | null {
  const input = userInput.toLowerCase().trim();
  let bestMatch: { scenario_id: string; confidence: number; reason: string } | null = null;
  let highestScore = 0;

  for (const scenario of trainedScenarios) {
    let matchCount = 0;
    for (const keyword of scenario.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const score = (matchCount / scenario.keywords.length) * scenario.confidence;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          scenario_id: scenario.scenario_id,
          confidence: Math.min(Math.round(score), 99),
          reason: scenario.reason,
        };
      }
    }
  }

  return bestMatch;
}
