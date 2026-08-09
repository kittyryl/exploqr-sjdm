// All tourist spot info lives in this one list.
//
// The content comes from the City Tourism Office's official spot sheet.
//
// All text is in plain English now — the app no longer switches between
// English and Tagalog (see lib/i18n.ts).
//
// `barangay` must match a name in data/barangays.ts so the map can highlight
// the right area — use the official spelling, not a shortcut like "Sto. Cristo".
//
// These extra fields are optional and only show up on the page if you fill
// them in — leave them out rather than guessing:
//   address — full street address, shown as its own row.
//   fee     — cost as plain text, e.g. "Free" or "₱50 per person".
//   contact — a real phone number people can tap to call, e.g. "0917 123 4567".
//   facebook — the page's name, shown as plain text on its own.
//   facebookUrl — the page's verified URL. Add this alongside facebook to
//             turn the name into a link — only use a URL you've confirmed is
//             the real page, never a guess.
//   website — a full web address; the label shown is worked out automatically.
//   amenities — short list of facilities, shown as little tags. Leave the
//             field out entirely if there are none, rather than an empty list.
//   icon    — swap in a different icon (see ICON_OVERRIDES in lib/categories.ts).
//   images  — local paths under public/images/spots/, not remote URLs —
//             download the file into that folder and point the entry at it.
//   pano360 — a local path (same public/images/spots/ folder) to a 360-degree
//             photo; adding one turns on the 360° viewer.
//   openHours — the daily open/close time, used to show an open/closed badge.
//             Only set this if the spot has one simple daily schedule — skip
//             it for places with "varies" hours or two separate time windows.
import type { Spot } from "@/lib/types";

export const spots: Spot[] = [
  {
    id: "grotto",
    name: "Our Lady of Lourdes Grotto Shrine",
    barangay: "Graceville",
    address: "Brgy. Graceville, San Jose del Monte City, Bulacan, Philippines",
    category: "religious",
    lat: 14.7934724,
    lng: 121.064165,
    description:
      "Kilalang pilgrimage site at religious destination na dinarayo ng mga deboto. The Our Lady of Lourdes Grotto Shrine is a prominent Roman Catholic pilgrimage site in Graceville, San Jose del Monte City, Bulacan. Situated on a 25-hectare expanse approximately 30 kilometers northeast of Manila. Established as a replica of the Basilica of Our Lady of Lourdes in France, it features a man-made grotto, a miraculous spring, and expansive devotional areas that draw thousands of visitors annually, especially during Holy Week for prayer, processions, and meditation. The shrine's origins trace back to 1961, when Anita Guidote-Guanzon experienced a miraculous recovery from cancer following a pilgrimage to Lourdes, France, prompting her and her husband Horacio Guanzon to construct the site as an act of thanksgiving.",
    hours: "6:00 AM – 8:00 PM (varies during events)",
    openHours: { open: "06:00", close: "20:00" },
    fee: "Free",
    amenities: ["Chapel", "Prayer Area", "Parking", "Souvenir Shops"],
    facebook: "Our Lady of Lourdes Grotto Shrine",
    facebookUrl: "https://www.facebook.com/profile.php?id=100068736993497",
    contact: "0930 279 6101",
    images: [
      "/images/spots/grotto/1.jpg",
      "/images/spots/grotto/2.jpg",
      "/images/spots/grotto/3.jpg",
    ],
    pano360: "/images/spots/grotto/360.jpg"
  },
  {
    id: "grottovista",
    name: "Grotto Vista Resort",
    barangay: "Graceville",
    address: "Brgy. Graceville, San Jose del Monte City, Bulacan, Philippines",
    category: "resorts",
    lat: 14.7919973,
    lng: 121.0588505,
    description:
      "Resort at hotel na may swimming pools, accommodation, at event venue. Grotto Vista Resort is a premier resort located in San Jose del Monte, Bulacan. Established in 1995, it is the first in-land resort in the city and offers a variety of amenities and services to ensure a comfortable and enjoyable stay. The resort features a Galleon Ship Pool, a 1,600 sq.m. pool with a ship at the center, and two large public pools for both adults and children.",
    hours: "Open Daily (24 hours for hotel)",
    fee: "Day tour: ₱250–₱500 · Rooms: ₱2,000+",
    amenities: ["Swimming Pool", "Hotel", "Restaurant", "Bowling", "Pavilion"],
    facebook: "Grotto Vista Resort",
    facebookUrl: "https://www.facebook.com/GrottoVistaResort",
    contact: "0917 839 0327",
    images: [
      "/images/spots/grottovista/1.jpg",
      "/images/spots/grottovista/2.jpg",
      "/images/spots/grottovista/3.jpg",
    ],
    pano360: "/images/spots/grottovista/360.jpg"
  },
  {
    id: "padrepio",
    name: "Padre Pio Mountain of Healing",
    barangay: "Paradise III",
    address: "Barangay Paradise 3, San Jose del Monte City, Bulacan",
    category: "religious",
    lat: 14.8342145,
    lng: 121.1072651,
    description:
      "Tahimik na religious attraction na may malaking estatwa ni Padre Pio at magandang tanawin. The Padre Pio Shrine is a sacred pilgrimage site in San Jose del Monte, Bulacan, dedicated to St. Padre Pio, known for miraculous healings and spiritual intercessions. It is a place which possesses a distinctive ambiance with its prominent 50-feet statue of the figure of Padre Pio. The place is accessible via a staircase with 150 steps which this sacred site invites visitors to enjoy the environment, attend healing masses every Sunday, and embrace its breath-taking view.",
    hours: "Closed every Monday. Operates Tuesday–Sunday, 6:00 AM – 5:00 PM",
    openHours: { open: "06:00", close: "17:00", closedDays: [1] },
    fee: "Free",
    amenities: ["Chapel", "Prayer Area", "Parking", "View Deck"],
    facebook: "Padre Pio Mountain of Healing",
    facebookUrl: "https://www.facebook.com/profile.php?id=100064830575529",
    images: [
      "/images/spots/padrepio/1.jpg",
      "/images/spots/padrepio/2.jpg",
      "/images/spots/padrepio/3.jpg",
      "/images/spots/padrepio/4.jpg",
    ],
    pano360: "/images/spots/padrepio/360.jpg"
  },
  {
    id: "tungtong",
    name: "Tungtong Falls",
    barangay: "Santo Cristo",
    address:
      "Carissa 6 Subdivision, Bantay Bayan, Brgy. Sto. Cristo, San Jose del Monte City",
    category: "nature",
    icon: "droplet",
    lat: 14.8153321,
    lng: 121.0860247,
    description:
      "Natural waterfall na magandang puntahan para sa hiking at nature trip. Tungtong Falls is one of the most visited falls and one of the closest eco-tourism spots in the City of San Jose del Monte. It’s a scenic and beginner-friendly nature destination famous for its pristine cascading waters, cool natural rock pools, and lush sorrounding forests. Often explored as refreshing sidetrip after a hike up the nearby Nagpatong Rock Formation, it is well-loved for its tranquil ambiance and accessibility.",
    hours: "7:00 AM – 5:00 PM",
    openHours: { open: "07:00", close: "17:00" },
    fee: "₱20–₱50 (estimated environmental fee)",
    amenities: ["Hiking Trail", "Falls", "Picnic Area"],
    facebook: "TUNGTONG FALLS",
    facebookUrl: "https://www.facebook.com/Tungtongfalls",
    contact: "0991 789 4243",
    images: [
      "/images/spots/tungtong/1.jpeg",
      "/images/spots/tungtong/2.jpeg",
      "/images/spots/tungtong/3.jpeg"
    ],
  },
  {
    id: "balagbag",
    name: "Mt. Balagbag",
    barangay: "San Isidro",
    address:
      "Barrio Licao-Licao, Brgy. San Isidro, City of San Jose del Monte, Bulacan",
    category: "nature",
    lat: 14.823797,
    lng: 121.115094,
    description:
      "Mt. Balagbag is a prominent mountain in San Jose del Monte, Bulacan, 777 meters above sea level, known for its horizontal position along the boundary between Bulacan and Rizal — its name comes from the Tagalog word \"pabalagbag,\" meaning \"in horizontal position.\" The mountain offers a variety of hiking trails, including the beginner-friendly Dumagat Trail, with stunning views of the surrounding areas including the Metro Manila skyline. Visitors can also explore nearby attractions like Kaytitinga Falls and enjoy the natural beauty of the Sierra Madre range, making it a popular hiking destination for both locals and tourists.",
    hours: "7:00 AM – 5:00 PM",
    openHours: { open: "07:00", close: "17:00" },
    fee:
      "Tour Guide Fees — Day tour: ₱350 per group (max 5 pax), 6-hour tour. Tour + Falls (Burong, Otso-Otso, or Kaytitinga): ₱500 per group (max 5 pax), 8-hour tour. Overnight: ₱750 per group (max 5 pax), 3 PM–6 AM. Private Property Access Fee: ₱50 per person (day tour), ₱100 per person (overnight).",
    amenities: ["Hiking Trail", "Restrooms", "Hillside Resorts"],
    facebook: "CSJDM Mt. Balagbag Yapak Tour Guides",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: ["/images/spots/balagbag-1.jpg", "/images/spots/balagbag-2.jpg"],
  },
  {
    id: "otsootso",
    name: "Otso-Otso Falls",
    barangay: "San Isidro",
    address: "Brgy. Licao-Licao, City of San Jose del Monte, Bulacan",
    category: "nature",
    icon: "droplet",
    lat: 14.8067811,
    lng: 121.1396439,
    description:
      "Otso-otso Falls, located in Brgy Licao-Licao, City of San Jose del Monte, Bulacan, is a beautiful natural attraction approximately 8 kilometers from Starmall San Jose del Monte. The falls are known for their eight-shaped stream, which is reflected in the deep waters that splash to the base. Visitors can enjoy the scenic beauty and observe the Clean As You Go (CLAY Go) initiative to preserve the area's natural environment. The falls are accessible via the Dumagat Trail, making it a popular spot for nature enthusiasts and tourists.",
    hours: "7:00 AM – 5:00 PM",
    openHours: { open: "07:00", close: "17:00" },
    fee: "₱20–₱50 (estimated environmental fee)",
    amenities: ["Hiking Trail", "Falls", "Picnic Area"],
    images: [
      "/images/spots/otsootso/1.jpeg",
      "/images/spots/otsootso/2.jpeg",
      "/images/spots/otsootso/3.jpeg",
    ],
  },
  {
    id: "riverpark",
    name: "CSJDM River Park Esplanade",
    barangay: "Dulong Bayan",
    address:
      "New Government Center, Brgy. Dulong Bayan, City of San Jose Del Monte, Bulacan",
    category: "parks",
    lat: 14.8276329,
    lng: 121.0431204,
    description:
      "Modern riverside park para sa jogging, walking, at family bonding. CSJDM River Park Esplanade is a serene public park located in San Jose del Monte, Bulacan. This green space features walking paths, picnic areas, and scenic views along the river, making it an ideal spot for families and nature lovers. Visitors can engage in various outdoor activities, including jogging, cycling, or simply enjoying the tranquil environment. The esplanade is designed to promote relaxation and community gatherings, offering numerous benches and shaded areas where people can unwind and appreciate the natural surroundings.",
    hours: "5:00–9:00 AM & 5:00–9:00 PM",
    fee: "Free",
    amenities: ["Walking Path", "Benches", "Lighting", "Open Space"],
    facebook: "City Government of San Jose del Monte",
    facebookUrl: "https://www.facebook.com/csjdmesplanade",
    images: [
      "/images/spots/riverpark/1.jpg",
      "/images/spots/riverpark/2.jpg",
      "/images/spots/riverpark/3.jpg",
      "/images/spots/riverpark/4.jpg",
    ],
    pano360: "/images/spots/riverpark/360.jpg"
  },
  {
    id: "savano",
    name: "Savano Park",
    barangay: "San Manuel",
    address:
      "Quirino Highway corner Narra Street, Brgy. San Manuel, City of San Jose del Monte, Bulacan",
    category: "parks",
    lat: 14.78238,
    lng: 121.07303,
    description:
      "Savano Park is a vibrant community park in San Jose del Monte, Bulacan, Philippines, popular with families and picnickers. It features lush greenery, walking paths, and facilities for various leisure pursuits, plus several restaurants and cafes for dining. Savano Park is named after the Savano family, who donated the land to the city in the 1970s, and has been a beloved destination for locals and visitors alike.",
    hours: "11:00 AM – 11:00 PM",
    openHours: { open: "11:00", close: "23:00" },
    fee: "Free",
    amenities: ["Playground", "Food Stalls", "Seating Area"],
    facebook: "Savano Park",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: [
      "/images/spots/savano/1.jpeg",
      "/images/spots/savano/2.jpeg",
      "/images/spots/savano/3.jpeg",
      "/images/spots/savano/4.jpeg",
    ],
    pano360: "/images/spots/savano/360.jpg"
  },
  {
    id: "kaypianeco",
    name: "Kaypian Eco Park",
    barangay: "Kaypian",
    address: "Abela Road, Brgy. Kaypian, City of San Jose del Monte, Bulacan",
    category: "parks",
    lat: 14.8250053,
    lng: 121.0483595,
    description:
      "Kaypian Eco Park is a community-driven eco-garden and sustainable park in Barangay Kay Pian, San Jose del Monte, Bulacan, promoting food security, environmental stewardship, and inclusive community engagement.",
    hours: "Open Daily",
    fee: "Free",
    amenities: ["Garden", "Viewing Area", "Benches"],
    images: [
      "/images/spots/kaypianeco/1.jpg",
      "/images/spots/kaypianeco/2.jpg",
      "/images/spots/kaypianeco/3.jpg",
    ]
  },
  {
    id: "smviewdeck",
    name: "SM SJDM View Deck",
    barangay: "Tungkong Mangga",
    address:
      "Quirino Highway, Brgy. Tungkong Mangga, City Of San Jose Del Monte, 3023 Bulacan, Philippines",
    category: "leisure",
    icon: "eye",
    lat: 14.7859314,
    lng: 121.0734427,
    description:
      "The two-story-high view deck is reached through the bridge exit at the lower ground floor Events Center or the al fresco dining areas of surrounding restaurants — open-air lounges on the upper ground and second floor also offer a great bird's-eye view. Clear tempered glass panels along the bridge give an unlimited view of the lush scenery, while its cable supports running up to the towering pylon add style and strength. Below sits the Lagoon, a park with decorative plants, a water pond, and eight fountains that come alive at night with colorful lighting.",
    hours: "10:00 AM – 8:00 PM",
    openHours: { open: "10:00", close: "20:00" },
    fee: "Free",
    amenities: ["Viewing Deck", "Parking", "Nearby Restaurants"],
    facebook: "SM City San Jose Del Monte",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: [
      "/images/spots/smviewdeck/1.jpg",
      "/images/spots/smviewdeck/2.jpg",
      "/images/spots/smviewdeck/3.jpg",
    ],
    pano360: "/images/spots/smviewdeck/360.jpg",
  },
  {
    id: "starmall",
    name: "SM Starmall San Jose del Monte",
    barangay: "Kaypian",
    address:
      "Quirino Highway corner Kaypian Road, Brgy. Kaypian, City of San Jose del Monte, Bulacan 3023, Philippines",
    category: "leisure",
    lat: 14.8149459,
    lng: 121.0691306,
    description:
      "Starmall San Jose Del Monte is the first Starmall built in Bulacan. Conveniently located along Quirino Highway, the world-class-designed regional super center sets the standard for innovation and an evolved shopping experience. To house the increasing number of food outlets offering various specialties, the Al Fresco Garden was added — an upper-level walkway lined with greenery that connects the main mall to Quirino Highway.",
    hours: "10:00 AM – 9:00 PM Daily",
    fee: "Free",
    amenities: [
      "Shopping Stores",
      "Restaurants",
      "Al Fresco Garden",
      "Supermarket",
      "Cinema",
      "Banks & ATMs",
      "Parking",
    ],
    facebook: "Starmall San Jose Del Monte",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: [
      "/images/spots/starmall/1.jpg",
      "/images/spots/starmall/2.jpg",
      "/images/spots/starmall/3.jpg",
    ],
    pano360: "/images/spots/starmall/360.jpg"
  },
  {
    id: "tierrafontana",
    name: "Tierra Fontana 12 Waves Resort",
    barangay: "Tungkong Mangga",
    address:
      "479 Paradise Farm Street, Brgy. Tungkong Mangga, City of San Jose del Monte, Bulacan 3023, Philippines",
    category: "resorts",
    lat: 14.7979229,
    lng: 121.0755411,
    description:
      "Tierra Fontana 12 Waves Resort is a DOT-accredited resort and events venue in San Jose del Monte, Bulacan. It offers public and private swimming pools, overnight accommodations, function halls, and garden pavilions — a popular pick for family outings, celebrations, team-building activities, and staycations.",
    hours:
      "Open daily (24 hours for checked-in guests); day tour and pool hours vary by package or reservation.",
    fee:
      "Day tour rates vary by season and guest type. Room accommodations vary by room type. Private pool/event packages available upon reservation — the resort doesn't publish fixed rates online, so contact them directly for current pricing.",
    amenities: [
      "Swimming Pool",
      "12-Wave Pool",
      "Waterslides",
      "Kiddie Pool",
      "Function Hall",
      "Garden Pavilion",
      "Parking",
    ],
    facebook: "Tierra Fontana 12 Waves Resort",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: [
      "/images/spots/tierrafontana/1.jpg",
      "/images/spots/tierrafontana/2.jpg",
      "/images/spots/tierrafontana/3.jpg",
    ],
    pano360: "/images/spots/tierrafontana/360.jpg"
  },
  {
    id: "cityoval",
    name: "City Athletic and Recreational Center (City Oval)",
    barangay: "Sapang Palay",
    address:
      "Barangay Sapang Palay Proper, City of San Jose del Monte, Bulacan, Philippines",
    category: "parks",
    lat: 14.839799,
    lng: 121.0385244,
    description:
      "The City Athletic and Recreational Center, commonly known as the City Oval or People's Park, is a government-owned sports and recreation facility in San Jose del Monte. It serves as a venue for jogging, walking, fitness activities, sports competitions, community events, and city celebrations — recognized by the City Government as one of the city's sports tourism destinations.",
    hours: "5:00 AM – 9:00 PM Daily",
    fee: "Free",
    amenities: ["Jogging Oval", "Walking Paths", "Sports Field", "Restrooms", "Open Green Spaces"],
    facebook: "City Youth and Sports Development Office – CSJDM",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    images: [
      "/images/spots/cityoval/1.jpg",
      "/images/spots/cityoval/2.jpg",
    ],
    pano360: "/images/spots/cityoval/360.jpg"
  },
];
