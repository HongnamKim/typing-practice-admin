import { useState, useMemo, useRef } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Input, message, Typography, Popconfirm, Spin, Descriptions, Progress } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { wordsApi } from '../api';
import { useInfiniteScroll } from '../hooks';
import { WORD_LANGUAGE, WORD_LANGUAGE_COLORS, WORD_LANGUAGE_OPTIONS, WORD_ORDER_OPTIONS } from '../constants';
import { formatDateTime } from '../utils';
import { defaultWords } from '../const/default-words.const';

const { Title, Text } = Typography;
const BATCH_SIZE = 50;

export default function WordsPage() {
  const [languageFilter, setLanguageFilter] = useState(null);
  const [orderBy, setOrderBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('DESC');

  // 등록 모달
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ word: '', language: WORD_LANGUAGE.KOREAN });
  const [creating, setCreating] = useState(false);

  // 수정 모달
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ word: '' });

  // 상세 모달
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 기본 단어 업로드 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const cancelRef = useRef(false);

  const filters = useMemo(() => {
    const f = { orderBy, sortDirection };
    if (languageFilter) f.language = languageFilter;
    return f;
  }, [languageFilter, orderBy, sortDirection]);

  const { data: words, loading, loadingMore, handleScroll, updateItem, removeItem, refresh } = useInfiniteScroll(
    wordsApi.getList,
    filters,
    '단어 목록을 불러오는데 실패했습니다.'
  );

  const updateWordState = (wordId, updates) => {
    updateItem(wordId, updates, 'wordId');
    if (detailTarget?.wordId === wordId) {
      setDetailTarget(prev => ({ ...prev, ...updates }));
    }
  };

  const openCreateModal = () => {
    setCreateForm({ word: '', language: WORD_LANGUAGE.KOREAN });
    setCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.word.trim()) {
      message.warning('단어를 입력해주세요.');
      return;
    }
    setCreating(true);
    try {
      await wordsApi.create({ word: createForm.word.trim(), language: createForm.language });
      message.success('단어가 등록되었습니다.');
      setCreateModalOpen(false);
      refresh();
    } catch (error) {
      message.error(`등록에 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (record) => {
    setEditTarget(record);
    setEditForm({ word: record.word });
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm.word.trim()) {
      message.warning('단어를 입력해주세요.');
      return;
    }
    if (editForm.word === editTarget.word) {
      message.info('변경된 내용이 없습니다.');
      return;
    }
    try {
      const updated = await wordsApi.update(editTarget.wordId, { word: editForm.word.trim() });
      message.success('단어가 수정되었습니다.');
      updateWordState(editTarget.wordId, { word: updated.word, difficulty: updated.difficulty });
      setEditModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      message.error(`수정에 실패했습니다: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (wordId) => {
    try {
      await wordsApi.delete(wordId);
      message.success('단어가 삭제되었습니다.');
      removeItem(wordId, 'wordId');
      if (detailTarget?.wordId === wordId) {
        closeDetail();
      }
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const openDetail = async (record) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await wordsApi.getDetail(record.wordId);
      setDetailTarget(data);
    } catch (error) {
      message.error('단어 상세 조회에 실패했습니다.');
      setDetailTarget(record);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };

  const handleDefaultUpload = async () => {
    const total = defaultWords.length;
    setUploadProgress({ current: 0, total, success: 0, fail: 0 });
    setUploading(true);
    cancelRef.current = false;

    let success = 0;
    let fail = 0;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      if (cancelRef.current) break;

      const batch = defaultWords.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((word) => wordsApi.create(word))
      );

      const batchSuccess = results.filter(r => r.status === 'fulfilled').length;
      success += batchSuccess;
      fail += results.length - batchSuccess;

      setUploadProgress({ current: Math.min(i + BATCH_SIZE, total), total, success, fail });
    }

    setUploading(false);
    if (cancelRef.current) {
      message.warning(`업로드가 취소되었습니다. (성공: ${success}, 실패: ${fail})`);
    } else {
      message.success(`업로드 완료! (성공: ${success}, 실패: ${fail})`);
      refresh();
    }
  };

  const handleCancelUpload = () => {
    cancelRef.current = true;
  };

  const columns = [
    { title: 'ID', dataIndex: 'wordId', key: 'wordId', width: 70 },
    { title: '단어', dataIndex: 'word', key: 'word' },
    { title: '언어', dataIndex: 'language', key: 'language', width: 90, render: (lang) => <Tag color={WORD_LANGUAGE_COLORS[lang]}>{lang}</Tag> },
    { title: '난이도', dataIndex: 'difficulty', key: 'difficulty', width: 80, render: (v) => v != null ? v.toFixed(1) : '-' },
    { title: '생성일', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (v) => formatDateTime(v) },
  ];

  const renderDetailActions = () => {
    if (!detailTarget) return null;
    const { wordId } = detailTarget;
    return (
      <Space>
        <Button onClick={() => openEditModal(detailTarget)}>수정</Button>
        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(wordId)} okText="삭제" cancelText="취소">
          <Button danger>삭제</Button>
        </Popconfirm>
        <Button onClick={closeDetail}>닫기</Button>
      </Space>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>단어 관리</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>단어 등록</Button>
          <Button icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>기본 단어 업로드</Button>
          <Select placeholder="언어 필터" allowClear style={{ width: 120 }} value={languageFilter} onChange={setLanguageFilter} options={WORD_LANGUAGE_OPTIONS} />
          <Select style={{ width: 100 }} value={orderBy} onChange={setOrderBy} options={WORD_ORDER_OPTIONS} />
          <Button
            icon={sortDirection === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
          />
        </Space>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={words}
          rowKey="wordId"
          loading={loading}
          pagination={false}
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>

      {/* 등록 모달 */}
      <Modal
        title="단어 등록"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText="등록"
        cancelText="취소"
        confirmLoading={creating}
      >
        <div style={{ marginBottom: 16 }}>
          <label>언어</label>
          <Select
            value={createForm.language}
            onChange={(v) => setCreateForm({ ...createForm, language: v })}
            options={WORD_LANGUAGE_OPTIONS}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>단어 (최대 20자, 숫자 불가)</label>
          <Input
            value={createForm.word}
            onChange={(e) => setCreateForm({ ...createForm, word: e.target.value })}
            maxLength={20}
            placeholder="예: 사과"
          />
        </div>
      </Modal>

      {/* 기본 단어 업로드 모달 */}
      <Modal
        title="기본 단어 업로드"
        open={uploadModalOpen}
        onCancel={() => !uploading && setUploadModalOpen(false)}
        closable={!uploading}
        maskClosable={!uploading}
        footer={
          uploading ? (
            <Button danger onClick={handleCancelUpload}>취소</Button>
          ) : (
            <Space>
              <Button onClick={() => setUploadModalOpen(false)}>닫기</Button>
              <Button type="primary" onClick={handleDefaultUpload}>업로드 시작</Button>
            </Space>
          )
        }
      >
        {uploading ? (
          <div>
            <Progress percent={Math.round((uploadProgress.current / uploadProgress.total) * 100)} status="active" />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text>{uploadProgress.current} / {uploadProgress.total}</Text>
              <br />
              <Text type="success">성공: {uploadProgress.success}</Text>
              {' / '}
              <Text type="danger">실패: {uploadProgress.fail}</Text>
            </div>
          </div>
        ) : (
          <div>
            <p>기본 단어 <strong>{defaultWords.length}개</strong>를 업로드합니다.</p>
            <p><Text type="secondary">한국어 단어로 등록되며, 중복된 단어는 실패로 집계됩니다.</Text></p>
          </div>
        )}
      </Modal>

      {/* 상세 모달 */}
      <Modal title="단어 상세" open={detailModalOpen} onCancel={closeDetail} footer={renderDetailActions()} width={600}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : detailTarget && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailTarget.wordId}</Descriptions.Item>
            <Descriptions.Item label="단어">{detailTarget.word}</Descriptions.Item>
            <Descriptions.Item label="언어"><Tag color={WORD_LANGUAGE_COLORS[detailTarget.language]}>{detailTarget.language}</Tag></Descriptions.Item>
            <Descriptions.Item label="난이도">{detailTarget.difficulty != null ? detailTarget.difficulty.toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="생성일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
            {detailTarget.profile && (
              <>
                <Descriptions.Item label="길이">{detailTarget.profile.length}</Descriptions.Item>
                <Descriptions.Item label="난이도 시드">{detailTarget.profile.difficultySeed?.toFixed(2) ?? '-'}</Descriptions.Item>
                {detailTarget.language === WORD_LANGUAGE.KOREAN && (
                  <>
                    <Descriptions.Item label="자모 복잡도">{detailTarget.profile.jamoComplex?.toFixed(2) ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="이중모음 비율">{detailTarget.profile.diphthongRate?.toFixed(2) ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Shift 자모 비율">{detailTarget.profile.shiftJamoRate?.toFixed(2) ?? '-'}</Descriptions.Item>
                  </>
                )}
                {detailTarget.language === WORD_LANGUAGE.ENGLISH && (
                  <Descriptions.Item label="대소문자 전환 비율">{detailTarget.profile.caseFlipRate?.toFixed(2) ?? '-'}</Descriptions.Item>
                )}
              </>
            )}
            {detailTarget.typingStats && (
              <>
                <Descriptions.Item label="총 시도">{detailTarget.typingStats.totalAttemptsCount}</Descriptions.Item>
                <Descriptions.Item label="유효 시도">{detailTarget.typingStats.validAttemptsCount}</Descriptions.Item>
                <Descriptions.Item label="평균 시간">{detailTarget.typingStats.avgTimeMs?.toFixed(0)}ms</Descriptions.Item>
                <Descriptions.Item label="정답률">{detailTarget.typingStats.correctRate != null ? `${(detailTarget.typingStats.correctRate * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 수정 모달 */}
      <Modal title="단어 수정" open={editModalOpen} onOk={handleEdit} onCancel={() => { setEditModalOpen(false); setEditTarget(null); }} okText="수정" cancelText="취소">
        <div>
          <label>단어</label>
          <Input
            value={editForm.word}
            onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
            maxLength={20}
          />
        </div>
      </Modal>
    </div>
  );
}
