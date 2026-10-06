# Tara Royal 👑

A polished Expo/React Native starter for the Tara Royal virtual-Coins app, designed from the supplied dark + gold reference direction.

## Included

- Dark luxury / gold Tara Royal UI
- Tap-to-earn interaction (+2 virtual Coins per tap)
- Animated tap feedback
- Haptics
- Daily reward + streak UI
- Achievements
- Rankings
- Referral-code UI
- Supabase authentication + persistent session
- Supabase SQL schema with secure RPCs for taps and daily rewards
- EAS Android APK/AAB + iOS build profiles

## 1. Install

```bash
npm install
```

Copy `.env.example` to `.env` and set:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## 2. Configure Supabase

Create a Supabase project, open SQL Editor, and run:

`supabase/schema.sql`

The schema creates profiles, achievements, daily claims, referrals, RLS policies, a user trigger, and server-side RPCs.

## 3. Run

```bash
npx expo start
```

Then open with Expo Go or a development build.

## 4. EAS builds

Install/login to EAS:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Replace the placeholder project ID in `app.json` after `eas init`.

Preview Android APK:

```bash
eas build --platform android --profile preview
```

Production Android AAB:

```bash
eas build --platform android --profile production
```

Production iOS:

```bash
eas build --platform ios --profile production
```

## Notes

This starter intentionally treats Coins as virtual, non-cash rewards. No real-money deposits, gambling, cash-out, or wagering flow is implemented.

`assets/reference-home.png` is the image supplied in the conversation and is included only as a design reference; it is not used as a runtime casino asset.
