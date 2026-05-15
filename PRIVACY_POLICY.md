# Privacy Policy — NutriBot

**Last updated:** May 13, 2026

> **Important:** This document was drafted to reflect how the NutriBot mobile app is built in this repository. It is **not legal advice**. Have a qualified professional review it before you publish it, especially if you operate in the EU/UK, serve children, or handle health-related data under local rules.

**Data controller / operator:** Anurag Nagare (individual developer)  
**Contact for privacy questions:** anuragnagare77@gmail.com  
**App name:** NutriBot  
**Platform:** Android (and any other platforms you distribute)

---

## 1. Summary

NutriBot helps you log meals, get AI-style nutrition insights, chat with a nutrition assistant, and access optional features such as deals and subscriptions. This policy describes what information the app may collect, how it is used, and which services are involved.

---

## 2. Information we collect

### 2.1 Account information (Supabase)

When you create an account, we process:

- **Email address** and **password** (authentication is handled by Supabase Auth; we do not store your password in plain text on our servers in a form we can read).
- **Name** and related profile fields stored in our user database.
- **Subscription status** (for example whether you have an active Pro subscription) and **usage statistics** used to enforce plan limits (such as scan counts and related dates).

### 2.2 Meal photos and nutrition analysis

If you use the camera or photo library to analyze a meal:

- **Images** (or encoded image data) and optional **profile-related context** you choose to send (for example height, weight, age, or BMI used for analysis) may be sent to **our backend API** to generate nutrition estimates and related output.
- **Analysis results** (nutrition breakdowns, scores, and related structured data) and associated metadata may be stored in your **meal history** in our database so you can view past scans in the app.

Images may show food, drinks, labels, and incidental background; avoid capturing sensitive documents or people if you do not want that content transmitted.

### 2.3 NutriBot chat

If you use in-app chat:

- **Messages you send**, **recent chat context** you allow the app to include, and optional **wellness-related context** (such as name, age, weight, height, or BMI if the app attaches it) may be sent to our **backend chat service** to generate a reply.

### 2.4 Location for deals (city or area)

If you use features that fetch food deals, the app may send a **location string** you provide (for example a city name) to our backend to return relevant offers. This is not continuous GPS tracking in the current app design unless you change the product to do so.

### 2.5 Purchases (Google Play)

If you subscribe through **Google Play Billing**:

- Purchase flows are handled by **Google**. We receive information needed to confirm entitlement (such as product identifiers and subscription state through the billing APIs) and may update your **premium status** in our database accordingly.

### 2.6 Push notifications (Expo)

On supported builds, the app may request permission to send notifications and obtain a **push token** through **Expo’s push notification service** so that remote notifications can be delivered if you enable them. Whether and how that token is stored on your own servers is your operational choice; update this section if you persist tokens.

### 2.7 Data stored only on your device

Certain information may be kept **locally on your phone** (for example cached deal results or wellness profile fields you enter in onboarding), using the device’s storage mechanisms. It is not uploaded unless a feature you implement sends it.

---

## 3. How we use information

We use the information above to:

- Provide, maintain, and improve NutriBot features (analysis, history, chat, deals, subscriptions).
- Authenticate you and protect your account.
- Enforce usage limits and subscription entitlements.
- Send optional notifications you consent to.

We do **not** sell your personal information. We do not use your data for third-party advertising **unless** you add advertising SDKs or analytics; if you do, you must update this policy and Play’s **Data safety** section.

---

## 4. Legal bases (if you have users in the EEA/UK)

Where GDPR applies, we rely on one or more of: **contract** (providing the service you asked for), **legitimate interests** (security, abuse prevention, product improvement), and **consent** (for example camera, photos, notifications, where required). You may need to tailor this with your counsel.

---

## 5. Sharing with service providers

We use subprocessors that process data on our behalf, including:

| Category | Provider (as implemented in the app) | Role |
|----------|--------------------------------------|------|
| Authentication & database | **Supabase** | Account sign-in, user profile data, meal history storage |
| Application backend | **Our API** (hosted example: `nutribot-backend-kappa.vercel.app`) | Meal analysis, chat responses, deals content |
| App distribution & billing | **Google Play** | App install and in-app purchases |
| Push infrastructure (if used) | **Expo** | Push token / notification delivery infrastructure |

Each provider has its own privacy policy; we encourage you to read them.

---

## 6. Retention and deletion

- We retain account and history data **as long as your account is active** and as needed to provide the service, unless a longer period is required by law.
- You may **delete your account in the app** (Profile → Delete Account), which removes your authentication account, profile, and meal history from our systems, or contact **anuragnagare77@gmail.com** for assistance.

---

## 7. Security

We use industry-standard measures appropriate to the risk (such as encrypted transport **HTTPS**, and access controls on backend and database resources). No method of transmission or storage is 100% secure.

---

## 8. Children’s privacy

NutriBot is **not intended for children under 13** (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have, contact **anuragnagare77@gmail.com** and we will delete it.

---

## 9. International transfers

Your information may be processed in countries where our providers host data (for example the United States or regions offered by Supabase/Vercel/Google). We use providers and safeguards appropriate to those transfers as required by applicable law.

---

## 10. Your rights

Depending on where you live, you may have rights to **access**, **correct**, **delete**, **export**, or **restrict** processing of your personal data, and to **object** to certain processing. Contact **anuragnagare77@gmail.com** to exercise these rights. You may also lodge a complaint with your local data protection authority.

---

## 11. Changes to this policy

We may update this policy from time to time. We will post the new version at the same URL and update the “Last updated” date. If changes are material, we will provide additional notice as required by law (for example an in-app notice).

---

## 12. Contact

**Anurag Nagare** (individual developer)  
Email: **anuragnagare77@gmail.com**

---

## Technical reference (for your own records — optional to publish)

This section helps you keep the public policy aligned with the codebase. You may remove it from the public page if you prefer a shorter document.

- **Backend base URL (example in app):** `https://nutribot-backend-kappa.vercel.app` — endpoints include `/api/analyze`, `/api/chat`, `/api/deals`.
- **Database / auth:** Supabase project (URL configured in the app client).
- **Billing (Android):** `react-native-iap` with Google Play subscriptions.
- **Device permissions (Android):** may include **camera** and **storage / media** access for capturing or choosing meal photos, as declared in the app manifest.

If your legal name on government ID differs from the name above, update the “Data controller” and “Contact” lines to match Play Console and any registration you use.
