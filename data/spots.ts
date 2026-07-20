// All tourist spot data for ExploQR SJDM v1 lives in this static array.
//
// Content follows the City Tourism Office's destination sheet: name, address,
// description, entrance fee, operating hours, amenities, Facebook page,
// contact number, photos.
//
// Translatable fields (`name`, `description`, `hours`, `fee`, `amenities`) take
// either a plain string — treated as English, the shape everything below still
// uses — or { en: "…", tl: "…" }. Missing `tl` falls back to `en`, so spots can
// be translated one at a time with no migration and no half-broken state:
//
//   hours: "Open daily"
//   hours: { en: "Open daily", tl: "Bukas araw-araw" }
//
// Proper nouns (`barangay`, `address`, `facebook`, and usually `name`) are
// generally left as-is.
//
// `barangay` must match a name in data/barangays.ts so the map can tint and
// label the right area — lib/barangays.ts resolves the common spellings
// ("Sto. Cristo") but it's better to store the official one.
//
// Optional per-spot fields the UI understands. Each renders only when set, so
// a spot with none of them looks finished rather than broken — fill them in as
// the information is confirmed locally, and don't guess:
//   address — full street address, shown as its own full-width row.
//   fee     — entrance/parking cost as free text, translatable.
//             e.g. "Free" · "₱50 per person" · { en: "Free", tl: "Libre" }
//   contact — phone number as dialed locally, e.g. "0917 123 4567".
//             Rendered as a tel: link, so keep it a real number.
//   facebook — the page's NAME, not a URL. Rendered as plain text: most of
//             these have no verified vanity URL, and a guessed link could send
//             visitors to an impostor page.
//   website — full https:// URL; the label is derived from the hostname.
//   amenities — short facilities on offer, rendered as pills. Each entry is
//             translatable. Omit the field entirely rather than passing [] —
//             an empty list reads as "we checked and there are none".
//   icon    — lucide icon name override (see ICON_OVERRIDES in lib/categories.ts)
//   images  — [{ src, credit, license, page }] real photos of the spot.
//             All current photos are freely-licensed works from Wikimedia
//             Commons; credit + license must stay displayed with the photo.
//   pano360 — equirectangular panorama URL; setting it enables the 360° view.
//   openHours — { open: "HH:MM", close: "HH:MM", closedDays?: number[] },
//             evaluated in Asia/Manila by lib/hours.ts to drive the open/closed
//             badge. Only set this when the spot genuinely has one daily
//             window — a spot whose `hours` text says something like "varies",
//             or one that opens twice a day like the River Park Esplanade, has
//             no single window to encode, so leave openHours unset rather
//             than picking a plausible-looking range.
import type { Spot } from "@/lib/types";

export const spots: Spot[] = [
  {
    id: "grotto",
    name: "Our Lady of Lourdes Grotto Shrine",
    barangay: "Graceville",
    address: "Brgy. Graceville, San Jose del Monte City, Bulacan",
    category: "religious",
    lat: 14.793467,
    lng: 121.06674,
    description: {
      en: "A prominent Roman Catholic pilgrimage site on a 25-hectare expanse about 30 kilometres northeast of Manila. Built as a replica of the Basilica of Our Lady of Lourdes in France, it features a man-made grotto, a miraculous spring, and expansive devotional areas that draw thousands of visitors annually, especially during Holy Week. Its origins trace to 1961, when Anita Guidote-Guanzon recovered from cancer after a pilgrimage to Lourdes, prompting her and her husband Horacio to build the site in thanksgiving.",
      tl: "Kilalang pilgrimage site at religious destination na dinarayo ng mga deboto. Malaking dambanang Marian na hango sa Rosary Basilica sa Lourdes, France, may kuweba sa gilid ng burol, Stations of the Cross, at bukal na dinadalaw ng mga deboto dahil sa paniniwalang nakapagpapagaling nito.",
    },
    hours: {
      en: "6 AM–8 PM (varies during events)",
      tl: "6 AM–8 PM (nagbabago tuwing may okasyon)",
    },
    openHours: { open: "06:00", close: "20:00" },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Chapel", tl: "Kapilya" },
      { en: "Prayer Area", tl: "Dasalan" },
      { en: "Parking", tl: "Paradahan" },
      { en: "Souvenir Shops", tl: "Tindahan ng Souvenir" },
    ],
    facebook: "Our Lady of Lourdes Grotto Shrine",
    images: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_16.jpg/960px-Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_16.jpg",
        credit: "Obandoeño12345",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_16.jpg",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_11.jpg/960px-Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_11.jpg",
        credit: "Obandoeño12345",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_11.jpg",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_25.jpg/960px-Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_25.jpg",
        credit: "Obandoeño12345",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Our_Lady_of_Lourdes_Shrine_San_Jose_del_Monte_City_25.jpg",
      },
    ],
    // DUMMY placeholder for testing the 360° viewer — this is a church interior
    // in Cruzy, France, not the Grotto. Swap for a real SJDM panorama before launch.
    // Credit: "Panorama Sphérique", CC BY-SA, Wikimedia Commons.
    pano360:
      "https://upload.wikimedia.org/wikipedia/commons/7/7e/%28Panorama_Spherique%29_PlaceEglise_Cruzy_France.jpg",
  },
  {
    id: "padrepio",
    name: "Padre Pio Mountain of Healing",
    barangay: "Paradise III",
    address: "Barangay Paradise 3, San Jose del Monte City, Bulacan",
    category: "religious",
    lat: 14.834209,
    lng: 121.10984,
    description: {
      en: "A sacred pilgrimage site dedicated to St. Padre Pio, known for miraculous healings and spiritual intercessions. Its distinctive ambiance comes from a 50-foot statue of Padre Pio, reached by a staircase of 150 steps. Visitors come for the environment, the healing masses every Sunday, and the breathtaking view.",
      tl: "Tahimik na religious attraction na may malaking estatwa ni Padre Pio at magandang tanawin. Aabutin sa pamamagitan ng hagdan na may 150 baitang, na may healing mass tuwing Linggo.",
    },
    hours: {
      en: "Tue–Sun, 6 AM–5 PM (closed Mondays)",
      tl: "Martes–Linggo, 6 AM–5 PM (sarado tuwing Lunes)",
    },
    openHours: { open: "06:00", close: "17:00", closedDays: [1] },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Chapel", tl: "Kapilya" },
      { en: "Prayer Area", tl: "Dasalan" },
      { en: "Parking", tl: "Paradahan" },
      { en: "View Deck", tl: "View Deck" },
    ],
    facebook: "Padre Pio Mountain of Healing",
  },
  {
    id: "grottovista",
    name: "Grotto Vista Resort",
    barangay: "Graceville",
    address: "Brgy. Graceville, San Jose del Monte City, Bulacan",
    category: "resorts",
    lat: 14.7919973,
    lng: 121.0588505,
    description: {
      en: "Established in 1995, the first in-land resort in the city, offering a range of amenities and services for a comfortable stay. Its centrepiece is the Galleon Ship Pool — a 1,600 sq.m. pool with a ship at the centre — alongside two large public pools for adults and children.",
      tl: "Resort at hotel na may swimming pools, accommodation, at event venue. Itinatag noong 1995, ito ang unang in-land resort sa lungsod, tampok ang Galleon Ship Pool na may barko sa gitna.",
    },
    hours: {
      en: "Open daily (hotel 24 hours)",
      tl: "Bukas araw-araw (24 oras ang hotel)",
    },
    fee: {
      en: "Day tour ₱250–₱500 · Rooms from ₱2,000",
      tl: "Day tour ₱250–₱500 · Kuwarto mula ₱2,000",
    },
    amenities: [
      { en: "Swimming Pool", tl: "Swimming Pool" },
      { en: "Hotel", tl: "Hotel" },
      { en: "Restaurant", tl: "Restawran" },
      { en: "Bowling", tl: "Bowling" },
      { en: "Pavilion", tl: "Pavilion" },
    ],
    facebook: "Grotto Vista Resort",
    contact: "0917 839 0327",
  },
  {
    id: "tungtong",
    name: "Tungtong Falls",
    barangay: "Santo Cristo",
    address:
      "Carissa 6 Subdivision, Bantay Bayan, Brgy. Sto. Cristo, San Jose del Monte City",
    category: "nature",
    icon: "droplet",
    lat: 14.812765,
    lng: 121.0747165,
    description: {
      en: "One of the most visited falls and among the closest eco-tourism spots in the city. A scenic, beginner-friendly destination known for pristine cascading waters, cool natural rock pools, and lush surrounding forest. Often taken as a refreshing side trip after hiking the nearby Nagpatong Rock Formation.",
      tl: "Natural na talon na magandang puntahan para sa hiking at nature trip, kilala sa malinaw na tubig, malamig na rock pool, at mayabong na kagubatan sa paligid.",
    },
    hours: { en: "7 AM–5 PM", tl: "7 AM–5 PM" },
    openHours: { open: "07:00", close: "17:00" },
    fee: {
      en: "₱20–₱50 (estimated environmental fee)",
      tl: "₱20–₱50 (tinatayang environmental fee)",
    },
    amenities: [
      { en: "Hiking Trail", tl: "Hiking Trail" },
      { en: "Falls", tl: "Talon" },
      { en: "Picnic Area", tl: "Piknikan" },
    ],
    facebook: "TUNGTONG FALLS",
    contact: "0991 789 4243",
  },
  {
    id: "otsootso",
    name: "Otso-Otso Falls",
    barangay: "San Isidro",
    address: "Barrio Licao-Licao, Brgy. San Isidro, San Jose del Monte City, Bulacan",
    category: "nature",
    icon: "droplet",
    // Approximate: geocoded to the Licao-Licao locality, since the falls
    // themselves are not a mapped feature. Confirm on the ground before
    // treating this pin as exact.
    lat: 14.80848,
    lng: 121.15214,
    description: {
      en: "A natural attraction roughly 8 kilometres from Starmall San Jose del Monte, known for its eight-shaped stream reflected in the deep water that splashes to the base. Reached via the Dumagat Trail. Visitors are asked to observe the Clean As You Go (CLAYGO) practice to keep the area as they found it.",
      tl: "Talon na kilala sa hugis-walo nitong agos ng tubig, nasa Brgy. Licao-Licao at aabutin sa pamamagitan ng Dumagat Trail. Pakisunod ang CLAYGO upang mapanatiling malinis ang lugar.",
    },
    hours: { en: "7 AM–5 PM", tl: "7 AM–5 PM" },
    openHours: { open: "07:00", close: "17:00" },
    fee: {
      en: "₱20–₱50 (estimated environmental fee)",
      tl: "₱20–₱50 (tinatayang environmental fee)",
    },
    amenities: [
      { en: "Hiking Trail", tl: "Hiking Trail" },
      { en: "Falls", tl: "Talon" },
      { en: "Picnic Area", tl: "Piknikan" },
    ],
  },
  {
    id: "balagbag",
    name: "Mt. Balagbag",
    barangay: "San Isidro",
    address:
      "Barrio Licao-Licao, Brgy. San Isidro, San Jose del Monte City, Bulacan",
    category: "nature",
    lat: 14.823797,
    lng: 121.115094,
    description: {
      en: "A mountain of 777 metres above sea level, named from the Tagalog \"pabalagbag\" — in horizontal position — for how it lies along the Bulacan–Rizal boundary. Its trails include the beginner-friendly Dumagat Trail, with views reaching the Metro Manila skyline and the Sierra Madre range. Nearby falls such as Kaytitinga are often combined into the same trip.",
      tl: "Bundok na may taas na 777 metro, hango ang pangalan sa salitang \"pabalagbag\" dahil sa pahigang posisyon nito sa hangganan ng Bulacan at Rizal. May trail na angkop sa baguhan at tanawin ng Metro Manila at Sierra Madre.",
    },
    hours: { en: "7 AM–5 PM", tl: "7 AM–5 PM" },
    openHours: { open: "07:00", close: "17:00" },
    fee: {
      en: "Guide ₱350–₱750 per group (max 5 pax) + ₱50–₱100 property access per person",
      tl: "Guide ₱350–₱750 kada grupo (max 5 katao) + ₱50–₱100 property access kada tao",
    },
    amenities: [
      { en: "Hiking Trail", tl: "Hiking Trail" },
      { en: "Restrooms", tl: "Palikuran" },
      { en: "Hillside Resorts", tl: "Hillside Resorts" },
    ],
    facebook: "CSJDM Mt. Balagbag Yapak Tour Guides",
    images: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/6/68/Mount_Balagbag.jpg",
        credit: "Gabbyaguilar25",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Mount_Balagbag.jpg",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mount_Balagbag_1.jpg/960px-Mount_Balagbag_1.jpg",
        credit: "Alichuapee",
        license: "CC BY-SA 4.0",
        page: "https://commons.wikimedia.org/wiki/File:Mount_Balagbag_1.jpg",
      },
    ],
  },
  {
    id: "kaytitinga",
    name: "Kaytitinga Falls",
    barangay: "San Isidro",
    category: "nature",
    icon: "droplet",
    lat: 14.81631,
    lng: 121.160951,
    description: {
      en: "A three-level natural waterfall reached by a forest trek, part of a well-known falls trail in the area.",
      tl: "Natural na talon na may tatlong antas, aabutin sa pamamagitan ng pag-a-trek sa gubat, bahagi ng kilalang trail ng mga talon sa lugar.",
    },
    hours: { en: "Daytime only", tl: "Sa maghapon lamang" },
    openHours: { open: "07:00", close: "16:00" },
    images: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Sjdm_kaytitinga_falls.jpg",
        credit: "Ramz Trinidad",
        license: "Public domain",
        page: "https://commons.wikimedia.org/wiki/File:Sjdm_kaytitinga_falls.jpg",
      },
    ],
  },
  {
    id: "tungkongmangga",
    name: "Adventure camp and Emilio Aguinaldo Bridge",
    barangay: "Tungkong Mangga",
    category: "nature",
    icon: "tent",
    lat: 14.781492,
    lng: 121.088323,
    description: {
      en: "Home to Paradise Adventure Camp's outdoor team-building programs, and the historical Emilio Aguinaldo Bridge where General Aguinaldo and his men once rested en route to Southern Luzon.",
      tl: "Tahanan ng mga outdoor team-building program ng Paradise Adventure Camp, at ang makasaysayang Emilio Aguinaldo Bridge kung saan minsang nagpahinga si Heneral Aguinaldo at ang kanyang mga tauhan patungong Timog Luzon.",
    },
    hours: { en: "Varies by activity", tl: "Depende sa aktibidad" },
  },
  {
    id: "riverpark",
    name: "CSJDM River Park Esplanade",
    barangay: "Dulong Bayan",
    address:
      "New Government Center, Brgy. Dulong Bayan, San Jose del Monte City, Bulacan",
    category: "parks",
    lat: 14.82777,
    lng: 121.044839,
    description: {
      en: "A serene public park along the river, with walking paths, picnic areas, and scenic views. Built for jogging, cycling, or simply enjoying the quiet, with benches and shaded areas throughout for relaxation and community gatherings.",
      tl: "Modernong riverside park para sa jogging, walking, at family bonding, may daanan, upuan, at tanawin sa tabi ng ilog.",
    },
    // Two windows a day, morning and evening — openHours can only encode one,
    // so it stays unset and the text above is the whole truth.
    hours: {
      en: "5–9 AM & 5–9 PM",
      tl: "5–9 AM at 5–9 PM",
    },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Walking Path", tl: "Daanan" },
      { en: "Benches", tl: "Mga Upuan" },
      { en: "Lighting", tl: "Ilaw" },
      { en: "Open Space", tl: "Open Space" },
    ],
    facebook: "City Government of San Jose del Monte",
  },
  {
    id: "savano",
    name: "Savano Park",
    barangay: "San Manuel",
    address:
      "Quirino Highway corner Narra Street, Brgy. San Manuel, San Jose del Monte City, Bulacan",
    category: "parks",
    lat: 14.78238,
    lng: 121.07303,
    description: {
      en: "A vibrant community park popular with families and picnickers, with lush greenery, walking paths, and facilities for various leisure pursuits. Several restaurants and cafes make it a spot for dining as well. It is named after the Savano family, who donated the land to the city in the 1970s.",
      tl: "Family park na may open spaces, food stalls, at recreational area. Ipinangalan sa pamilyang Savano na nagdonate ng lupa sa lungsod noong dekada 1970.",
    },
    hours: { en: "11 AM–11 PM", tl: "11 AM–11 PM" },
    openHours: { open: "11:00", close: "23:00" },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Playground", tl: "Palaruan" },
      { en: "Food Stalls", tl: "Mga Tindahan ng Pagkain" },
      { en: "Seating Area", tl: "Upuan" },
    ],
    facebook: "Savano Park",
  },
  {
    id: "kaypianeco",
    name: "Kaypian Eco Park",
    barangay: "Kaypian",
    address: "Abela Road, Brgy. Kaypian, San Jose del Monte City, Bulacan",
    category: "parks",
    // Approximate: placed at the centroid of Brgy. Kaypian. Geocoding the
    // address put it in Poblacion I, which is the wrong barangay, so the
    // barangay centre is the more honest placeholder until someone confirms.
    lat: 14.81968,
    lng: 121.05912,
    description: {
      en: "A community-driven eco-garden and sustainable park promoting food security, environmental stewardship, and inclusive community engagement.",
      tl: "Maliit ngunit maaliwalas na eco-park para sa relaxation at sightseeing, itinataguyod ang food security at pangangalaga sa kalikasan.",
    },
    hours: { en: "Open daily", tl: "Bukas araw-araw" },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Garden", tl: "Hardin" },
      { en: "Viewing Area", tl: "Tanawan" },
      { en: "Benches", tl: "Mga Upuan" },
    ],
  },
  {
    id: "smviewdeck",
    name: "SM SJDM View Deck",
    barangay: "Tungkong Mangga",
    address:
      "Quirino Highway, Brgy. Tungkong Mangga, San Jose del Monte City, 3023 Bulacan",
    category: "leisure",
    icon: "eye",
    lat: 14.786348,
    lng: 121.075418,
    description: {
      en: "A two-storey-high view deck reached through the bridge exit at the lower ground floor Events Center or the al fresco dining areas nearby. Clear tempered glass panels along the bridge give an open view of the surrounding greenery, while its cable supports run up to a towering pylon. Below sits the Lagoon, a park with decorative plants, a water pond, and eight fountains lit in colour at night.",
      tl: "Viewing area na may magandang tanawin ng lungsod, lalo na sa gabi. Sa ibaba nito ang Lagoon na may halaman, water pond, at walong fountain na may makukulay na ilaw sa gabi.",
    },
    hours: { en: "10 AM–8 PM", tl: "10 AM–8 PM" },
    openHours: { open: "10:00", close: "20:00" },
    fee: { en: "Free", tl: "Libre" },
    amenities: [
      { en: "Viewing Deck", tl: "Tanawan" },
      { en: "Parking", tl: "Paradahan" },
      { en: "Nearby Restaurants", tl: "Malapit na Restawran" },
    ],
    facebook: "SM City San Jose Del Monte",
  },
  {
    id: "cattlecreek",
    name: "Cattle Creek Golf and Country Club",
    barangay: "Sapang Palay",
    category: "leisure",
    lat: 14.839678,
    lng: 121.056407,
    description: {
      en: "A par-72, hilly and wooded 9-hole golf course, one of the city's main leisure destinations.",
      tl: "Isang par-72, mabundok at makahoy na 9-hole na golf course, isa sa pangunahing destinasyon pang-libangan ng lungsod.",
    },
    hours: { en: "6 AM–5 PM daily", tl: "6 AM–5 PM araw-araw" },
    openHours: { open: "06:00", close: "17:00" },
    images: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Sjdm_golf_course2.jpg",
        credit: "Ramz Trinidad",
        license: "Public domain",
        page: "https://commons.wikimedia.org/wiki/File:Sjdm_golf_course2.jpg",
      },
    ],
  },
];
