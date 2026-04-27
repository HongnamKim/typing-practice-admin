import client from './client';

export const statsApi = {
    // 문장별 타이핑 통계 재계산
    recalculateQuoteTyping: async () => {
        const response = await client.post('/admin/stats/quote-typing/recalculate');
        return response.data;
    },

    // 전역 문장 통계 재계산
    recalculateGlobalQuote: async () => {
        const response = await client.post('/admin/stats/global-quote/recalculate');
        return response.data;
    },

    // 동적 난이도 보정 (올인원)
    recalculateDifficulty: async () => {
        const response = await client.post('/admin/stats/difficulty/recalculate');
        return response.data;
    },

    // 개인 타이핑 통계 재계산
    recalculateMemberTyping: async () => {
        const response = await client.post('/admin/stats/member-typing/recalculate');
        return response.data;
    },

    // 개인 일간 통계 재계산
    recalculateMemberDaily: async (date) => {
        const response = await client.post('/admin/stats/member-daily/recalculate', null, {
            params: { date },
        });
        return response.data;
    },

    // 개인 오타 통계 재계산
    recalculateMemberTypo: async () => {
        const response = await client.post('/admin/stats/member-typo/recalculate');
        return response.data;
    },

    // ===== 단어 통계 =====

    // 단어별 타이핑 통계 재계산
    recalculateWordTyping: async () => {
        const response = await client.post('/admin/stats/word-typing/recalculate');
        return response.data;
    },

    // 전역 단어 통계 재계산
    recalculateGlobalWord: async () => {
        const response = await client.post('/admin/stats/global-word/recalculate');
        return response.data;
    },

    // 회원 단어 누적 통계 재계산
    recalculateMemberWordTyping: async () => {
        const response = await client.post('/admin/stats/member-word-typing/recalculate');
        return response.data;
    },

    // 회원 단어 일별 통계 재계산 (body: { date })
    recalculateMemberDailyWord: async (date) => {
        const response = await client.post('/admin/stats/member-daily-word/recalculate', { date });
        return response.data;
    },

    // 회원 단어 오타 통계 재계산
    recalculateMemberWordTypo: async () => {
        const response = await client.post('/admin/stats/member-word-typo/recalculate');
        return response.data;
    },
};