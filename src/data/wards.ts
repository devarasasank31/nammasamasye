// ============================================================
// OFFLINE BENGALURU GAZETTEER — ward + police station lookup
//
// Free by design: no API key, no network, no CSP change. A picked
// coordinate is matched against the nearest ward centroid below and
// the nearest police station in POLICE_STATIONS by haversine.
//
// Ward centroids are compiled for this demo from well-known
// locality centres; they are an approximation of the delimited
// BBMP ward polygons (which are published as GIS layers).
// ============================================================

export interface WardRecord {
  ward: number;
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface PoliceStation {
  name: string;
  lat: number;
  lng: number;
}

// Longest reasonable straight-line match before we declare the point
// "outside Bengaluru city" and return no ward instead of guessing.
export const MAX_WARD_DISTANCE_KM = 9;
export const MAX_POLICE_DISTANCE_KM = 14;

export const WARDS: WardRecord[] = [
  { ward: 1, name: 'Basavanagudi', zone: 'South', lat: 12.942, lng: 77.573 },
  { ward: 2, name: 'Hanumanthanagar', zone: 'South', lat: 12.94, lng: 77.565 },
  { ward: 3, name: 'Sampangiram Nagar', zone: 'Central', lat: 12.963, lng: 77.585 },
  { ward: 4, name: 'Chamarajapet', zone: 'West', lat: 12.965, lng: 77.576 },
  { ward: 5, name: 'Chickpet', zone: 'Central', lat: 12.9698, lng: 77.5767 },
  { ward: 6, name: 'City Market', zone: 'Central', lat: 12.9667, lng: 77.5667 },
  { ward: 7, name: 'Kumaraswamy Layout', zone: 'South', lat: 12.93, lng: 77.553 },
  { ward: 8, name: 'Sudhama Nagar', zone: 'South', lat: 12.955, lng: 77.585 },
  { ward: 9, name: 'Wilson Garden', zone: 'South', lat: 12.942, lng: 77.588 },
  { ward: 10, name: 'Adugodi', zone: 'South', lat: 12.94, lng: 77.61 },
  { ward: 11, name: 'Madiwala', zone: 'South', lat: 12.925, lng: 77.627 },
  { ward: 12, name: 'Koramangala', zone: 'South', lat: 12.9352, lng: 77.6245 },
  { ward: 13, name: 'Ejipura', zone: 'South', lat: 12.944, lng: 77.625 },
  { ward: 14, name: 'Domlur', zone: 'South', lat: 12.9608, lng: 77.6387 },
  { ward: 15, name: 'Indiranagar', zone: 'East', lat: 12.9784, lng: 77.6408 },
  { ward: 16, name: 'Halasuru', zone: 'East', lat: 12.97, lng: 77.63 },
  { ward: 17, name: 'Ulsoor', zone: 'East', lat: 12.975, lng: 77.625 },
  { ward: 18, name: 'Richmond Town', zone: 'Central', lat: 12.957, lng: 77.6 },
  { ward: 19, name: 'Ashok Nagar', zone: 'East', lat: 12.944, lng: 77.604 },
  { ward: 20, name: 'Jayanagar', zone: 'South', lat: 12.925, lng: 77.5833 },
  { ward: 21, name: 'JP Nagar', zone: 'South', lat: 12.907, lng: 77.584 },
  { ward: 22, name: 'BTM Layout', zone: 'South', lat: 12.9166, lng: 77.6101 },
  { ward: 23, name: 'HSR Layout', zone: 'South', lat: 12.9116, lng: 77.6389 },
  { ward: 24, name: 'Bommanahalli', zone: 'Bommanahalli', lat: 12.9, lng: 77.62 },
  { ward: 25, name: 'Hongasandra', zone: 'Bommanahalli', lat: 12.905, lng: 77.635 },
  { ward: 26, name: 'Singasandra', zone: 'Bommanahalli', lat: 12.89, lng: 77.645 },
  { ward: 27, name: 'Begur', zone: 'Bommanahalli', lat: 12.895, lng: 77.615 },
  { ward: 28, name: 'Hulimavu', zone: 'Bommanahalli', lat: 12.88, lng: 77.59 },
  { ward: 29, name: 'Arekere', zone: 'Bommanahalli', lat: 12.885, lng: 77.595 },
  { ward: 30, name: 'Bommanahalli Industrial Area', zone: 'Bommanahalli', lat: 12.895, lng: 77.625 },
  { ward: 31, name: 'Garvebhavipalya', zone: 'Bommanahalli', lat: 12.905, lng: 77.625 },
  { ward: 32, name: 'Jakkur', zone: 'Byatarayanapura', lat: 13.07, lng: 77.583 },
  { ward: 33, name: 'Yelahanka', zone: 'Yelahanka', lat: 13.1, lng: 77.596 },
  { ward: 34, name: 'Vidyaranyapura', zone: 'Yelahanka', lat: 13.078, lng: 77.55 },
  { ward: 35, name: 'Bagalur', zone: 'Yelahanka', lat: 13.09, lng: 77.56 },
  { ward: 36, name: 'Hebbal', zone: 'North', lat: 13.0358, lng: 77.597 },
  { ward: 37, name: 'Rayasandra', zone: 'Bommanahalli', lat: 12.9, lng: 77.655 },
  { ward: 38, name: 'Basapura', zone: 'Bommanahalli', lat: 12.895, lng: 77.655 },
  { ward: 39, name: 'Kudlu Gate', zone: 'Bommanahalli', lat: 12.895, lng: 77.635 },
  { ward: 40, name: 'Hoskerehalli', zone: 'South', lat: 12.917, lng: 77.545 },
  { ward: 41, name: 'Uttarahalli', zone: 'South', lat: 12.905, lng: 77.545 },
  { ward: 42, name: 'Kengeri', zone: 'West', lat: 12.91, lng: 77.488 },
  { ward: 43, name: 'Rajarajeshwari Nagar', zone: 'Rajarajeshwari', lat: 12.923, lng: 77.515 },
  { ward: 44, name: 'Girinagar', zone: 'South', lat: 12.945, lng: 77.545 },
  { ward: 45, name: 'Banashankari 3rd Stage', zone: 'South', lat: 12.925, lng: 77.546 },
  { ward: 46, name: 'Banashankari', zone: 'South', lat: 12.92, lng: 77.54 },
  { ward: 47, name: 'BSK 1st Stage', zone: 'South', lat: 12.927, lng: 77.556 },
  { ward: 48, name: 'BSK 3rd Stage', zone: 'South', lat: 12.918, lng: 77.57 },
  { ward: 49, name: 'Mallathahalli', zone: 'West', lat: 12.915, lng: 77.5 },
  { ward: 50, name: 'Nayandahalli', zone: 'Rajarajeshwari', lat: 12.965, lng: 77.52 },
  { ward: 51, name: 'Rajarajeshwari Temple Area', zone: 'Rajarajeshwari', lat: 12.94, lng: 77.52 },
  { ward: 52, name: 'Hampinagar', zone: 'West', lat: 12.965, lng: 77.52 },
  { ward: 53, name: 'Mahalakshmi Layout', zone: 'West', lat: 12.975, lng: 77.545 },
  { ward: 54, name: 'Laggere', zone: 'West', lat: 12.985, lng: 77.525 },
  { ward: 55, name: 'Vijayanagar', zone: 'West', lat: 12.998, lng: 77.537 },
  { ward: 56, name: 'Basaveshwara Nagar', zone: 'West', lat: 12.9924, lng: 77.548 },
  { ward: 57, name: 'Kamakshipalya', zone: 'West', lat: 12.99, lng: 77.535 },
  { ward: 58, name: 'Rajajinagar', zone: 'West', lat: 12.991, lng: 77.552 },
  { ward: 59, name: 'Bapujinagar', zone: 'West', lat: 12.995, lng: 77.547 },
  { ward: 60, name: 'Sunkadakatte', zone: 'West', lat: 13.0, lng: 77.54 },
  { ward: 61, name: 'Nandini Layout', zone: 'West', lat: 13.005, lng: 77.545 },
  { ward: 62, name: 'Yeshwanthpur', zone: 'West', lat: 13.023, lng: 77.55 },
  { ward: 63, name: 'Rajgopal Nagar', zone: 'West', lat: 13.015, lng: 77.535 },
  { ward: 64, name: 'Dasarahalli', zone: 'Dasarahalli', lat: 13.04, lng: 77.518 },
  { ward: 65, name: 'Tumkur Road Industrial Area', zone: 'Dasarahalli', lat: 13.035, lng: 77.505 },
  { ward: 66, name: 'Peenya', zone: 'Dasarahalli', lat: 13.03, lng: 77.53 },
  { ward: 67, name: 'Jalahalli', zone: 'Dasarahalli', lat: 13.04, lng: 77.54 },
  { ward: 68, name: 'Rajajinagar Industrial Area', zone: 'Dasarahalli', lat: 13.023, lng: 77.535 },
  { ward: 69, name: 'Sanjay Nagar', zone: 'North', lat: 13.01, lng: 77.562 },
  { ward: 70, name: 'Devarajeevanahalli', zone: 'North', lat: 13.0, lng: 77.56 },
  { ward: 71, name: 'Manjunath Nagar', zone: 'North', lat: 13.005, lng: 77.558 },
  { ward: 72, name: 'M.S. Palya', zone: 'North', lat: 13.005, lng: 77.567 },
  { ward: 73, name: 'Sadashivanagar', zone: 'North', lat: 13.003, lng: 77.575 },
  { ward: 74, name: 'Malleshwaram', zone: 'North', lat: 13.005, lng: 77.569 },
  { ward: 75, name: 'Seshadripuram', zone: 'Central', lat: 12.985, lng: 77.577 },
  { ward: 76, name: 'Vasanth Nagar', zone: 'Central', lat: 12.988, lng: 77.583 },
  { ward: 77, name: 'Gandhi Nagar', zone: 'Central', lat: 12.975, lng: 77.585 },
  { ward: 78, name: 'Shivajinagar', zone: 'Central', lat: 12.9847, lng: 77.6055 },
  { ward: 79, name: 'Cubbon Park', zone: 'Central', lat: 12.9763, lng: 77.5929 },
  { ward: 80, name: 'Vidhana Soudha', zone: 'Central', lat: 12.9794, lng: 77.5946 },
  { ward: 81, name: 'Majestic', zone: 'Central', lat: 12.9756, lng: 77.574 },
  { ward: 82, name: 'Cottonpet', zone: 'Central', lat: 12.975, lng: 77.57 },
  { ward: 83, name: 'K.H. Road', zone: 'Central', lat: 12.978, lng: 77.57 },
  { ward: 84, name: 'Sagara Nagar', zone: 'Central', lat: 12.97, lng: 77.562 },
  { ward: 85, name: 'V.V. Puram', zone: 'South', lat: 12.944, lng: 77.565 },
  { ward: 86, name: 'Lalbagh', zone: 'South', lat: 12.95, lng: 77.584 },
  { ward: 87, name: 'Pattabhiramapuram', zone: 'South', lat: 12.97, lng: 77.57 },
  { ward: 88, name: 'D.H.L. Road', zone: 'South', lat: 12.96, lng: 77.565 },
  { ward: 89, name: 'Sagayapuram', zone: 'South', lat: 12.965, lng: 77.56 },
  { ward: 90, name: 'K.R. Market', zone: 'Central', lat: 12.9667, lng: 77.572 },
  { ward: 91, name: 'Bharathi Nagar', zone: 'Central', lat: 12.988, lng: 77.6 },
  { ward: 92, name: 'Frazer Town', zone: 'East', lat: 12.993, lng: 77.605 },
  { ward: 93, name: 'Cooke Town', zone: 'East', lat: 12.99, lng: 77.61 },
  { ward: 94, name: 'Lingarajapuram', zone: 'East', lat: 13.0, lng: 77.618 },
  { ward: 95, name: 'Kadugondanahalli', zone: 'East', lat: 13.0, lng: 77.628 },
  { ward: 96, name: 'Pulikeshi Nagar', zone: 'East', lat: 12.985, lng: 77.615 },
  { ward: 97, name: 'Cox Town', zone: 'East', lat: 12.982, lng: 77.62 },
  { ward: 98, name: 'Konena Agrahara', zone: 'East', lat: 12.962, lng: 77.64 },
  { ward: 99, name: 'Marathahalli', zone: 'Mahadevapura', lat: 12.9569, lng: 77.7011 },
  { ward: 100, name: 'Kundalahalli', zone: 'Mahadevapura', lat: 12.978, lng: 77.725 },
  { ward: 101, name: 'Brookefield', zone: 'Mahadevapura', lat: 12.983, lng: 77.735 },
  { ward: 102, name: 'Whitefield', zone: 'Mahadevapura', lat: 12.9698, lng: 77.75 },
  { ward: 103, name: 'ITPL Road', zone: 'Mahadevapura', lat: 12.985, lng: 77.74 },
  { ward: 104, name: 'K.R. Puram', zone: 'Mahadevapura', lat: 12.9916, lng: 77.6265 },
  { ward: 105, name: 'Banaswadi', zone: 'East', lat: 13.003, lng: 77.632 },
  { ward: 106, name: 'Horamavu', zone: 'East', lat: 13.005, lng: 77.645 },
  { ward: 107, name: 'HRBR Layout', zone: 'East', lat: 13.007, lng: 77.65 },
  { ward: 108, name: 'Kalyan Nagar', zone: 'East', lat: 13.01, lng: 77.626 },
  { ward: 109, name: 'Hennur', zone: 'East', lat: 13.04, lng: 77.648 },
  { ward: 110, name: 'Banaswadi Station Area', zone: 'East', lat: 13.0, lng: 77.638 },
  { ward: 111, name: 'HBR Layout', zone: 'East', lat: 13.007, lng: 77.66 },
  { ward: 112, name: 'Kammanahalli', zone: 'East', lat: 13.02, lng: 77.635 },
  { ward: 113, name: 'Kagadasanapura', zone: 'North', lat: 13.015, lng: 77.545 },
  { ward: 114, name: 'Vrushabhavathi Nagar', zone: 'North', lat: 12.995, lng: 77.535 },
  { ward: 115, name: 'Hosahalli', zone: 'West', lat: 12.99, lng: 77.528 },
  { ward: 116, name: 'Magadi Road', zone: 'West', lat: 12.99, lng: 77.545 },
  { ward: 117, name: 'Avalahalli', zone: 'West', lat: 12.975, lng: 77.51 },
  { ward: 118, name: 'Govindaraj Nagar', zone: 'West', lat: 12.99, lng: 77.55 },
  { ward: 119, name: 'Srinagar', zone: 'West', lat: 12.98, lng: 77.545 },
  { ward: 120, name: 'Chord Road', zone: 'West', lat: 12.985, lng: 77.535 },
  { ward: 121, name: 'B.T.M. 2nd Stage', zone: 'South', lat: 12.913, lng: 77.615 },
  { ward: 122, name: 'S.G. Palya', zone: 'South', lat: 12.93, lng: 77.62 },
  { ward: 123, name: 'Tavarekere', zone: 'South', lat: 12.905, lng: 77.6 },
  { ward: 124, name: 'Bommanahalli Colony', zone: 'Bommanahalli', lat: 12.9, lng: 77.615 },
  { ward: 125, name: 'Agara', zone: 'South', lat: 12.908, lng: 77.67 },
  { ward: 126, name: 'Varthur', zone: 'Mahadevapura', lat: 12.935, lng: 77.74 },
  { ward: 127, name: 'Sarjapur Road', zone: 'Mahadevapura', lat: 12.9, lng: 77.69 },
  { ward: 128, name: 'Bellandur', zone: 'Mahadevapura', lat: 12.9304, lng: 77.6784 },
  { ward: 129, name: 'Devarabeesanahalli', zone: 'Mahadevapura', lat: 12.938, lng: 77.695 },
  { ward: 130, name: 'Padmanabhanagar', zone: 'South', lat: 12.89, lng: 77.545 },
  { ward: 131, name: 'Begur Koppa', zone: 'Bommanahalli', lat: 12.88, lng: 77.6 },
  { ward: 132, name: 'Chikkabidarakallu', zone: 'Byatarayanapura', lat: 13.05, lng: 77.53 },
  { ward: 133, name: 'Mallathahalli Village', zone: 'West', lat: 12.905, lng: 77.49 },
  { ward: 134, name: 'Doddaballapur Road', zone: 'Yelahanka', lat: 13.11, lng: 77.585 },
  { ward: 135, name: 'Kembathahalli', zone: 'Byatarayanapura', lat: 13.06, lng: 77.56 },
  { ward: 136, name: 'Avalahalli Village', zone: 'Byatarayanapura', lat: 13.05, lng: 77.555 },
  { ward: 137, name: 'Sampigehalli', zone: 'Byatarayanapura', lat: 13.06, lng: 77.585 },
  { ward: 138, name: 'Bidenahalli', zone: 'Byatarayanapura', lat: 13.045, lng: 77.61 },
  { ward: 139, name: 'Chikkajala', zone: 'Yelahanka', lat: 13.12, lng: 77.6 },
  { ward: 140, name: 'Hoskote Road', zone: 'Mahadevapura', lat: 13.05, lng: 77.68 },
];

export const POLICE_STATIONS: PoliceStation[] = [
  { name: 'Ashok Nagar Police Station', lat: 12.944, lng: 77.604 },
  { name: 'Adugodi Police Station', lat: 12.94, lng: 77.61 },
  { name: 'Banashankari Police Station', lat: 12.92, lng: 77.54 },
  { name: 'Basavanagudi Police Station', lat: 12.943, lng: 77.573 },
  { name: 'Bellandur Police Station', lat: 12.931, lng: 77.677 },
  { name: 'Bommanahalli Police Station', lat: 12.9, lng: 77.62 },
  { name: 'BTM Layout Police Station', lat: 12.916, lng: 77.61 },
  { name: 'Chickpet Police Station', lat: 12.97, lng: 77.576 },
  { name: 'City Market Police Station', lat: 12.9667, lng: 77.5667 },
  { name: 'Cottonpet Police Station', lat: 12.975, lng: 77.57 },
  { name: 'Cubbon Park Police Station', lat: 12.9763, lng: 77.5929 },
  { name: 'Vidhana Soudha Police Station', lat: 12.9794, lng: 77.5946 },
  { name: 'Dasarahalli Police Station', lat: 13.04, lng: 77.518 },
  { name: 'Devarajeevanahalli Police Station', lat: 13.0, lng: 77.56 },
  { name: 'Domlur Police Station', lat: 12.9608, lng: 77.6387 },
  { name: 'Ejipura Police Station', lat: 12.944, lng: 77.625 },
  { name: 'Frazer Town Police Station', lat: 12.993, lng: 77.605 },
  { name: 'Gandhi Nagar Police Station', lat: 12.975, lng: 77.585 },
  { name: 'Halasuru Police Station', lat: 12.97, lng: 77.63 },
  { name: 'Hanumanthanagar Police Station', lat: 12.94, lng: 77.565 },
  { name: 'HBR Layout Police Station', lat: 13.007, lng: 77.65 },
  { name: 'Hebbal Police Station', lat: 13.0358, lng: 77.597 },
  { name: 'Hongasandra Police Station', lat: 12.905, lng: 77.635 },
  { name: 'Horamavu Police Station', lat: 13.005, lng: 77.645 },
  { name: 'HSR Layout Police Station', lat: 12.9116, lng: 77.6389 },
  { name: 'Indiranagar Police Station', lat: 12.9784, lng: 77.6408 },
  { name: 'J.P. Nagar Police Station', lat: 12.907, lng: 77.584 },
  { name: 'Jakkur Police Station', lat: 13.07, lng: 77.583 },
  { name: 'Jalahalli Police Station', lat: 13.04, lng: 77.54 },
  { name: 'Jayanagar Police Station', lat: 12.925, lng: 77.5833 },
  { name: 'K.R. Market Police Station', lat: 12.9667, lng: 77.572 },
  { name: 'K.H. Road Police Station', lat: 12.978, lng: 77.57 },
  { name: 'Kadugondanahalli Police Station', lat: 13.0, lng: 77.628 },
  { name: 'Kalyan Nagar Police Station', lat: 13.01, lng: 77.626 },
  { name: 'Kamakshipalya Police Station', lat: 12.99, lng: 77.535 },
  { name: 'Kengeri Police Station', lat: 12.91, lng: 77.488 },
  { name: 'Koramangala Police Station', lat: 12.9352, lng: 77.6245 },
  { name: 'K.R. Puram Police Station', lat: 12.99, lng: 77.628 },
  { name: 'Laggere Police Station', lat: 12.985, lng: 77.525 },
  { name: 'Mahalakshmi Police Station', lat: 12.975, lng: 77.545 },
  { name: 'Majestic Police Station', lat: 12.9756, lng: 77.574 },
  { name: 'Madiwala Police Station', lat: 12.925, lng: 77.627 },
  { name: 'Malleshwaram Police Station', lat: 13.005, lng: 77.569 },
  { name: 'Marathahalli Police Station', lat: 12.9569, lng: 77.7011 },
  { name: 'Nandini Layout Police Station', lat: 13.005, lng: 77.545 },
  { name: 'Nayandahalli Police Station', lat: 12.965, lng: 77.52 },
  { name: 'Peenya Police Station', lat: 13.03, lng: 77.53 },
  { name: 'Rajajinagar Police Station', lat: 12.991, lng: 77.552 },
  { name: 'Rajarajeshwari Nagar Police Station', lat: 12.923, lng: 77.515 },
  { name: 'Rajgopal Nagar Police Station', lat: 13.015, lng: 77.535 },
  { name: 'Richmond Town Police Station', lat: 12.957, lng: 77.6 },
  { name: 'Sampangiram Nagar Police Station', lat: 12.963, lng: 77.585 },
  { name: 'Sanjay Nagar Police Station', lat: 13.01, lng: 77.562 },
  { name: 'Seshadripuram Police Station', lat: 12.985, lng: 77.577 },
  { name: 'Shivajinagar Police Station', lat: 12.9847, lng: 77.6055 },
  { name: 'Singasandra Police Station', lat: 12.89, lng: 77.645 },
  { name: 'Sudhama Nagar Police Station', lat: 12.955, lng: 77.585 },
  { name: 'Ulsoor Police Station', lat: 12.975, lng: 77.625 },
  { name: 'Uttarahalli Police Station', lat: 12.905, lng: 77.545 },
  { name: 'V.V. Puram Police Station', lat: 12.944, lng: 77.565 },
  { name: 'Vasanth Nagar Police Station', lat: 12.988, lng: 77.583 },
  { name: 'Vijayanagar Police Station', lat: 12.998, lng: 77.537 },
  { name: 'Vidyaranyapura Police Station', lat: 13.078, lng: 77.55 },
  { name: 'Whitefield Police Station', lat: 12.9698, lng: 77.75 },
  { name: 'Wilson Garden Police Station', lat: 12.942, lng: 77.588 },
  { name: 'Yelahanka Police Station', lat: 13.1, lng: 77.596 },
  { name: 'Yeshwanthpur Police Station', lat: 13.023, lng: 77.55 },
  { name: 'Hulimavu Police Station', lat: 12.88, lng: 77.59 },
  { name: 'Begur Police Station', lat: 12.895, lng: 77.615 },
];

export interface LocationInfo {
  wardNumber: number;
  wardName: string;
  zone: string;
  policeStation: string;
  wardDistanceKm: number;
  policeDistanceKm: number | null;
  wardLabel: string;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Nearest BBMP ward by centroid distance; null when outside the city radius. */
export function detectWard(lat: number, lng: number): { record: WardRecord; distanceKm: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best: WardRecord | null = null;
  let bestDist = Infinity;
  for (const w of WARDS) {
    const d = haversineKm(lat, lng, w.lat, w.lng);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  }
  if (!best || bestDist > MAX_WARD_DISTANCE_KM) return null;
  return { record: best, distanceKm: Math.round(bestDist * 10) / 10 };
}

/** Nearest police station; null when farther than the city radius. */
export function detectPoliceStation(lat: number, lng: number): { station: PoliceStation; distanceKm: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best: PoliceStation | null = null;
  let bestDist = Infinity;
  for (const p of POLICE_STATIONS) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  if (!best || bestDist > MAX_POLICE_DISTANCE_KM) return null;
  return { station: best, distanceKm: Math.round(bestDist * 10) / 10 };
}

/**
 * Single call used when a citizen pins a spot: returns the ward and the
 * nearest police station for both the citizen and the admin dashboard.
 */
export function detectLocationInfo(lat?: number, lng?: number): LocationInfo | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const ward = detectWard(lat, lng);
  if (!ward) return null;
  const police = detectPoliceStation(lat, lng);
  return {
    wardNumber: ward.record.ward,
    wardName: ward.record.name,
    zone: ward.record.zone,
    policeStation: police ? police.station.name : '',
    wardDistanceKm: ward.distanceKm,
    policeDistanceKm: police ? police.distanceKm : null,
    wardLabel: `Ward ${ward.record.ward} — ${ward.record.name}`,
  };
}

/** All wards sorted by number — used by the admin heatmap legend. */
export function wardIndex(): Map<number, WardRecord> {
  return new Map(WARDS.map(w => [w.ward, w]));
}
