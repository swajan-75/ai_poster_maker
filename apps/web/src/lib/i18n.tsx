'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { LOCALE_COOKIE, parseLocale, type Locale } from './locale';

export type { Locale };

const LEGACY_STORAGE_KEY = 'poster-maker-locale';

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
const bnNum = (n: number | bigint) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]!);

let currentLocale: Locale = 'bn';
const listeners = new Set<(l: Locale) => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  writeLocaleCookie(locale);
  listeners.forEach((fn) => fn(locale));
}

const dict = {
  bn: {
    common: { appName: 'পোস্টার মেকার', templates: 'টেমপ্লেট', myPosters: 'আমার পোস্টার', admin: 'অ্যাডমিন', pricing: 'প্যাকেজ', login: 'লগইন', logout: 'লগআউট', retry: 'আবার চেষ্টা', switchToLabel: 'English', photoCount: (n: number) => `${bnNum(n)}টি ছবি` },
    auth: {
      pitch: 'আপনার প্রচারণার পোস্টার, মিনিটেই।', pitchSub: 'টেমপ্লেট, AI ডিজাইন আর প্রিন্ট-মানের ডাউনলোড — সব এক জায়গায়।',
      newAccountTitle: 'নতুন অ্যাকাউন্ট', loginTitle: 'লগইন', name: 'নাম', email: 'ইমেইল', password: 'পাসওয়ার্ড',
      createAccount: 'অ্যাকাউন্ট খুলুন', loginButton: 'লগইন', haveAccount: 'আগেই অ্যাকাউন্ট আছে?', noAccount: 'অ্যাকাউন্ট নেই?',
      loginLink: 'লগইন', registerLink: 'নতুন খুলুন',
    },
    occasion: { all: 'সব', victory_day: 'বিজয় দিবস', mourning: 'শোক/স্মরণ', election: 'নির্বাচনী প্রচার', greetings: 'শুভেচ্ছা', festival: 'ঈদ/উৎসব' },
    templatesPage: {
      title: 'টেমপ্লেট বেছে নিন', emptyForOccasion: 'এই উপলক্ষে এখনো কোনো টেমপ্লেট নেই।',
      eyebrow: 'AI দিয়ে পোস্টার ডিজাইন', heroA: 'মিনিটেই তৈরি করুন', heroB: 'প্রিন্ট-রেডি পোস্টার',
      heroSub: 'টেমপ্লেট বাছুন, নাম আর ছবি দিন — ডিজাইনের বাকি কাজ AI করবে।', cta: 'টেমপ্লেট দেখুন',
      steps: ['টেমপ্লেট বাছুন', 'তথ্য ও ছবি দিন', 'ডাউনলোড করুন'],
    },
    footer: { tagline: 'বাংলায় পোস্টার, এক ক্লিকে।' },
    historyPage: { title: 'আমার পোস্টার', count: (n: number) => `মোট ${bnNum(n)}টি পোস্টার`, empty: 'এখনো কোনো পোস্টার নেই।', createFirst: 'প্রথম পোস্টার তৈরি করুন', prev: 'আগের', next: 'পরের', pagination: 'পাতা' },
    createPage: { title: 'পোস্টারের তথ্য দিন', livePreview: 'লাইভ প্রিভিউ', previewNote: 'আনুমানিক প্রিভিউ — চূড়ান্ত ডিজাইন AI তৈরি করবে', back: 'সব টেমপ্লেট' },
    posterForm: {
      headline: 'শিরোনাম', headlineHint: 'যেমন: মহান বিজয় দিবস', tagline: 'স্লোগান (ঐচ্ছিক)',
      taglineHint: 'খালি রাখলে AI একটি উপযুক্ত স্লোগান প্রস্তাব করবে', name: 'নাম', designation: 'পদবি',
      organization: 'দল / সংগঠন', union: 'ইউনিয়ন / ওয়ার্ড (ঐচ্ছিক)', thana: 'থানা / উপজেলা (ঐচ্ছিক)', district: 'জেলা',
      photosLabel: (max: number) => `ছবি (সর্বোচ্চ ${bnNum(max)}টি)`,
      photoError: 'কমপক্ষে ১টি ছবি দিন', submitting: 'পাঠানো হচ্ছে…', submit: 'পোস্টার তৈরি করুন',
      ballot: {
        section: 'নির্বাচনী তথ্য', headlineHint: 'যেমন: আসন্ন ৫নং গোয়ালাবাজার ইউনিয়ন পরিষদ নির্বাচনে',
        designationHint: 'যেমন: চেয়ারম্যান পদপ্রার্থী / ১নং ওয়ার্ডের কাউন্সিলর পদে', organizationHint: 'নামের সাথে ছোট লাইন — যেমন: সাবেক সফল চেয়ারম্যান',
        taglineHint: 'যেমন: সৎ, নির্ভীক, তরুণ সমাজসেবক',
        topLine: 'উপরের লাইন (ঐচ্ছিক)', topLineHint: 'যেমন: বিসমিল্লাহির রাহমানির রাহিম',
        electionDate: 'নির্বাচনের তারিখ (ঐচ্ছিক)', electionDateHint: 'যেমন: ০৫ জানুয়ারি ২০২৭ ইং, রোজঃ মঙ্গলবার',
        symbol: 'প্রতীক / মার্কা (ঐচ্ছিক)', symbolHint: 'শুধু নাম লিখুন, যেমন: নৌকা — পোস্টারে "নৌকা মার্কায়" লেখা হবে',
        appeal: 'ভোটের আবেদন (ঐচ্ছিক)', appealHint: 'খালি রাখলে: আপনার মূল্যবান ভোট দিয়ে জনগণের সেবা করার সুযোগ দিন।',
        campaignBy: 'প্রচারে (ঐচ্ছিক)', campaignByHint: 'খালি রাখলে ইউনিয়নের নাম থেকে "…বাসী" লেখা হবে',
        photoRoles: (max: number): string => max >= 3 ? '১ম ছবি: প্রার্থী · ২য়: মার্কার ছবি · ৩য়: দলীয় নেতা (ঐচ্ছিক)' : '১ম ছবি: প্রার্থী · ২য়: মার্কার ছবি (ঐচ্ছিক)',
      },
    },
    photoUploader: {
      primary: 'প্রধান', uploading: 'আপলোড হচ্ছে', dropHint: 'টেনে এনে ছাড়ুন বা ক্লিক করুন', hint: 'প্রথম ছবিটি প্রধান হিসেবে বড় করে দেখানো হবে। শুধু নিজের বা অনুমতিপ্রাপ্ত ছবি ব্যবহার করুন।',
      addPhotoLabel: (count: number, max: number) => `ছবি যোগ করুন (${bnNum(count)}/${bnNum(max)})`,
      photoAlt: (n: number) => `ছবি ${bnNum(n)}`, removeAlt: (n: number) => `ছবি ${bnNum(n)} সরান`,
    },
    regenerate: { title: 'লেখা পরিবর্তন করে আবার তৈরি করুন', remaining: (n: number) => `আর ${bnNum(n)} বার পুনরায় তৈরি করা যাবে। একই লেখায় আবার চাপলে নতুন ডিজাইন আসবে।`, submit: 'আবার তৈরি করুন' },
    statusBadge: { queued: 'অপেক্ষমাণ', generating: 'তৈরি হচ্ছে', completed: 'সম্পন্ন', failed: 'ব্যর্থ' },
    posterCard: { download: 'ডাউনলোড', delete: 'মুছুন', confirmDelete: 'পোস্টারটি মুছে ফেলবেন?' },
    posterDetail: {
      generatingMessage: 'পোস্টার তৈরি হচ্ছে… সাধারণত ২০–৪০ সেকেন্ড লাগে', downloadPng: 'PNG ডাউনলোড (প্রিন্ট)', downloadJpg: 'JPG ডাউনলোড',
      failedMessage: 'পোস্টার তৈরি করা যায়নি। আবার চেষ্টা করুন।', retry: 'আবার চেষ্টা করুন', createAnother: 'আরেকটি পোস্টার তৈরি করুন',
      allPosters: 'আমার সব পোস্টার', notFound: 'পোস্টারটি পাওয়া যায়নি।',
    },
    admin: {
      pageTitle: 'অ্যাডমিন প্যানেল', analyticsTab: 'পরিসংখ্যান', templatesTab: 'টেমপ্লেট', postersTab: 'পোস্টার', usersTab: 'ব্যবহারকারী',
      newTemplate: 'নতুন টেমপ্লেট', editTemplate: 'টেমপ্লেট সম্পাদনা', backToList: 'তালিকায় ফিরুন',
      active: 'সচল', inactive: 'নিষ্ক্রিয়', deactivate: 'নিষ্ক্রিয় করুন', confirmDeactivate: 'এই টেমপ্লেটটি নিষ্ক্রিয় করবেন?',
      slug: 'স্লাগ', title: 'শিরোনাম', occasion: 'উপলক্ষ', layoutKey: 'লেআউট', photoSlots: 'ছবির সংখ্যা',
      thumbnailUrl: 'থাম্বনেইল URL', defaultHeadline: 'ডিফল্ট শিরোনাম', palettes: 'রঙের প্যালেট', motifs: 'মোটিফ',
      addPalette: 'প্যালেট যোগ করুন', removePalette: 'প্যালেট সরান', paletteName: 'নাম',
      defaultDesign: 'ডিফল্ট ডিজাইন', paletteId: 'প্যালেট', motif: 'মোটিফ', headlineFont: 'ফন্ট', headlineScale: 'স্কেল',
      save: 'সংরক্ষণ করুন', saving: 'সংরক্ষণ হচ্ছে…', create: 'তৈরি করুন', creating: 'তৈরি হচ্ছে…',
      ownerColumn: 'ব্যবহারকারী', statusColumn: 'অবস্থা', allStatuses: 'সব অবস্থা', dateColumn: 'তারিখ',
      delete: 'মুছুন', confirmDelete: 'এই পোস্টারটি মুছে ফেলবেন?',
      blocked: 'ব্লক করা', allUsers: 'সব ব্যবহারকারী', activeUsers: 'সচল', blockedUsers: 'ব্লক করা',
      block: 'ব্লক করুন', unblock: 'আনব্লক করুন', confirmBlock: 'এই ব্যবহারকারীকে ব্লক করবেন?', cannotBlockSelf: 'নিজেকে ব্লক করা যাবে না',
      empty: 'কিছু পাওয়া যায়নি।', prev: 'আগের', next: 'পরের',
    },
    plans: { free: 'ফ্রি', pro: 'প্রো', ultra: 'আল্ট্রা' },
    pricingPage: {
      title: 'আপনার প্যাকেজ বেছে নিন', sub: 'এক মাসের সাবস্ক্রিপশন, বিকাশে পেমেন্ট। যেকোনো সময় রিনিউ করুন।',
      perMonth: '/মাস', current: 'বর্তমান প্যাকেজ', popular: 'জনপ্রিয়',
      dailyPosters: (n: number) => `দিনে ${bnNum(n)}টি পোস্টার`, watermark: 'পোস্টারে ওয়াটারমার্ক থাকবে', noWatermark: 'ওয়াটারমার্ক ছাড়া পোস্টার',
      freeTemplatesOnly: 'শুধু ফ্রি টেমপ্লেট', premiumTemplates: 'সব প্রিমিয়াম টেমপ্লেট',
      buy: 'বিকাশে কিনুন', renew: 'আরও ১ মাস বাড়ান', included: 'আপনার প্যাকেজে আছে', loginToBuy: 'কিনতে লগইন করুন',
      activeUntil: (d: string) => `${d} পর্যন্ত সচল`, nextSlot: (d: string) => `পরের পোস্টার: ${d} থেকে`, usedToday: (used: number, limit: number) => `আজ ${bnNum(used)}/${bnNum(limit)}টি পোস্টার তৈরি হয়েছে`,
    },
    upgrade: {
      premiumBadge: 'প্রিমিয়াম', premiumTitle: 'এটি একটি প্রিমিয়াম টেমপ্লেট',
      premiumBody: 'প্রো বা আল্ট্রা প্যাকেজে আপগ্রেড করে সব প্রিমিয়াম টেমপ্লেট ব্যবহার করুন।',
      watermarkTitle: 'ওয়াটারমার্ক সরাতে চান?', watermarkBody: 'প্রো বা আল্ট্রা প্যাকেজে আপগ্রেড করলে পোস্টার ওয়াটারমার্ক ছাড়া পাবেন।',
      limitTitle: '২৪ ঘণ্টার সীমা শেষ', limitBody: 'আরও পোস্টার বানাতে প্যাকেজ আপগ্রেড করুন।', limitBodyAt: (d: string) => `${d} থেকে আবার পোস্টার বানাতে পারবেন, অথবা এখনই প্যাকেজ আপগ্রেড করুন।`,
      cta: 'প্যাকেজ আপগ্রেড করুন', removeWatermark: 'ওয়াটারমার্ক সরান', removing: 'ওয়াটারমার্ক সরানো হচ্ছে…',
      watermarkedNote: 'ফ্রি প্যাকেজের পোস্টারে ওয়াটারমার্ক থাকে।',
    },
    payment: {
      demoBanner: 'ডেমো পেমেন্ট — কোনো আসল টাকা কাটা হবে না। আসল পিন দেবেন না।',
      merchant: 'পোস্টার মেকার', invoice: 'ইনভয়েস', amount: 'পরিমাণ', plan: (p: string) => `${p} প্যাকেজ — ১ মাস`,
      walletLabel: 'আপনার বিকাশ অ্যাকাউন্ট নম্বর', walletPlaceholder: 'যেমন: 01XXXXXXXXX', walletError: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন',
      otpLabel: 'ভেরিফিকেশন কোড', otpHint: (code: string) => `ডেমো কোড: ${code}`, otpError: '৬ সংখ্যার কোড দিন',
      pinLabel: 'বিকাশ পিন', pinHint: (pin: string) => `ডেমো পিন: ${pin}`, pinError: '৫ সংখ্যার পিন দিন',
      proceed: 'এগিয়ে যান', confirm: 'কনফার্ম', cancel: 'বাতিল', processing: 'প্রসেস হচ্ছে…', back: 'পিছনে',
      successTitle: 'পেমেন্ট সফল হয়েছে', successBody: (plan: string, d: string) => `আপনার ${plan} প্যাকেজ ${d} পর্যন্ত সচল।`,
      trxId: 'ট্রানজেকশন আইডি', closedTitle: 'এই পেমেন্টটি আর খোলা নেই', closedBody: 'পেমেন্টটি বাতিল, ব্যর্থ বা মেয়াদোত্তীর্ণ হয়েছে। আবার চেষ্টা করুন।',
      backToPricing: 'প্যাকেজে ফিরে যান', goCreate: 'পোস্টার তৈরি করুন', expiresIn: (m: number) => `${bnNum(m)} মিনিটের মধ্যে পেমেন্ট সম্পন্ন করুন`,
    },
    analytics: {
      updated: (d: string) => `হালনাগাদ: ${d}`, refresh: 'রিফ্রেশ',
      users: 'মোট ব্যবহারকারী', usersSub: (n: number, b: number) => `এই সপ্তাহে +${bnNum(n)} · ব্লক ${bnNum(b)}`,
      posters: 'মোট পোস্টার তৈরি', postersSub: (d: number, w: number) => `২৪ ঘণ্টায় ${bnNum(d)} · ৭ দিনে ${bnNum(w)}`,
      postersNote: 'মুছে ফেলা পোস্টারসহ',
      revenue: 'মোট আয়', revenueSub: (m: string, n: number) => `৩০ দিনে ${m} · ${bnNum(n)}টি পেমেন্ট`,
      subscribers: 'সচল সাবস্ক্রিপশন', subscribersSub: (p: number, u: number) => `প্রো ${bnNum(p)} · আল্ট্রা ${bnNum(u)}`,
      dailyPosters: 'প্রতিদিন তৈরি পোস্টার', dailyUsers: 'প্রতিদিন নতুন ব্যবহারকারী', dailyRevenue: 'প্রতিদিনের আয় (৳)',
      last14: 'গত ১৪ দিন', showTable: 'টেবিল দেখুন', date: 'তারিখ', value: 'মান',
      planMix: 'প্যাকেজ অনুযায়ী ব্যবহারকারী', posterStatus: 'পোস্টারের অবস্থা (বর্তমান)',
      failureRate: (p: string) => `ব্যর্থতার হার: ${p}`, topTemplates: 'জনপ্রিয় টেমপ্লেট (৩০ দিন)', noData: 'এখনো কোনো তথ্য নেই।',
      payments: 'পেমেন্ট', paymentStatus: { pending: 'অপেক্ষমাণ', completed: 'সফল', failed: 'ব্যর্থ', cancelled: 'বাতিল' },
      ai: 'AI কল (৩০ দিন)', aiDesign: 'ডিজাইন', aiBackground: 'ব্যাকগ্রাউন্ড', calls: 'কল', success: 'সফল', latency: 'গড় সময়',
    },
    errors: {
      NETWORK: 'সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ দেখুন।', VALIDATION_ERROR: 'তথ্যগুলো সঠিকভাবে পূরণ করুন।',
      UNAUTHORIZED: 'অনুগ্রহ করে লগইন করুন।', FORBIDDEN: 'এই কাজের অনুমতি নেই।', NOT_FOUND: 'খুঁজে পাওয়া যায়নি।',
      EMAIL_TAKEN: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।', INVALID_CREDENTIALS: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      RATE_LIMITED: 'খুব দ্রুত অনুরোধ করা হচ্ছে। কিছুক্ষণ পর চেষ্টা করুন।', DAILY_LIMIT: '২৪ ঘণ্টার পোস্টার তৈরির সীমা শেষ। প্রতিটি পোস্টার তৈরির ২৪ ঘণ্টা পর আবার সুযোগ পাবেন।',
      REGEN_LIMIT_REACHED: 'এই পোস্টারটি আর পুনরায় তৈরি করা যাবে না।', POSTER_BUSY: 'পোস্টারটি এখন তৈরি হচ্ছে, একটু অপেক্ষা করুন।',
      CONTENT_BLOCKED: 'লেখায় নিষিদ্ধ শব্দ রয়েছে। অনুগ্রহ করে পরিবর্তন করুন।', UNSUPPORTED_IMAGE: 'শুধু JPG, PNG বা WEBP ছবি দিন।',
      IMAGE_TOO_SMALL: 'ছবিটি খুব ছোট। কমপক্ষে ৩০০×৩০০ পিক্সেলের ছবি দিন।', FILE_TOO_LARGE: 'ছবির সাইজ ৫ MB এর বেশি হতে পারবে না।',
      PHOTO_NOT_OWNED: 'ছবিটি আবার আপলোড করুন।', TEMPLATE_UNAVAILABLE: 'এই টেমপ্লেটটি এখন পাওয়া যাচ্ছে না।',
      UPGRADE_REQUIRED: 'এই সুবিধার জন্য প্রো বা আল্ট্রা প্যাকেজ দরকার।', PLAN_DOWNGRADE: 'আপনার এখন এর চেয়ে বড় প্যাকেজ সচল আছে।',
      PAYMENT_FAILED: 'ভেরিফিকেশন কোড বা পিন সঠিক নয়।', PAYMENT_CLOSED: 'এই পেমেন্টটি আর খোলা নেই। আবার চেষ্টা করুন।',
      SLUG_TAKEN: 'এই স্লাগ দিয়ে আগেই একটি টেমপ্লেট আছে।', FALLBACK: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
    },
    validation: {
      required: 'এই ঘরটি পূরণ করুন', minChars: (n: number) => `কমপক্ষে ${bnNum(n)} অক্ষর লিখুন`, maxChars: (n: number) => `সর্বোচ্চ ${bnNum(n)} অক্ষর`,
      minPhotos: (n: number) => `কমপক্ষে ${bnNum(n)}টি ছবি দিন`, maxPhotos: (n: number) => `সর্বোচ্চ ${bnNum(n)}টি ছবি`,
      invalidEmail: 'সঠিক ইমেইল ঠিকানা দিন', invalidChars: 'অবৈধ অক্ষর রয়েছে',
    },
  },
  en: {
    common: { appName: 'Poster Maker', templates: 'Templates', myPosters: 'My Posters', admin: 'Admin', pricing: 'Pricing', login: 'Log in', logout: 'Log out', retry: 'Retry', switchToLabel: 'বাংলা', photoCount: (n: number) => `${n} photo${n === 1 ? '' : 's'}` },
    auth: {
      pitch: 'Your campaign posters, in minutes.', pitchSub: 'Templates, AI design and print-quality downloads — all in one place.',
      newAccountTitle: 'New account', loginTitle: 'Log in', name: 'Name', email: 'Email', password: 'Password',
      createAccount: 'Create account', loginButton: 'Log in', haveAccount: 'Already have an account?', noAccount: "Don't have an account?",
      loginLink: 'Log in', registerLink: 'Sign up',
    },
    occasion: { all: 'All', victory_day: 'Victory Day', mourning: 'Mourning', election: 'Election Campaign', greetings: 'Greetings', festival: 'Eid / Festival' },
    templatesPage: {
      title: 'Choose a template', emptyForOccasion: 'No templates yet for this occasion.',
      eyebrow: 'AI-powered poster design', heroA: 'Create print-ready', heroB: 'posters in minutes',
      heroSub: 'Pick a template, add your name and photo — AI handles the rest of the design.', cta: 'Browse templates',
      steps: ['Pick a template', 'Add details & photo', 'Download'],
    },
    footer: { tagline: 'Posters in Bangla, in one click.' },
    historyPage: { title: 'My Posters', count: (n: number) => `${n} poster${n === 1 ? '' : 's'} in total`, empty: 'No posters yet.', createFirst: 'Create your first poster', prev: 'Previous', next: 'Next', pagination: 'Pagination' },
    createPage: { title: 'Enter poster details', livePreview: 'Live preview', previewNote: 'Rough preview — AI creates the final design', back: 'All templates' },
    posterForm: {
      headline: 'Headline', headlineHint: 'e.g. Great Victory Day', tagline: 'Tagline (optional)',
      taglineHint: "Leave it blank and AI will suggest a suitable tagline", name: 'Name', designation: 'Designation',
      organization: 'Party / Organization', union: 'Union / Ward (optional)', thana: 'Thana / Upazila (optional)', district: 'District',
      photosLabel: (max: number) => `Photos (up to ${max})`,
      photoError: 'Please add at least 1 photo', submitting: 'Submitting…', submit: 'Create poster',
      ballot: {
        section: 'Election details', headlineHint: 'e.g. In the upcoming No. 5 Goalabazar Union Parishad election',
        designationHint: 'e.g. Chairman candidate / Councillor, Ward 1', organizationHint: 'Short line with the name — e.g. Former successful chairman',
        taglineHint: 'e.g. Honest, fearless, young social worker',
        topLine: 'Top line (optional)', topLineHint: 'e.g. Bismillahir Rahmanir Rahim',
        electionDate: 'Election date (optional)', electionDateHint: 'e.g. 05 January 2027, Tuesday',
        symbol: 'Ballot symbol (optional)', symbolHint: 'Just the name, e.g. নৌকা — printed as "নৌকা মার্কায়"',
        appeal: 'Vote appeal (optional)', appealHint: 'Leave blank for the standard appeal line',
        campaignBy: 'Campaigned by (optional)', campaignByHint: 'Leave blank to use "<union>বাসী"',
        photoRoles: (max: number): string => max >= 3 ? 'Photo 1: candidate · 2: ballot symbol · 3: party leader (optional)' : 'Photo 1: candidate · 2: ballot symbol (optional)',
      },
    },
    photoUploader: {
      primary: 'Main', uploading: 'Uploading', dropHint: 'Drag & drop or click', hint: 'The first photo is shown larger as the main photo. Only use your own or permitted photos.',
      addPhotoLabel: (count: number, max: number) => `Add photos (${count}/${max})`,
      photoAlt: (n: number) => `Photo ${n}`, removeAlt: (n: number) => `Remove photo ${n}`,
    },
    regenerate: { title: 'Edit the text and regenerate', remaining: (n: number) => `You can regenerate ${n} more time(s). Pressing again with the same text produces a new design.`, submit: 'Regenerate' },
    statusBadge: { queued: 'Queued', generating: 'Generating', completed: 'Completed', failed: 'Failed' },
    posterCard: { download: 'Download', delete: 'Delete', confirmDelete: 'Delete this poster?' },
    posterDetail: {
      generatingMessage: 'Generating your poster… usually takes 20–40 seconds', downloadPng: 'Download PNG (print)', downloadJpg: 'Download JPG',
      failedMessage: "Couldn't generate the poster. Please try again.", retry: 'Try again', createAnother: 'Create another poster',
      allPosters: 'All my posters', notFound: 'Poster not found.',
    },
    admin: {
      pageTitle: 'Admin panel', analyticsTab: 'Analytics', templatesTab: 'Templates', postersTab: 'Posters', usersTab: 'Users',
      newTemplate: 'New template', editTemplate: 'Edit template', backToList: 'Back to list',
      active: 'Active', inactive: 'Inactive', deactivate: 'Deactivate', confirmDeactivate: 'Deactivate this template?',
      slug: 'Slug', title: 'Title', occasion: 'Occasion', layoutKey: 'Layout', photoSlots: 'Photo slots',
      thumbnailUrl: 'Thumbnail URL', defaultHeadline: 'Default headline', palettes: 'Palettes', motifs: 'Motifs',
      addPalette: 'Add palette', removePalette: 'Remove palette', paletteName: 'Name',
      defaultDesign: 'Default design', paletteId: 'Palette', motif: 'Motif', headlineFont: 'Font', headlineScale: 'Scale',
      save: 'Save', saving: 'Saving…', create: 'Create', creating: 'Creating…',
      ownerColumn: 'User', statusColumn: 'Status', allStatuses: 'All statuses', dateColumn: 'Date',
      delete: 'Delete', confirmDelete: 'Delete this poster?',
      blocked: 'Blocked', allUsers: 'All users', activeUsers: 'Active', blockedUsers: 'Blocked',
      block: 'Block', unblock: 'Unblock', confirmBlock: 'Block this user?', cannotBlockSelf: 'You cannot block yourself',
      empty: 'Nothing found.', prev: 'Previous', next: 'Next',
    },
    plans: { free: 'Free', pro: 'Pro', ultra: 'Ultra' },
    pricingPage: {
      title: 'Choose your plan', sub: 'One-month subscription, paid with bKash. Renew any time.',
      perMonth: '/month', current: 'Current plan', popular: 'Popular',
      dailyPosters: (n: number) => `${n} posters per day`, watermark: 'Posters carry a watermark', noWatermark: 'No watermark',
      freeTemplatesOnly: 'Free templates only', premiumTemplates: 'All premium templates',
      buy: 'Buy with bKash', renew: 'Extend by 1 month', included: 'Included in your plan', loginToBuy: 'Log in to buy',
      activeUntil: (d: string) => `Active until ${d}`, nextSlot: (d: string) => `Next poster available ${d}`, usedToday: (used: number, limit: number) => `${used}/${limit} posters created today`,
    },
    upgrade: {
      premiumBadge: 'Premium', premiumTitle: 'This is a premium template',
      premiumBody: 'Upgrade to Pro or Ultra to use every premium template.',
      watermarkTitle: 'Want to remove the watermark?', watermarkBody: 'Upgrade to Pro or Ultra to get your posters without a watermark.',
      limitTitle: '24-hour limit reached', limitBody: 'Upgrade your plan to create more posters.', limitBodyAt: (d: string) => `You can create another poster from ${d}, or upgrade now.`,
      cta: 'Upgrade plan', removeWatermark: 'Remove watermark', removing: 'Removing watermark…',
      watermarkedNote: 'Free-plan posters carry a watermark.',
    },
    payment: {
      demoBanner: 'Demo payment — no real money is charged. Do not enter your real PIN.',
      merchant: 'Poster Maker', invoice: 'Invoice', amount: 'Amount', plan: (p: string) => `${p} plan — 1 month`,
      walletLabel: 'Your bKash account number', walletPlaceholder: 'e.g. 01XXXXXXXXX', walletError: 'Enter a valid 11-digit mobile number',
      otpLabel: 'Verification code', otpHint: (code: string) => `Demo code: ${code}`, otpError: 'Enter the 6-digit code',
      pinLabel: 'bKash PIN', pinHint: (pin: string) => `Demo PIN: ${pin}`, pinError: 'Enter the 5-digit PIN',
      proceed: 'Proceed', confirm: 'Confirm', cancel: 'Cancel', processing: 'Processing…', back: 'Back',
      successTitle: 'Payment successful', successBody: (plan: string, d: string) => `Your ${plan} plan is active until ${d}.`,
      trxId: 'Transaction ID', closedTitle: 'This payment is no longer open', closedBody: 'It was cancelled, failed or expired. Please try again.',
      backToPricing: 'Back to plans', goCreate: 'Create a poster', expiresIn: (m: number) => `Complete the payment within ${m} minutes`,
    },
    analytics: {
      updated: (d: string) => `Updated ${d}`, refresh: 'Refresh',
      users: 'Total users', usersSub: (n: number, b: number) => `+${n} this week · ${b} blocked`,
      posters: 'Posters created', postersSub: (d: number, w: number) => `${d} in 24h · ${w} in 7 days`,
      postersNote: 'Includes deleted posters',
      revenue: 'Total revenue', revenueSub: (m: string, n: number) => `${m} in 30 days · ${n} payments`,
      subscribers: 'Active subscriptions', subscribersSub: (p: number, u: number) => `Pro ${p} · Ultra ${u}`,
      dailyPosters: 'Posters per day', dailyUsers: 'New users per day', dailyRevenue: 'Revenue per day (৳)',
      last14: 'Last 14 days', showTable: 'Show table', date: 'Date', value: 'Value',
      planMix: 'Users by plan', posterStatus: 'Poster status (current)',
      failureRate: (p: string) => `Failure rate: ${p}`, topTemplates: 'Top templates (30 days)', noData: 'No data yet.',
      payments: 'Payments', paymentStatus: { pending: 'Pending', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' },
      ai: 'AI calls (30 days)', aiDesign: 'Design', aiBackground: 'Background', calls: 'Calls', success: 'Success', latency: 'Avg time',
    },
    errors: {
      NETWORK: "Can't reach the server. Check your internet connection.", VALIDATION_ERROR: 'Please fill in the details correctly.',
      UNAUTHORIZED: 'Please log in.', FORBIDDEN: "You don't have permission for this.", NOT_FOUND: 'Not found.',
      EMAIL_TAKEN: 'An account with this email already exists.', INVALID_CREDENTIALS: 'Email or password is incorrect.',
      RATE_LIMITED: 'Too many requests. Please try again shortly.', DAILY_LIMIT: "You've reached your 24-hour poster limit. Each slot frees up 24 hours after the poster was made.",
      REGEN_LIMIT_REACHED: 'This poster can no longer be regenerated.', POSTER_BUSY: 'The poster is being generated, please wait.',
      CONTENT_BLOCKED: 'The text contains prohibited words. Please change it.', UNSUPPORTED_IMAGE: 'Please use a JPG, PNG or WEBP image.',
      IMAGE_TOO_SMALL: 'The image is too small. Use at least 300×300 pixels.', FILE_TOO_LARGE: 'Image size cannot exceed 5 MB.',
      PHOTO_NOT_OWNED: 'Please upload the photo again.', TEMPLATE_UNAVAILABLE: 'This template is currently unavailable.',
      UPGRADE_REQUIRED: 'This needs a Pro or Ultra plan.', PLAN_DOWNGRADE: 'You already have a higher plan active.',
      PAYMENT_FAILED: 'The verification code or PIN is incorrect.', PAYMENT_CLOSED: 'This payment is no longer open. Please try again.',
      SLUG_TAKEN: 'A template with this slug already exists.', FALLBACK: 'Something went wrong. Please try again.',
    },
    validation: {
      required: 'Please fill in this field', minChars: (n: number) => `Enter at least ${n} characters`, maxChars: (n: number) => `Maximum ${n} characters`,
      minPhotos: (n: number) => `Please add at least ${n} photo(s)`, maxPhotos: (n: number) => `Maximum ${n} photos`,
      invalidEmail: 'Enter a valid email address', invalidChars: 'Contains invalid characters',
    },
  },
} satisfies Record<Locale, unknown>;

type Dict = typeof dict.bn;

export const validationMessages = { bn: dict.bn.validation, en: dict.en.validation };
export const dictErrors = { bn: dict.bn.errors, en: dict.en.errors };

const LocaleContext = createContext<Locale>('bn');

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Module state is shared across requests on the server; only seed it in the browser.
    if (typeof window !== 'undefined') currentLocale = initialLocale;
    return initialLocale;
  });

  useEffect(() => {
    const listener = (l: Locale) => setLocaleState(l);
    listeners.add(listener);
    // One-time migration for users whose choice was saved in localStorage before the cookie existed.
    try {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (!document.cookie.includes(`${LOCALE_COOKIE}=`)) setLocale(parseLocale(legacy));
      }
    } catch { /* ignore */ }
    return () => { listeners.delete(listener); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const locale = useContext(LocaleContext);
  return [locale, setLocale];
}

export function useT(): Dict {
  const locale = useContext(LocaleContext);
  return dict[locale];
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatNumber(n: number, locale: Locale): string {
  return locale === 'bn' ? bnNum(n) : String(n);
}
