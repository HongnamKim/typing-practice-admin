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
};