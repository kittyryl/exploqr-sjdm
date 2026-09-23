# How We Built ExploQR SJDM

Project: ExploQR SJDM  
System: Offline Tourism Web App with Interactive Map  

---

## 1. Project Overview

ExploQR is a website we made to help people explore tourist spots in San Jose del Monte, Bulacan. In our city, places like Mt. Balagbag, local waterfalls, and churches are far from each other. Finding good information online is hard because many posts are old. When you hike up the mountains, cell phone signal often drops to zero. Also, most people do not want to download a big app from the app store just to visit a place for one day.

We made ExploQR so anyone can just scan a QR code or open a link on their phone and use it right away. You do not need to download or install anything. It shows a map of the city, gives road directions, lets you look around using 360-degree photos, and still works even when you have no internet in the mountains.

---

## 2. Tools We Used

We used simple and free tools to build the website:

* **Next.js and React:** The main tools we used to build the website pages.
* **TypeScript:** Helps us write clean code and avoid bugs.
* **Tailwind CSS:** Used for the design, colors, buttons, and dark mode.
* **Leaflet:** The map library we used for the interactive city map and custom pins.
* **CARTO Voyager Tiles:** The free map style that shows roads and mountains clearly.
* **Turf.js:** Used to trace the borders of all 59 barangays in the city.
* **OSRM:** Gives driving directions and estimates travel time using real roads.
* **Pannellum:** Shows 360-degree photos that you can drag and look around.
* **Supabase:** The online database where ratings and user feedback photos are saved.
* **Service Worker:** Saves the map and pictures to the phone so it works with no internet.

---

## 3. Step-by-Step Procedure

### Step 1: Gathering Details and Coordinates
We started by visiting spots and doing field research to get accurate details. We gathered real entrance fees, opening hours, contact numbers, and social media pages. We also saved the exact GPS coordinates for each location and got the map files for all 59 barangays.

### Step 2: Setting Up the Site and Design
We created the Next.js project and set up the design. We used warm colors to match the mountains and added a light grid pattern to make it look like a real travel map. We also added dark mode and made sure the text is easy to read under the sun.

### Step 3: Making the Map and Photo Pins
We set up the Leaflet map to load only on the user's screen. Instead of using plain red pins, we made circular pins that show a real photo of the place. Each pin has a colored border based on its category, like green for nature and purple for churches. We also outlined all 59 barangays on the map and dimmed nearby towns.

### Step 4: Adding Spot Details and Open/Closed Status
When you tap a pin on the map, a card opens with the details. We wrote code that checks the time on your phone. If the place is open right now, it shows a green "Open Now" tag. If it is closed, it shows "Closed". The card also lists entrance fees, parking, restrooms, and a phone number you can tap to call.

### Step 5: Adding 360-Degree Photos
For places like the Grotto and River Park, we added 360-degree photos. You can drag your finger on the screen to look all around the place before going there.

### Step 6: Finding Nearby Spots and Giving Directions
We added a "Near Me" button that checks your GPS location. It sorts the places to show which ones are closest to you and how many kilometers away they are. When you tap "Get Directions", it draws a blue line along the real roads, showing how to get there and how many minutes it will take. If there is no signal, it shows a straight line so you still know the direction.

### Step 7: Ratings and Photo Feedback
We added a simple 1 to 5 star rating system. You do not need to make an account or log in to rate a place. The site just remembers your phone so people cannot spam ratings. We also built a feedback form where people can send messages and attach up to three photos to report trail conditions or updates.

### Step 8: Making It Work With No Internet
In places like Mt. Balagbag, mobile internet often stops working. We added a Service Worker to fix this. When you open the website while you have internet, it quietly saves the map and photos onto your phone. When you reach the mountains and lose your signal, the map and photos still open from your phone storage. You can also tap "Add to Home Screen" to use it like an app.

### Step 9: Testing Everything
We tested the site on Android phones, iPhones, tablets, and laptops. We tested the offline mode by turning off Wi-Fi and mobile data to make sure the map and photos still show up without errors.

---

## 4. Presentation Guide (Slide by Slide)

Here is what you can say during the presentation. It is written in simple, normal words.

### Slide 1: Title
> "Good day everyone. This is ExploQR, a website we made for tourists and locals in San Jose del Monte, Bulacan. It gives verified spot details, road directions, 360-degree photos, and it still works even without internet in the mountains."

### Slide 2: The Problem
> "We made this because finding info about places here is hard. Most posts online are old, and when you go to the mountains or waterfalls, there is no signal. Also, people do not want to download a heavy app just for a quick trip."

### Slide 3: What ExploQR Does
> "ExploQR runs directly in your phone browser. You just scan a QR code or click a link, and it opens right away. You do not need to download anything or make an account. You get directions, photos, and it works completely offline."

### Slide 4: Tools Used
> "We built the site using Next.js, React, and Leaflet for the interactive map. We used OSRM for road directions, Pannellum for 360-degree photos, and Supabase to store ratings and feedback photos."

### Slide 5: The Map and Pins
> "On the map, we put real photos inside the pins instead of regular red markers so you know what the place looks like right away. The map also shows all 59 barangays and dims nearby cities so you can focus on San Jose del Monte."

### Slide 6: Spot Details and Hours
> "When you tap a spot, a card pops up. It checks your phone clock and tells you if the place is open or closed right now. It also shows entrance fees, facilities, and lets you tap to call them."

### Slide 7: Near Me and Directions
> "If you tap 'Near Me', it finds your location and shows which spots are closest to you in kilometers. Tapping 'Get Directions' draws a blue line along the real roads and shows how many minutes it takes to get there."

### Slide 8: 360-Degree Photos
> "We also added 360-degree photos for major spots. You can drag your finger on the screen to look all around the area before deciding to go."

### Slide 9: Offline Mode
> "The most important part is the offline feature. When you visit the site while online, it saves the map and photos to your phone. When you go up the mountains and lose signal, the map and details still load and work normally."

### Slide 10: Ratings and Feedback
> "Visitors can leave a 1 to 5 star rating without needing an account. There is also a feedback form where people can send messages and upload up to three photos to report updates or trail conditions."

### Slide 11: Conclusion
> "To conclude, ExploQR shows how a simple website can make exploring our city much easier. In the future, we recommend putting printed QR codes on signs at each spot so anyone can scan them on site. Thank you, and we are ready for your questions."
