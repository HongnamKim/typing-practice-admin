/**
 * 날짜를 한국어 날짜 문자열로 변환
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR');
};

/**
 * 날짜를 한국어 날짜+시간 문자열로 변환
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
};
