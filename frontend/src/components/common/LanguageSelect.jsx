import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelect({ compact = false }) {
  const { language, setLanguage, languages, t } = useLanguage();
  return (
    <label className={`flex items-center gap-2 ${compact ? '' : 'rounded-xl border border-slate-200 bg-white p-3'}`}>
      <Languages size={18} className="shrink-0 text-slate-500" />
      {!compact && <span className="text-sm font-medium text-slate-700">{t('Language')}</span>}
      <select
        aria-label={t('Language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={compact ? 'bg-transparent text-sm font-medium outline-none' : 'ml-auto rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none'}
      >
        {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
      </select>
    </label>
  );
}
