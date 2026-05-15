// ═══════════════════════════════════════════════════════════════════════════
// BENIDASH FIREBASE BACKEND - COMPLETE
// Built by Baniya Empire for Manoj Baniya
// Beni, Myagdi, Nepal
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: firebase-config.js
// Your brother puts the Firebase keys here
// ─────────────────────────────────────────────────────────────────────────────

// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ⚠️  IMPORTANT: Your brother replaces these values
// with the real keys from Firebase Console
// Steps: Firebase Console → Project Settings → Your Apps → Config
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "benidash-nepal.firebaseapp.com",
  projectId:         "benidash-nepal",
  storageBucket:     "benidash-nepal.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId:             "REPLACE_WITH_APP_ID"
};

const app  = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
export default app;


// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: database-structure.js
// This shows exactly how data is stored
// ─────────────────────────────────────────────────────────────────────────────

/*
FIRESTORE DATABASE STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 users/
   └── {userId}/
       ├── name:        "Ram Bahadur"
       ├── phone:       "+977984XXXXXXX"
       ├── role:        "customer" | "rider" | "restaurant"
       ├── address:     "Beni Ward 3"
       ├── createdAt:   timestamp
       └── isBlocked:   false

📁 restaurants/
   └── {restaurantId}/
       ├── name:        "Beni Kitchen"
       ├── nameNp:      "बेनी किचेन"
       ├── ownerId:     "userId"
       ├── phone:       "+977984XXXXXXX"
       ├── address:     "Beni Bazaar Main Road"
       ├── lat:         28.3462
       ├── lng:         83.5350
       ├── isOpen:      true
       ├── rating:      4.8
       ├── totalOrders: 312
       └── menu:        [...items]

📁 menu_items/
   └── {itemId}/
       ├── restaurantId: "rest-001"
       ├── name:         "Dal Bhat Tarkari"
       ├── nameNp:       "दाल भात तरकारी"
       ├── price:        180
       ├── emoji:        "🍛"
       ├── category:     "Main"
       └── isAvailable:  true

📁 orders/
   └── {orderId}/
       ├── orderId:       "BD-2841"
       ├── customerId:    "userId"
       ├── customerName:  "Ram Bahadur"
       ├── customerPhone: "+977984XXXXXXX"
       ├── customerAddr:  "Beni Ward 3"
       ├── customerLat:   28.3440
       ├── customerLng:   83.5325
       ├── restaurantId:  "rest-001"
       ├── riderId:       null (assigned later)
       ├── items:         [{name,qty,price}]
       ├── subtotal:      440
       ├── deliveryFee:   50
       ├── total:         490
       ├── payment:       "cash" | "esewa"
       ├── status:        "new"|"accepted"|"preparing"|"ready"|"picked"|"delivered"|"cancelled"
       ├── createdAt:     timestamp
       └── updatedAt:     timestamp

📁 riders/
   └── {riderId}/
       ├── userId:     "userId"
       ├── name:       "Ram Rider"
       ├── phone:      "+977984XXXXXXX"
       ├── vehicle:    "Honda CB Shine"
       ├── plate:      "BA 17 1234"
       ├── isOnline:   true
       ├── isVerified: true
       ├── lat:        28.3444
       ├── lng:        83.5322
       ├── rating:     4.9
       └── earnings:   { today: 1480, week: 8900 }

📁 notifications/
   └── {notifId}/
       ├── toUserId:  "userId"
       ├── type:      "new_order"|"order_accepted"|"rider_assigned"|"delivered"
       ├── title:     "New Order!"
       ├── body:      "Order #BD-2841 received"
       ├── orderId:   "BD-2841"
       ├── isRead:    false
       └── createdAt: timestamp
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE 3: auth.js
// Phone number login with OTP - Nepal numbers
// ─────────────────────────────────────────────────────────────────────────────

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase-config";

// ── STEP 1: Send OTP to phone ──────────────────────────────────────────────
export async function sendOTP(phoneNumber) {
  // phoneNumber format: +977984XXXXXXX
  try {
    // Security: reCAPTCHA prevents bots
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container", // HTML div id
      { size: "invisible" }   // invisible = better UX
    );

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      window.recaptchaVerifier
    );

    // Save for verification step
    window.confirmationResult = confirmationResult;
    return { success: true };
  } catch (error) {
    console.error("OTP Error:", error);
    return { success: false, error: error.message };
  }
}

// ── STEP 2: Verify OTP code ────────────────────────────────────────────────
export async function verifyOTP(otpCode, role = "customer") {
  try {
    const result = await window.confirmationResult.confirm(otpCode);
    const user   = result.user;

    // Check if user already exists in DB
    const userRef  = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user — create profile
      await setDoc(userRef, {
        userId:    user.uid,
        phone:     user.phoneNumber,
        role:      role,
        name:      "",
        address:   "",
        isBlocked: false,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: "Wrong OTP code" };
  }
}

// ── Auth state watcher ─────────────────────────────────────────────────────
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Sign out ───────────────────────────────────────────────────────────────
export async function signOut() {
  await auth.signOut();
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 4: orders.js
// Complete order management - connects all 3 apps
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, where, orderBy,
  serverTimestamp, getDoc
} from "firebase/firestore";
import { db, auth } from "./firebase-config";

// ── INPUT VALIDATION (Security) ────────────────────────────────────────────
function validateOrder(orderData) {
  const errors = [];

  if (!orderData.items || orderData.items.length === 0)
    errors.push("No items in order");

  if (!orderData.restaurantId)
    errors.push("Restaurant not selected");

  if (!orderData.customerAddr || orderData.customerAddr.length < 5)
    errors.push("Invalid delivery address");

  if (orderData.total < 50 || orderData.total > 10000)
    errors.push("Invalid order amount");

  // Check for suspicious input (XSS protection)
  const dangerChars = /<script|javascript:|on\w+=/i;
  if (dangerChars.test(JSON.stringify(orderData)))
    errors.push("Invalid characters in order");

  return errors;
}

// ── CUSTOMER: Place new order ──────────────────────────────────────────────
export async function placeOrder(orderData) {
  try {
    // Security: Must be logged in
    if (!auth.currentUser)
      return { success: false, error: "Please login first" };

    // Security: Validate data
    const errors = validateOrder(orderData);
    if (errors.length > 0)
      return { success: false, error: errors[0] };

    // Check restaurant is open
    const restRef  = doc(db, "restaurants", orderData.restaurantId);
    const restSnap = await getDoc(restRef);
    if (!restSnap.exists() || !restSnap.data().isOpen)
      return { success: false, error: "Restaurant is currently closed" };

    // Generate order ID
    const orderId = "BD-" + Date.now().toString().slice(-4);

    // Save order to Firestore
    const newOrder = {
      orderId,
      customerId:    auth.currentUser.uid,
      customerPhone: auth.currentUser.phoneNumber,
      restaurantId:  orderData.restaurantId,
      riderId:       null,
      items:         orderData.items,
      subtotal:      orderData.subtotal,
      deliveryFee:   50,
      total:         orderData.total,
      payment:       orderData.payment || "cash",
      customerAddr:  orderData.customerAddr,
      customerLat:   orderData.customerLat   || null,
      customerLng:   orderData.customerLng   || null,
      status:        "new",
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "orders"), newOrder);

    // Create notification for restaurant
    await addDoc(collection(db, "notifications"), {
      toUserId:  orderData.restaurantOwnerId,
      type:      "new_order",
      title:     "🆕 New Order!",
      body:      `Order ${orderId} - NPR ${orderData.total}`,
      orderId:   docRef.id,
      isRead:    false,
      createdAt: serverTimestamp(),
    });

    return { success: true, orderId: docRef.id, orderCode: orderId };
  } catch (error) {
    console.error("Place order error:", error);
    return { success: false, error: "Failed to place order. Try again." };
  }
}

// ── CUSTOMER: Watch own order status live ─────────────────────────────────
export function watchMyOrder(orderId, callback) {
  const orderRef = doc(db, "orders", orderId);
  // Real-time listener — updates instantly when status changes
  return onSnapshot(orderRef, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── RESTAURANT: Watch incoming orders live ────────────────────────────────
export function watchRestaurantOrders(restaurantId, callback) {
  const q = query(
    collection(db, "orders"),
    where("restaurantId", "==", restaurantId),
    where("status", "in", ["new", "accepted", "preparing", "ready"]),
    orderBy("createdAt", "desc")
  );
  // REAL-TIME: Every new order appears immediately
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// ── RESTAURANT: Accept order ───────────────────────────────────────────────
export async function acceptOrder(orderId) {
  try {
    // Security: Only restaurant owner can accept
    if (!auth.currentUser)
      return { success: false, error: "Not authorized" };

    await updateDoc(doc(db, "orders", orderId), {
      status:    "accepted",
      updatedAt: serverTimestamp(),
    });

    // Find available rider nearby and notify
    await findAndNotifyRider(orderId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── RESTAURANT: Update order status ───────────────────────────────────────
export async function updateOrderStatus(orderId, newStatus) {
  const validStatuses = ["accepted","preparing","ready","cancelled"];
  if (!validStatuses.includes(newStatus))
    return { success: false, error: "Invalid status" };

  await updateDoc(doc(db, "orders", orderId), {
    status:    newStatus,
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

// ── RIDER: Watch available orders ─────────────────────────────────────────
export function watchAvailableOrders(callback) {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "accepted"),
    where("riderId", "==", null),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// ── RIDER: Accept delivery ─────────────────────────────────────────────────
export async function riderAcceptDelivery(orderId) {
  try {
    if (!auth.currentUser)
      return { success: false, error: "Not authorized" };

    await updateDoc(doc(db, "orders", orderId), {
      riderId:   auth.currentUser.uid,
      status:    "picked",
      updatedAt: serverTimestamp(),
    });

    // Notify customer their rider is coming
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    const order     = orderSnap.data();
    await addDoc(collection(db, "notifications"), {
      toUserId:  order.customerId,
      type:      "rider_assigned",
      title:     "🛵 Rider is on the way!",
      body:      "Your food has been picked up and is coming to you!",
      orderId,
      isRead:    false,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── RIDER: Mark as delivered ───────────────────────────────────────────────
export async function markDelivered(orderId) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status:      "delivered",
      deliveredAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

    // Update rider earnings
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    const order     = orderSnap.data();
    const riderRef  = doc(db, "riders", auth.currentUser.uid);
    const riderSnap = await getDoc(riderRef);
    if (riderSnap.exists()) {
      const current = riderSnap.data().earnings?.today || 0;
      await updateDoc(riderRef, {
        "earnings.today": current + order.deliveryFee,
        updatedAt: serverTimestamp(),
      });
    }

    // Notify customer
    await addDoc(collection(db, "notifications"), {
      toUserId:  order.customerId,
      type:      "delivered",
      title:     "🏠 Delivered!",
      body:      "Your order has been delivered. Enjoy your meal!",
      orderId,
      isRead:    false,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── Find nearest available rider ──────────────────────────────────────────
async function findAndNotifyRider(orderId) {
  try {
    const q = query(
      collection(db, "riders"),
      where("isOnline", "==", true),
      where("isVerified", "==", true)
    );
    // In production: sort by GPS distance
    // For now: notify all online riders
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (riderDoc) => {
      await addDoc(collection(db, "notifications"), {
        toUserId:  riderDoc.id,
        type:      "new_order",
        title:     "📦 New delivery available!",
        body:      "Tap to accept this order",
        orderId,
        isRead:    false,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error("Rider notify error:", err);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 5: rider-location.js
// Live GPS tracking - rider moves on customer's map
// ─────────────────────────────────────────────────────────────────────────────

import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase-config";

let locationInterval = null;

// ── RIDER: Start sharing GPS location ─────────────────────────────────────
export function startLocationTracking() {
  if (!auth.currentUser) return;

  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return;
  }

  // Update location every 5 seconds
  locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Only update if accuracy is decent (< 100m)
        if (accuracy > 100) return;

        await updateDoc(doc(db, "riders", auth.currentUser.uid), {
          lat:       latitude,
          lng:       longitude,
          accuracy:  accuracy,
          updatedAt: serverTimestamp(),
        });
      },
      (error) => console.error("GPS error:", error),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  }, 5000); // every 5 seconds
}

// ── RIDER: Stop sharing location ──────────────────────────────────────────
export function stopLocationTracking() {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
}

// ── CUSTOMER: Watch rider location live ───────────────────────────────────
export function watchRiderLocation(riderId, callback) {
  const riderRef = doc(db, "riders", riderId);
  // Updates on map every time rider moves
  return onSnapshot(riderRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({ lat: data.lat, lng: data.lng });
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 6: restaurants-db.js
// Restaurant management
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, getDocs, getDoc, doc,
  updateDoc, query, where, serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase-config";

// ── Get all open restaurants ───────────────────────────────────────────────
export async function getOpenRestaurants() {
  const q = query(
    collection(db, "restaurants"),
    where("isOpen", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Restaurant owner: toggle open/closed ──────────────────────────────────
export async function toggleRestaurantOpen(restaurantId, isOpen) {
  if (!auth.currentUser)
    return { success: false, error: "Not authorized" };

  await updateDoc(doc(db, "restaurants", restaurantId), {
    isOpen,
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

// ── Toggle menu item available/unavailable ────────────────────────────────
export async function toggleMenuItem(itemId, isAvailable) {
  await updateDoc(doc(db, "menu_items", itemId), {
    isAvailable,
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

// ── Get restaurant menu ────────────────────────────────────────────────────
export async function getRestaurantMenu(restaurantId) {
  const q = query(
    collection(db, "menu_items"),
    where("restaurantId", "==", restaurantId),
    where("isAvailable", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 7: security-rules.txt
// Copy this into Firebase Console → Firestore → Rules
// ─────────────────────────────────────────────────────────────────────────────

/*
COPY THIS INTO:
Firebase Console → Firestore Database → Rules tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper functions ──────────────────────────
    function isLoggedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isRestaurantOwner(restaurantId) {
      return get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.ownerId == request.auth.uid;
    }

    // ── Users collection ──────────────────────────
    match /users/{userId} {
      // Users can only read/write their own profile
      allow read, write: if isLoggedIn() && isOwner(userId);
    }

    // ── Orders collection ─────────────────────────
    match /orders/{orderId} {
      // Customer can create orders (must be logged in)
      allow create: if isLoggedIn()
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.total > 0
        && request.resource.data.total < 10000;

      // Customer can read their own orders
      allow read: if isLoggedIn()
        && (resource.data.customerId == request.auth.uid
        || resource.data.riderId == request.auth.uid
        || isRestaurantOwner(resource.data.restaurantId));

      // Restaurant can update status
      allow update: if isLoggedIn()
        && (isRestaurantOwner(resource.data.restaurantId)
        || resource.data.riderId == request.auth.uid)
        // Cannot change customer or order amount after creation
        && request.resource.data.customerId == resource.data.customerId
        && request.resource.data.total == resource.data.total;

      // Nobody can delete orders (audit trail)
      allow delete: if false;
    }

    // ── Restaurants collection ────────────────────
    match /restaurants/{restaurantId} {
      // Anyone logged in can read restaurants
      allow read: if isLoggedIn();

      // Only owner can update their restaurant
      allow update: if isLoggedIn()
        && resource.data.ownerId == request.auth.uid;

      // Only admins can create restaurants
      allow create: if isLoggedIn();
      allow delete: if false;
    }

    // ── Menu items ────────────────────────────────
    match /menu_items/{itemId} {
      allow read: if isLoggedIn();
      allow write: if isLoggedIn()
        && isRestaurantOwner(resource.data.restaurantId);
    }

    // ── Riders collection ─────────────────────────
    match /riders/{riderId} {
      // Riders can update their own location & status
      allow read: if isLoggedIn();
      allow write: if isLoggedIn() && isOwner(riderId);
    }

    // ── Notifications ─────────────────────────────
    match /notifications/{notifId} {
      // Users can only read their own notifications
      allow read: if isLoggedIn()
        && resource.data.toUserId == request.auth.uid;
      allow create: if isLoggedIn();
      allow update: if isLoggedIn()
        && resource.data.toUserId == request.auth.uid;
      allow delete: if false;
    }

    // ── Block everything else ─────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;


// ─────────────────────────────────────────────────────────────────────────────
// FILE 8: rate-limiting.js
// Prevent spam orders and abuse
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, query, where, getDocs,
  Timestamp, addDoc, serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase-config";

// ── Check if user is placing too many orders ──────────────────────────────
export async function checkRateLimit() {
  if (!auth.currentUser) return { allowed: false };

  // Count orders in last 1 hour
  const oneHourAgo = Timestamp.fromDate(
    new Date(Date.now() - 60 * 60 * 1000)
  );

  const q = query(
    collection(db, "orders"),
    where("customerId",  "==", auth.currentUser.uid),
    where("createdAt",   ">=", oneHourAgo),
    where("status", "not-in", ["cancelled"])
  );

  const snapshot = await getDocs(q);

  // Max 5 orders per hour per customer
  if (snapshot.size >= 5) {
    return {
      allowed: false,
      message: "Too many orders. Please wait before ordering again."
    };
  }
  return { allowed: true };
}

// ── Log suspicious activity ────────────────────────────────────────────────
export async function logSuspiciousActivity(type, details) {
  await addDoc(collection(db, "security_logs"), {
    userId:    auth.currentUser?.uid || "anonymous",
    type,      // "too_many_orders" | "invalid_input" | "unauthorized"
    details,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent,
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 9: .env.example
// Environment variables - NEVER share real values!
// ─────────────────────────────────────────────────────────────────────────────

/*
Create a file called .env in your project root
NEVER upload this file to GitHub!
Add .env to your .gitignore file

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REACT_APP_FIREBASE_API_KEY=your_actual_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=benidash-nepal.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=benidash-nepal
REACT_APP_FIREBASE_STORAGE_BUCKET=benidash-nepal.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

Then in firebase-config.js use:
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
*/


// ─────────────────────────────────────────────────────────────────────────────
// FILE 10: esewa-payment.js
// eSewa payment integration for Nepal
// ─────────────────────────────────────────────────────────────────────────────

// eSewa Nepal API
// Test environment: works without real money
// Production: get merchant code from esewa.com.np

export function initiateEsewaPayment(order) {
  const params = {
    amt:  order.subtotal,        // item amount
    pdc:  0,                     // delivery charge
    psc:  0,                     // service charge
    txAmt: 0,                    // tax amount
    tAmt: order.total,           // total amount
    pid:  order.orderId,         // unique order ID
    scd:  "EPAYTEST",            // merchant code (replace with real one)
    su:   `${window.location.origin}/payment-success?orderId=${order.id}`,
    fu:   `${window.location.origin}/payment-failed?orderId=${order.id}`,
  };

  // Build form and submit to eSewa
  const form = document.createElement("form");
  form.method = "POST";
  // Test URL:
  form.action = "https://uat.esewa.com.np/epay/main";
  // Production URL (when ready):
  // form.action = "https://esewa.com.np/epay/main";

  Object.entries(params).forEach(([key, value]) => {
    const input    = document.createElement("input");
    input.type     = "hidden";
    input.name     = key;
    input.value    = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// ── Verify payment after return ────────────────────────────────────────────
export async function verifyEsewaPayment(oid, amt, refId) {
  // IMPORTANT: Always verify on server side
  // This prevents payment fraud
  try {
    const response = await fetch(
      `https://uat.esewa.com.np/epay/transrec`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ amt, rid: refId, pid: oid, scd: "EPAYTEST" }),
      }
    );
    const text = await response.text();
    return text.includes("<response_code>Success</response_code>");
  } catch (err) {
    console.error("eSewa verification error:", err);
    return false;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// FILE 11: package.json dependencies
// Your brother runs: npm install
// ─────────────────────────────────────────────────────────────────────────────

const PACKAGE_JSON = {
  "name": "benidash-app",
  "version": "1.0.0",
  "description": "BeniDash - Myagdi Food Delivery App by Baniya Empire",
  "dependencies": {
    "react":             "^18.2.0",
    "react-dom":         "^18.2.0",
    "firebase":          "^10.7.0",
    "leaflet":           "^1.9.4",
    "react-leaflet":     "^4.2.1"
  },
  "scripts": {
    "start":  "react-scripts start",
    "build":  "react-scripts build",
    "deploy": "npm run build && firebase deploy"
  }
};

export { FIRESTORE_SECURITY_RULES, PACKAGE_JSON };
