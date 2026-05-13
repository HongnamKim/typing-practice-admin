import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { SCROLL_THRESHOLD } from '../constants';

/**
 * 커서 기반 무한 스크롤 커스텀 훅
 * @param {Function} fetchFn - API 호출 함수 (params를 받아서 { content, nextCursor, hasNext }를 반환)
 * @param {Object} filters - 필터 조건 객체
 * @param {Object} cursorKeys - { at: 'postedAt' | 'releasedAt', cursorAtParam: 'cursorPostedAt' | 'cursorReleasedAt' }
 * @param {string} errorMessage - 에러 발생 시 표시할 메시지
 * @param {number} size - 페이지 크기 (기본 20)
 */
export default function useCursorInfiniteScroll(
  fetchFn,
  filters,
  cursorKeys,
  errorMessage = '목록을 불러오는데 실패했습니다.',
  size = 20,
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const { at, cursorAtParam } = cursorKeys;

  const fetchData = useCallback(async (cursor = null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = { size, ...filters };
      if (cursor) {
        params[cursorAtParam] = cursor[at];
        params.cursorId = cursor.id;
      }
      const result = await fetchFn(params);
      setData(prev => append ? [...prev, ...result.content] : result.content);
      setNextCursor(result.nextCursor);
      setHasNext(result.hasNext);
    } catch (error) {
      message.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFn, filters, errorMessage, size, at, cursorAtParam]);

  // 필터 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    fetchData(null);
  }, [fetchData]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD && !loadingMore && hasNext && nextCursor) {
      fetchData(nextCursor, true);
    }
  }, [loadingMore, hasNext, nextCursor, fetchData]);

  const updateItem = useCallback((id, updates, idKey = 'id') => {
    setData(prev => prev.map(item => item[idKey] === id ? { ...item, ...updates } : item));
  }, []);

  const removeItem = useCallback((id, idKey = 'id') => {
    setData(prev => prev.filter(item => item[idKey] !== id));
  }, []);

  const prependItem = useCallback((item) => {
    setData(prev => [item, ...prev]);
  }, []);

  const refresh = useCallback(() => {
    fetchData(null);
  }, [fetchData]);

  return {
    data,
    loading,
    loadingMore,
    handleScroll,
    updateItem,
    removeItem,
    prependItem,
    refresh,
  };
}
