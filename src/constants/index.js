// 역할 관련 상수
export const ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  BANNED: 'BANNED',
};

export const ROLE_COLORS = {
  [ROLE.USER]: 'blue',
  [ROLE.ADMIN]: 'gold',
  [ROLE.BANNED]: 'red',
};

export const ROLE_OPTIONS = [
  { value: ROLE.USER, label: 'USER' },
  { value: ROLE.ADMIN, label: 'ADMIN' },
  { value: ROLE.BANNED, label: 'BANNED' },
];

// 문장 상태 관련 상수
export const QUOTE_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  HIDDEN: 'HIDDEN',
};

export const QUOTE_STATUS_COLORS = {
  [QUOTE_STATUS.PENDING]: 'orange',
  [QUOTE_STATUS.ACTIVE]: 'green',
  [QUOTE_STATUS.HIDDEN]: 'default',
};

export const QUOTE_STATUS_OPTIONS = [
  { value: QUOTE_STATUS.PENDING, label: 'PENDING' },
  { value: QUOTE_STATUS.ACTIVE, label: 'ACTIVE' },
  { value: QUOTE_STATUS.HIDDEN, label: 'HIDDEN' },
];

// 문장 타입 관련 상수
export const QUOTE_TYPE = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
};

export const QUOTE_TYPE_COLORS = {
  [QUOTE_TYPE.PUBLIC]: 'blue',
  [QUOTE_TYPE.PRIVATE]: 'default',
};

export const QUOTE_TYPE_OPTIONS = [
  { value: QUOTE_TYPE.PUBLIC, label: 'PUBLIC' },
  { value: QUOTE_TYPE.PRIVATE, label: 'PRIVATE' },
];

// 신고 상태 관련 상수
export const REPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
};

export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.PENDING]: 'orange',
  [REPORT_STATUS.PROCESSED]: 'green',
};

export const REPORT_STATUS_OPTIONS = [
  { value: REPORT_STATUS.PENDING, label: 'PENDING' },
  { value: REPORT_STATUS.PROCESSED, label: 'PROCESSED' },
];

// 신고 사유 관련 상수
export const REPORT_REASON = {
  MODIFY: 'MODIFY',
  DELETE: 'DELETE',
  INAPPROPRIATE: 'INAPPROPRIATE',
  OTHER: 'OTHER',
};

export const REPORT_REASON_LABELS = {
  [REPORT_REASON.MODIFY]: '수정 요청',
  [REPORT_REASON.DELETE]: '삭제 요청',
  [REPORT_REASON.INAPPROPRIATE]: '부적절',
  [REPORT_REASON.OTHER]: '기타',
};

// 정렬 옵션
export const MEMBER_ORDER_OPTIONS = [
  { value: 'createdAt', label: '가입일' },
  { value: 'nickname', label: '닉네임' },
];

export const QUOTE_ORDER_OPTIONS = [
  { value: 'createdAt', label: '생성일' },
  { value: 'status', label: '상태' },
  { value: 'type', label: '타입' },
  { value: 'difficulty', label: '난이도' },
  { value: 'reportCount', label: '신고수' },
];

export const REPORT_ORDER_OPTIONS = [
  { value: 'createdAt', label: '신고일' },
  { value: 'status', label: '상태' },
];

// 페이지네이션
export const DEFAULT_PAGE_SIZE = 50;
export const SCROLL_THRESHOLD = 100;

// 단어 언어
export const WORD_LANGUAGE = {
  KOREAN: 'KOREAN',
  ENGLISH: 'ENGLISH',
};

export const WORD_LANGUAGE_COLORS = {
  [WORD_LANGUAGE.KOREAN]: 'blue',
  [WORD_LANGUAGE.ENGLISH]: 'purple',
};

export const WORD_LANGUAGE_OPTIONS = [
  { value: WORD_LANGUAGE.KOREAN, label: 'KOREAN' },
  { value: WORD_LANGUAGE.ENGLISH, label: 'ENGLISH' },
];

// 단어 정렬 옵션
export const WORD_ORDER_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'difficulty', label: '난이도' },
  { value: 'createdAt', label: '생성일' },
];
