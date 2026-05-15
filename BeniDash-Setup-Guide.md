# BeniDash — Complete Setup Guide
## For: Manoj's Brother in Beni, Myagdi
## Goal: Go LIVE Tomorrow! 🚀

---

## WHAT YOU NEED BEFORE STARTING
- [ ] Laptop or computer
- [ ] Internet connection (ConnectBeni or mobile data)
- [ ] Gmail account (for Firebase)
- [ ] Nepal phone number (+977)
- [ ] 2-3 hours of time

---

## STEP 1 — Install Tools on Laptop (15 minutes)

### 1a. Install Node.js
1. Go to: https://nodejs.org
2. Click "LTS" version (green button)
3. Download and install
4. Open Command Prompt and type:
   ```
   node --version
   ```
   You should see: v18.xx.xx ✅

### 1b. Install VS Code (code editor)
1. Go to: https://code.visualstudio.com
2. Download and install
3. Open VS Code ✅

### 1c. Install Firebase Tools
Open Command Prompt and type:
```
npm install -g firebase-tools
```
Wait for it to finish ✅

---

## STEP 2 — Create Firebase Project (10 minutes)

### 2a. Go to Firebase Console
1. Open browser
2. Go to: https://console.firebase.google.com
3. Sign in with Gmail

### 2b. Create New Project
1. Click "Add Project" (blue button)
2. Project name: **benidash-nepal**
3. Click Continue
4. Disable Google Analytics (not needed yet)
5. Click "Create Project"
6. Wait 30 seconds... Click Continue ✅

### 2c. Enable Phone Authentication
1. Left menu → Authentication → Get Started
2. Click "Sign-in method" tab
3. Find "Phone" → Click it
4. Toggle "Enable" → ON
5. Click Save ✅

### 2d. Create Firestore Database
1. Left menu → Firestore Database → Create Database
2. Select "Start in test mode" (for now)
3. Choose location: **asia-south1** (Mumbai — closest to Nepal)
4. Click Done ✅

### 2e. Get Your Config Keys
1. Click ⚙️ gear icon (top left) → Project Settings
2. Scroll down to "Your apps"
3. Click </> (Web icon)
4. App nickname: **benidash-web**
5. Click "Register app"
6. You will see code like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "benidash-nepal.firebaseapp.com",
     projectId: "benidash-nepal",
     ...
   };
   ```
7. **COPY ALL OF THIS** — you need it in Step 4 ✅

---

## STEP 3 — Download and Setup App Files (10 minutes)

### 3a. Create project folder
Open Command Prompt:
```
mkdir benidash
cd benidash
npx create-react-app .
```
Wait 2-3 minutes for it to install ✅

### 3b. Install Firebase
```
npm install firebase leaflet react-leaflet
```
Wait for install ✅

### 3c. Copy App Files
Copy these files from Manoj's files into the **src** folder:
- BeniDash-CustomerApp → rename to **CustomerApp.jsx**
- BeniDash-DriverApp → rename to **DriverApp.jsx**
- BeniDash-RestaurantApp → rename to **RestaurantApp.jsx**
- BeniDash-Firebase-Backend.js → rename to **firebase-backend.js**

---

## STEP 4 — Add Your Firebase Keys (5 minutes)

### 4a. Create .env file
In your benidash folder, create a file called **.env**
(just ".env" — no other name)

Paste this inside and replace with YOUR keys from Step 2e:
```
REACT_APP_FIREBASE_API_KEY=paste_your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=benidash-nepal.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=benidash-nepal
REACT_APP_FIREBASE_STORAGE_BUCKET=benidash-nepal.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=paste_your_sender_id_here
REACT_APP_FIREBASE_APP_ID=paste_your_app_id_here
```

### 4b. Create firebase-config.js in src folder
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
```
Save the file ✅

---

## STEP 5 — Add Security Rules (5 minutes)

### 5a. Go to Firestore Rules
1. Firebase Console → Firestore Database → Rules tab
2. Delete everything there
3. Copy the security rules from BeniDash-Firebase-Backend.js
   (the big block that starts with `rules_version = '2';`)
4. Paste it in
5. Click "Publish" ✅

---

## STEP 6 — Test Locally (10 minutes)

### 6a. Start the app
```
npm start
```
Browser opens automatically at http://localhost:3000

### 6b. Test these things:
- [ ] App loads without errors
- [ ] Can browse restaurants
- [ ] Can add items to cart
- [ ] Place a test order
- [ ] Check Firebase Console → Firestore
  → You should see the order appear! ✅

---

## STEP 7 — Add First Restaurant Data (15 minutes)

### 7a. Add Beni Kitchen to database
1. Firebase Console → Firestore → Start Collection
2. Collection ID: **restaurants**
3. Auto-ID
4. Add these fields:
```
name:        "Beni Kitchen"
nameNp:      "बेनी किचेन"
phone:       "+977984XXXXXXX"  ← real restaurant phone
address:     "Beni Bazaar Main Road"
lat:         28.3462
lng:         83.5350
isOpen:      false (restaurant turns ON themselves)
rating:      0
totalOrders: 0
ownerId:     "temp" (update after restaurant logs in)
```
5. Click Save ✅

### 7b. Add menu items
Collection: **menu_items**
```
restaurantId: "the-id-firebase-gave-the-restaurant"
name:         "Dal Bhat Tarkari"
nameNp:       "दाल भात तरकारी"
price:        180
emoji:        "🍛"
category:     "Main"
isAvailable:  true
```
Add all menu items for each restaurant ✅

---

## STEP 8 — Deploy to Internet (20 minutes)

### 8a. Build the app
```
npm run build
```
Wait 2-3 minutes ✅

### 8b. Deploy to Vercel (FREE hosting)
1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Upload your build folder
5. Add Environment Variables (same as .env file)
6. Click Deploy
7. You get a URL like: **benidash-nepal.vercel.app** ✅

### 8c. Share this URL with:
- Your riders (for Driver App)
- Restaurants (for Restaurant App)
- Customers (for Customer App)

---

## STEP 9 — Add Riders to Database (10 minutes)

For each rider that Manoj calls:
1. Firebase Console → Firestore → riders collection
2. Add new document:
```
name:       "Ram Rider"
phone:      "+977984XXXXXXX"
vehicle:    "Honda CB Shine"
plate:      "BA 17 XXXX"
isOnline:   false
isVerified: true
rating:     5.0
earnings:   { today: 0, week: 0 }
```
3. Give rider the Driver App URL ✅

---

## STEP 10 — GO LIVE! 🚀

### Launch checklist:
- [ ] Firebase project created ✅
- [ ] Security rules published ✅
- [ ] At least 2 restaurants added ✅
- [ ] Menu items added ✅
- [ ] At least 3 riders registered ✅
- [ ] App deployed on Vercel ✅
- [ ] Test order placed and received ✅
- [ ] Restaurants can see orders ✅
- [ ] Riders can accept deliveries ✅

### Tell Manoj:
- Dad posts on Facebook: "BeniDash is LIVE in Beni! 🛵"
- Manoj calls restaurants: "We are live, turn ON your app"
- Riders go online in Driver App
- First order arrives... 🎉

---

## COST BREAKDOWN

| Service | Cost |
|---------|------|
| Firebase (Spark Plan) | FREE up to 50K reads/day |
| Vercel Hosting | FREE |
| Domain (optional) | NPR 1,500/year |
| **Total to launch** | **NPR 0 — FREE!** |

Firebase free tier is enough for:
- Up to 100 orders per day
- 50+ active users
- All 3 apps running
- Real-time everything

---

## IF SOMETHING GOES WRONG

### App won't start:
```
rm -rf node_modules
npm install
npm start
```

### Firebase error:
- Check .env file has correct keys
- Check Firebase Console for error logs

### Orders not showing in restaurant app:
- Check Firestore Rules are published
- Check restaurant ID matches in database

### Contact for help:
- WhatsApp Manoj immediately
- Screenshot the error message
- He will help from Texas!

---

## SECURITY REMINDERS 🔒

1. NEVER share .env file with anyone
2. NEVER post .env on Facebook or WhatsApp
3. NEVER upload .env to GitHub
4. Change Firebase rules from "test mode"
   to the security rules in Step 5
   before going live!
5. If you suspect security issue:
   Firebase Console → Project Settings
   → Regenerate API keys

---

## YOU DID IT DAI! 🎉
## BeniDash is LIVE in Beni, Myagdi!
## Har Har Mahadev! 🙏🇳🇵
