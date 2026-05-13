import { Tabs, Input } from 'antd';

const { TextArea } = Input;

const LANG_TABS = [
  { key: 'ko', label: 'KO *' },
  { key: 'en', label: 'EN' },
  { key: 'ja', label: 'JA' },
];

/**
 * 다국어 입력 컴포넌트
 * @param {Object} value - { ko, en, ja }
 * @param {Function} onChange - (newValue) => void
 * @param {boolean} textarea - true면 TextArea, false면 Input
 * @param {number} rows - textarea 행 수
 * @param {string} placeholder
 */
export default function LocalizedInput({ value, onChange, textarea = false, rows = 4, placeholder = '' }) {
  const handleLangChange = (lang, text) => {
    const next = { ...value };
    if (lang === 'ko') {
      next.ko = text;
    } else {
      next[lang] = text === '' ? null : text;
    }
    onChange(next);
  };

  const renderInput = (lang) => {
    const v = value?.[lang] ?? '';
    const props = {
      value: v,
      onChange: (e) => handleLangChange(lang, e.target.value),
      placeholder: lang === 'ko' ? placeholder : `${placeholder} (선택)`,
    };
    return textarea ? <TextArea rows={rows} {...props} /> : <Input {...props} />;
  };

  return (
    <Tabs
      size="small"
      items={LANG_TABS.map(t => ({
        key: t.key,
        label: t.label,
        children: renderInput(t.key),
      }))}
    />
  );
}
