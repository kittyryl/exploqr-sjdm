// All tourist spot data for ExploQR SJDM v1 lives in this static array.
//
// Translatable fields (`name`, `description`, `hours`) take either a plain
// string — treated as English, the shape everything below still uses — or
// { en: "…", tl: "…" }. Missing `tl` falls back to `en`, so spots can be
// translated one at a time with no migration and no half-broken state:
//
//   hours: "Open daily"
//   hours: { en: "Open daily", tl: "Bukas araw-araw" }
//
// Proper nouns (`barangay`, and usually `name`) are generally left as-is.
//
// Optional per-spot fields the UI understands. Each renders only when set, so
// a spot with none of them looks finished rather than broken — fill them in as
// the information is confirmed locally, and don't guess:
//   fee     — entrance/parking cost as free text, translatable.
//             e.g. "Free" · "₱50 per person" · { en: "Free", tl: "Libre" }
//   contact — phone number as dialed locally, e.g. "0917 123 4567".
//             Rendered as a tel: link, so keep it a real number.
//   website — full https:// URL; the label is derived from the hostname.
//   icon    — lucide icon name override (see ICON_OVERRIDES in lib/categories.js)
//   images  — [{ src, credit, license, page }] real photos of the spot.
//             All current photos are freely-licensed works from Wikimedia
//             Commons; credit + license must stay displayed with the photo.
//   pano360 — equirectangular panorama URL; setting it enables the 360° view.
export const spots = [
  {
    id: "grotto",
    name: "Our Lady of Lourdes Grotto Shrine",
    barangay: "Graceville",
    category: "religious",
    lat: 14.793467,
    lng: 121.06674,
    description: {
      en: "A large Marian shrine modeled on the Rosary Basilica in Lourdes, France, with a hillside grotto, Stations of the Cross, and a spring devotees visit for its believed healing properties.",
      tl: "Malaking dambanang Marian na hango sa Rosary Basilica sa Lourdes, France, may kuweba sa gilid ng burol, Stations of the Cross, at bukal na dinadalaw ng mga deboto dahil sa paniniwalang nakapagpapagaling nito.",
    },
    hours: { en: "Open daily", tl: "Bukas araw-araw" },
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
  },
  {
    id: "padrepio",
    name: "Padre Pio Mountain of Healing",
    barangay: "Area C, Brgy. Paradise",
    category: "religious",
    lat: 14.834209,
    lng: 121.10984,
    description: {
      en: "A hillside shrine topped with a towering statue of Padre Pio, reached by a climb that rewards visitors with views over the Sierra Madre foothills.",
      tl: "Dambana sa gilid ng burol na may nakatayong malaking estatwa ni Padre Pio, aabutin sa pamamagitan ng pag-akyat na gagantimpalaan ng tanawin ng mga paanan ng Sierra Madre.",
    },
    hours: {
      en: "Tue–Sun, 6 AM–5 PM (closed Mondays)",
      tl: "Martes–Linggo, 6 AM–5 PM (sarado tuwing Lunes)",
    },
  },
  {
    id: "balagbag",
    name: "Mt. Balagbag",
    barangay: "San Isidro",
    category: "nature",
    lat: 14.823797,
    lng: 121.115094,
    description: {
      en: "A beginner-friendly trekking and camping site at 777 meters, popular for its views of Metro Manila, Rizal, and Bulacan from the summit.",
      tl: "Angkop-sa-baguhan na lugar para sa pag-a-trek at pagkakampo sa taas na 777 metro, kilala sa tanawin ng Metro Manila, Rizal, at Bulacan mula sa tuktok.",
    },
    hours: {
      en: "Daytime trekking recommended",
      tl: "Inirerekomenda ang pag-a-trek sa maghapon",
    },
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
