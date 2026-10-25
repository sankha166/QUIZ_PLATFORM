import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', nativeName: 'English', label: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', label: 'Hindi' },
  { code: 'bn', nativeName: 'বাংলা', label: 'Bengali' },
];

const translations = {
  en: {},
  hi: {
    Dashboard: 'डैशबोर्ड', Quizzes: 'क्विज़', 'All Quizzes': 'सभी क्विज़', 'Live Quizzes': 'लाइव क्विज़',
    'My Attempts': 'मेरे प्रयास', Leaderboard: 'लीडरबोर्ड', 'My Profile': 'मेरी प्रोफ़ाइल', Logout: 'लॉग आउट',
    'Student Portal': 'स्टूडेंट पोर्टल', 'Account details': 'खाता विवरण', Profile: 'प्रोफ़ाइल',
    Favorites: 'पसंदीदा', Avatar: 'अवतार', Security: 'सुरक्षा', 'Language preference': 'भाषा प्राथमिकता',
    Language: 'भाषा', 'Choose the language for your Quizora experience.': 'अपने Quizora अनुभव की भाषा चुनें।',
    'Display name': 'प्रदर्शित नाम', Email: 'ईमेल', Bio: 'परिचय', 'Save changes': 'बदलाव सहेजें',
    'Favorite quizzes': 'पसंदीदा क्विज़', 'Your saved quizzes in one place.': 'आपके सहेजे गए क्विज़ एक ही जगह।',
    'No favorite quizzes yet.': 'अभी कोई पसंदीदा क्विज़ नहीं है।', 'Browse quizzes': 'क्विज़ देखें',
    'Open quiz': 'क्विज़ खोलें', Remove: 'हटाएँ', 'Choose an avatar': 'अवतार चुनें',
    'Upload from device': 'डिवाइस से अपलोड करें', 'Change password': 'पासवर्ड बदलें',
    'Current password': 'वर्तमान पासवर्ड', 'New password': 'नया पासवर्ड', 'Confirm password': 'पासवर्ड की पुष्टि करें',
    'Save avatar': 'अवतार सहेजें', Saving: 'सहेजा जा रहा है…', Cancel: 'रद्द करें',
    'Switch to light mode': 'लाइट मोड पर जाएँ', 'Switch to dark mode': 'डार्क मोड पर जाएँ',
    Category: 'श्रेणी', Duration: 'अवधि', Questions: 'प्रश्न', 'Passing score': 'उत्तीर्ण अंक',
    'My Attempt History': 'मेरे प्रयासों का इतिहास', 'Review your performance and track your progress.': 'अपने प्रदर्शन की समीक्षा करें और प्रगति पर नज़र रखें।',
    'Browse new quizzes': 'नए क्विज़ देखें', 'Total attempts': 'कुल प्रयास', Passed: 'उत्तीर्ण', Failed: 'अनुत्तीर्ण',
    'Avg score': 'औसत स्कोर', Quiz: 'क्विज़', Score: 'स्कोर', Status: 'स्थिति', Time: 'समय', Date: 'तारीख', Review: 'समीक्षा',
    'No attempts yet': 'अभी कोई प्रयास नहीं', 'Take a quiz to see your history here.': 'अपना इतिहास देखने के लिए कोई क्विज़ दें।',
    'Review Result': 'परिणाम की समीक्षा', 'Short quiz': 'शॉर्ट क्विज़', 'Question Review': 'प्रश्न समीक्षा',
    'Answer distribution': 'उत्तर वितरण', Correct: 'सही', Incorrect: 'गलत', Skipped: 'छोड़ा गया',
    'Response time by question': 'प्रश्न के अनुसार उत्तर समय', seconds: 'सेकंड', 'Personal recommendations': 'व्यक्तिगत सुझाव',
    'Your profile': 'आपकी प्रोफ़ाइल', 'Leaderboard type': 'लीडरबोर्ड प्रकार', Overall: 'संपूर्ण',
    'By Category': 'श्रेणी के अनुसार', 'All categories': 'सभी श्रेणियाँ', 'Time period': 'समय अवधि',
    'All time': 'हर समय', 'This month': 'इस महीने', 'This week': 'इस सप्ताह', 'Your rank': 'आपकी रैंक',
    'Not ranked yet': 'अभी रैंक नहीं', 'Compare your performance with other learners.': 'अन्य विद्यार्थियों के साथ अपने प्रदर्शन की तुलना करें।',
    'No leaderboard data': 'लीडरबोर्ड डेटा उपलब्ध नहीं', 'Complete quizzes to appear here.': 'यहाँ दिखने के लिए क्विज़ पूरे करें।',
    'Unable to load this attempt result.': 'यह प्रयास परिणाम लोड नहीं हो सका।', 'This attempt could not be found.': 'यह प्रयास नहीं मिला।',
    'Back': 'वापस',
    'Assessment complete': 'मूल्यांकन पूरा हुआ', 'Total time': 'कुल समय', 'Performance dashboard': 'प्रदर्शन डैशबोर्ड',
    'Your complete analysis': 'आपका पूरा विश्लेषण', 'Unanswered': 'अनुत्तरित',
  },
  bn: {
    Dashboard: 'ড্যাশবোর্ড', Quizzes: 'কুইজ', 'All Quizzes': 'সব কুইজ', 'Live Quizzes': 'লাইভ কুইজ',
    'My Attempts': 'আমার প্রচেষ্টা', Leaderboard: 'লিডারবোর্ড', 'My Profile': 'আমার প্রোফাইল', Logout: 'লগ আউট',
    'Student Portal': 'স্টুডেন্ট পোর্টাল', 'Account details': 'অ্যাকাউন্টের বিবরণ', Profile: 'প্রোফাইল',
    Favorites: 'পছন্দের', Avatar: 'অবতার', Security: 'নিরাপত্তা', 'Language preference': 'ভাষার পছন্দ',
    Language: 'ভাষা', 'Choose the language for your Quizora experience.': 'আপনার Quizora অভিজ্ঞতার ভাষা বেছে নিন।',
    'Display name': 'প্রদর্শনের নাম', Email: 'ইমেল', Bio: 'পরিচিতি', 'Save changes': 'পরিবর্তন সংরক্ষণ করুন',
    'Favorite quizzes': 'পছন্দের কুইজ', 'Your saved quizzes in one place.': 'আপনার সংরক্ষিত কুইজ এক জায়গায়।',
    'No favorite quizzes yet.': 'এখনও কোনো পছন্দের কুইজ নেই।', 'Browse quizzes': 'কুইজ দেখুন',
    'Open quiz': 'কুইজ খুলুন', Remove: 'সরান', 'Choose an avatar': 'অবতার বেছে নিন',
    'Upload from device': 'ডিভাইস থেকে আপলোড করুন', 'Change password': 'পাসওয়ার্ড পরিবর্তন করুন',
    'Current password': 'বর্তমান পাসওয়ার্ড', 'New password': 'নতুন পাসওয়ার্ড', 'Confirm password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'Save avatar': 'অবতার সংরক্ষণ করুন', Saving: 'সংরক্ষণ হচ্ছে…', Cancel: 'বাতিল করুন',
    'Switch to light mode': 'লাইট মোডে যান', 'Switch to dark mode': 'ডার্ক মোডে যান',
    Category: 'বিভাগ', Duration: 'সময়কাল', Questions: 'প্রশ্ন', 'Passing score': 'পাস করার স্কোর',
    'My Attempt History': 'আমার প্রচেষ্টার ইতিহাস', 'Review your performance and track your progress.': 'আপনার পারফরম্যান্স পর্যালোচনা করুন এবং অগ্রগতি দেখুন।',
    'Browse new quizzes': 'নতুন কুইজ দেখুন', 'Total attempts': 'মোট প্রচেষ্টা', Passed: 'উত্তীর্ণ', Failed: 'অনুত্তীর্ণ',
    'Avg score': 'গড় স্কোর', Quiz: 'কুইজ', Score: 'স্কোর', Status: 'অবস্থা', Time: 'সময়', Date: 'তারিখ', Review: 'পর্যালোচনা',
    'No attempts yet': 'এখনও কোনো প্রচেষ্টা নেই', 'Take a quiz to see your history here.': 'আপনার ইতিহাস দেখতে একটি কুইজ দিন।',
    'Review Result': 'ফলাফল পর্যালোচনা', 'Short quiz': 'শর্ট কুইজ', 'Question Review': 'প্রশ্ন পর্যালোচনা',
    'Answer distribution': 'উত্তর বিতরণ', Correct: 'সঠিক', Incorrect: 'ভুল', Skipped: 'এড়িয়ে যাওয়া',
    'Response time by question': 'প্রশ্ন অনুযায়ী উত্তর দেওয়ার সময়', seconds: 'সেকেন্ড', 'Personal recommendations': 'ব্যক্তিগত পরামর্শ',
    'Your profile': 'আপনার প্রোফাইল', 'Leaderboard type': 'লিডারবোর্ডের ধরন', Overall: 'সামগ্রিক',
    'By Category': 'বিভাগ অনুযায়ী', 'All categories': 'সব বিভাগ', 'Time period': 'সময়কাল',
    'All time': 'সব সময়', 'This month': 'এই মাস', 'This week': 'এই সপ্তাহ', 'Your rank': 'আপনার র‍্যাঙ্ক',
    'Not ranked yet': 'এখনও র‍্যাঙ্ক হয়নি', 'Compare your performance with other learners.': 'অন্যান্য শিক্ষার্থীদের সঙ্গে আপনার পারফরম্যান্স তুলনা করুন।',
    'No leaderboard data': 'কোনো লিডারবোর্ড ডেটা নেই', 'Complete quizzes to appear here.': 'এখানে দেখা যেতে কুইজ সম্পূর্ণ করুন।',
    'Unable to load this attempt result.': 'এই প্রচেষ্টার ফলাফল লোড করা যায়নি।', 'This attempt could not be found.': 'এই প্রচেষ্টা পাওয়া যায়নি।',
    'Back': 'ফিরে যান',
    'Assessment complete': 'মূল্যায়ন সম্পূর্ণ', 'Total time': 'মোট সময়', 'Performance dashboard': 'পারফরম্যান্স ড্যাশবোর্ড',
    'Your complete analysis': 'আপনার সম্পূর্ণ বিশ্লেষণ', 'Unanswered': 'উত্তর দেওয়া হয়নি',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('quizora-language');
    return LANGUAGES.some(({ code }) => code === saved) ? saved : 'en';
  });
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (!LANGUAGES.some(({ code }) => code === nextLanguage)) return;
    localStorage.setItem('quizora-language', nextLanguage);
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  const t = useCallback((key) => translations[language][key] || key, [language]);
  const value = useMemo(() => ({ language, setLanguage, languages: LANGUAGES, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export function localizedValue(item, field, language) {
  if (!item) return '';
  const translationsForField = item[`${field}_translations`] || item.translations?.[field];
  if (translationsForField && typeof translationsForField === 'object') {
    return translationsForField[language] || translationsForField.en || item[field] || '';
  }
  return item[field] || '';
}
