/**
 * 서버 시간 문자열을 Date 객체로 파싱
 * 타임존 정보가 없는 경우 UTC로 간주 (서버가 UTC로 응답)
 * @param {string|Date} date
 * @returns {Date|null}
 */
const parseServerDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  // ISO 8601에 타임존 정보(Z 또는 ±HH:MM)가 없으면 UTC로 간주
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(date);
  return new Date(hasTimezone ? date : `${date}Z`);
};

/**
 * 날짜를 브라우저 로컬 타임존 기준 한국어 날짜 문자열로 변환
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  const parsed = parseServerDate(date);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('ko-KR');
};

/**
 * 날짜를 브라우저 로컬 타임존 기준 한국어 날짜+시간 문자열로 변환
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  const parsed = parseServerDate(date);
  if (!parsed) return '-';
  return parsed.toLocaleString('ko-KR');
};
