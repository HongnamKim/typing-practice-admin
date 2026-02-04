import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { DEFAULT_PAGE_SIZE, SCROLL_THRESHOLD } from '../constants';

/**
 * 무한 스크롤 커스텀 훅
 * @param {Function} fetchFn - API 호출 함수 (params를 받아서 { content, page, hasNext }를 반환)
 * @param {Object} filters - 필터 조건 객체
 * @param {string} errorMessage - 에러 발생 시 표시할 메시지
 */
export default function useInfiniteScroll(fetchFn, filters, errorMessage = '목록을 불러오는데 실패했습니다.') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasNext: false });

  const fetchData = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = { page, size: DEFAULT_PAGE_SIZE, ...filters };
      const result = await fetchFn(params);
      setData(prev => append ? [...prev, ...result.content] : result.content);
      setPagination({ page: result.page, hasNext: result.hasNext });
    } catch (error) {
      message.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFn, filters, errorMessage]);

  // 필터 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD && !loadingMore && pagination.hasNext) {
      fetchData(pagination.page + 1, true);
    }
  }, [loadingMore, pagination, fetchData]);

  const updateItem = useCallback((id, updates, idKey = 'id') => {
    setData(prev => prev.map(item => item[idKey] === id ? { ...item, ...updates } : item));
  }, []);

  const removeItem = useCallback((id, idKey = 'id') => {
    setData(prev => prev.filter(item => item[idKey] !== id));
  }, []);

  const refresh = useCallback(() => {
    fetchData(1);
  }, [fetchData]);

  return {
    data,
    loading,
    loadingMore,
    handleScroll,
    updateItem,
    removeItem,
    refresh,
  };
}
