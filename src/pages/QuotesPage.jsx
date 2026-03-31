import { useState, useMemo, useRef } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Input, message, Typography, Popconfirm, Spin, Descriptions, Progress } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined, UploadOutlined } from '@ant-design/icons';
import { quotesApi } from '../api';
import { useInfiniteScroll } from '../hooks';
import { QUOTE_STATUS, QUOTE_STATUS_COLORS, QUOTE_STATUS_OPTIONS, QUOTE_TYPE, QUOTE_TYPE_COLORS, QUOTE_TYPE_OPTIONS, QUOTE_ORDER_OPTIONS } from '../constants';
import { formatDateTime } from '../utils';
import { defaultQuotes } from '../const/default-quotes.const';

const { Title, Text } = Typography;
const BATCH_SIZE = 50;

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ sentence: '', author: '' });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 기본 문장 업로드 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const cancelRef = useRef(false);

  const filters = useMemo(() => {
    const f = { orderBy, sortDirection };
    if (statusFilter) f.status = statusFilter;
    if (typeFilter) f.type = typeFilter;
    return f;
  }, [statusFilter, typeFilter, orderBy, sortDirection]);

  const { data: quotes, loading, loadingMore, handleScroll, updateItem, removeItem, refresh } = useInfiniteScroll(
    quotesApi.getList,
    filters,
    '문장 목록을 불러오는데 실패했습니다.'
  );

  const updateQuoteState = (quoteId, updates) => {
    updateItem(quoteId, updates, 'quoteId');
    if (detailTarget?.quoteId === quoteId) {
      setDetailTarget(prev => ({ ...prev, ...updates }));
    }
  };

  const handleApprove = async (quoteId) => {
    try {
      await quotesApi.approve(quoteId);
      message.success('문장이 승인되었습니다.');
      updateQuoteState(quoteId, { status: QUOTE_STATUS.ACTIVE });
    } catch (error) {
      message.error('승인에 실패했습니다.');
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await quotesApi.reject(quoteId);
      message.success('문장이 거부되었습니다.');
      updateQuoteState(quoteId, { type: QUOTE_TYPE.PRIVATE, status: QUOTE_STATUS.ACTIVE });
    } catch (error) {
      message.error('거부에 실패했습니다.');
    }
  };

  const handleDelete = async (quoteId) => {
    try {
      await quotesApi.delete(quoteId);
      message.success('문장이 삭제되었습니다.');
      removeItem(quoteId, 'quoteId');
      if (detailTarget?.quoteId === quoteId) {
        closeDetail();
      }
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleHide = async (quoteId) => {
    try {
      await quotesApi.hide(quoteId);
      message.success('문장이 숨김 처리되었습니다.');
      updateQuoteState(quoteId, { status: QUOTE_STATUS.HIDDEN });
    } catch (error) {
      message.error('숨김 처리에 실패했습니다.');
    }
  };

  const handleRestore = async (quoteId) => {
    try {
      await quotesApi.restore(quoteId);
      message.success('문장이 복원되었습니다.');
      updateQuoteState(quoteId, { status: QUOTE_STATUS.ACTIVE });
    } catch (error) {
      message.error('복원에 실패했습니다.');
    }
  };

  const handleEdit = async () => {
    try {
      const data = {};
      if (editForm.sentence !== editTarget.sentence) data.sentence = editForm.sentence;
      if (editForm.author !== editTarget.author) data.author = editForm.author;

      if (Object.keys(data).length === 0) {
        message.info('변경된 내용이 없습니다.');
        return;
      }

      await quotesApi.update(editTarget.quoteId, data);
      message.success('문장이 수정되었습니다.');
      updateQuoteState(editTarget.quoteId, editForm);
      setEditModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      message.error('수정에 실패했습니다.');
    }
  };

  const openEditModal = (record) => {
    setEditTarget(record);
    setEditForm({ sentence: record.sentence, author: record.author || '' });
    setEditModalOpen(true);
  };

  const handleDefaultUpload = async () => {
    const total = defaultQuotes.length;
    setUploadProgress({ current: 0, total, success: 0, fail: 0 });
    setUploading(true);
    cancelRef.current = false;

    let success = 0;
    let fail = 0;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      if (cancelRef.current) break;

      const batch = defaultQuotes.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((quote) =>
          quotesApi.createPublic(quote).then((created) => quotesApi.approve(created.quoteId))
        )
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

  const openDetail = async (record) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await quotesApi.getDetail(record.quoteId);
      setDetailTarget(data);
    } catch (error) {
      message.error('문장 상세 조회에 실패했습니다.');
      setDetailTarget(record);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };

  const columns = [
    { title: 'ID', dataIndex: 'quoteId', key: 'quoteId', width: 70 },
    { title: '문장', dataIndex: 'sentence', key: 'sentence', ellipsis: true },
    { title: '출처', dataIndex: 'author', key: 'author', width: 120, render: (author) => author || '-' },
    { title: '언어', dataIndex: 'language', key: 'language', width: 80 },
    { title: '난이도', dataIndex: 'difficulty', key: 'difficulty', width: 80, render: (v) => v != null ? v.toFixed(1) : '-' },
    { title: '타입', dataIndex: 'type', key: 'type', width: 90, render: (type) => <Tag color={QUOTE_TYPE_COLORS[type]}>{type}</Tag> },
    { title: '상태', dataIndex: 'status', key: 'status', width: 90, render: (status) => <Tag color={QUOTE_STATUS_COLORS[status]}>{status}</Tag> },
    { title: '신고', dataIndex: 'reportCount', key: 'reportCount', width: 60, render: (count) => (count > 0 ? <Tag color="red">{count}</Tag> : count) },
  ];

  const renderDetailActions = () => {
    if (!detailTarget) return null;
    const { quoteId, status, type } = detailTarget;
    return (
      <Space>
        {status === QUOTE_STATUS.PENDING && type === QUOTE_TYPE.PUBLIC && (
          <>
            <Button type="primary" onClick={() => handleApprove(quoteId)}>승인</Button>
            <Button onClick={() => handleReject(quoteId)}>거부</Button>
          </>
        )}
        {type === QUOTE_TYPE.PUBLIC && <Button onClick={() => openEditModal(detailTarget)}>수정</Button>}
        {status === QUOTE_STATUS.ACTIVE && <Button onClick={() => handleHide(quoteId)}>숨김</Button>}
        {status === QUOTE_STATUS.HIDDEN && <Button onClick={() => handleRestore(quoteId)}>복원</Button>}
        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(quoteId)} okText="삭제" cancelText="취소">
          <Button danger>삭제</Button>
        </Popconfirm>
        <Button onClick={closeDetail}>닫기</Button>
      </Space>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>문장 관리</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>기본 문장 업로드</Button>
          <Select placeholder="상태 필터" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter} options={QUOTE_STATUS_OPTIONS} />
          <Select placeholder="타입 필터" allowClear style={{ width: 120 }} value={typeFilter} onChange={setTypeFilter} options={QUOTE_TYPE_OPTIONS} />
          <Select style={{ width: 100 }} value={orderBy} onChange={setOrderBy} options={QUOTE_ORDER_OPTIONS} />
          <Button
            icon={sortDirection === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
          />
        </Space>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="quoteId"
          loading={loading}
          pagination={false}
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>

      {/* 기본 문장 업로드 모달 */}
      <Modal
        title="기본 문장 업로드"
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
            <p>기본 문장 <strong>{defaultQuotes.length}개</strong>를 업로드합니다.</p>
            <p><Text type="secondary">문장은 자동 승인되어 바로 사용 가능합니다.</Text></p>
          </div>
        )}
      </Modal>

      {/* 상세 보기 모달 */}
      <Modal title="문장 상세" open={detailModalOpen} onCancel={closeDetail} footer={renderDetailActions()} width={600}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : detailTarget && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailTarget.quoteId}</Descriptions.Item>
            <Descriptions.Item label="문장"><Text style={{ whiteSpace: 'pre-wrap' }}>{detailTarget.sentence}</Text></Descriptions.Item>
            <Descriptions.Item label="출처">{detailTarget.author || '-'}</Descriptions.Item>
            <Descriptions.Item label="언어">{detailTarget.language}</Descriptions.Item>
            <Descriptions.Item label="난이도">{detailTarget.difficulty != null ? detailTarget.difficulty.toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="타입"><Tag color={QUOTE_TYPE_COLORS[detailTarget.type]}>{detailTarget.type}</Tag></Descriptions.Item>
            <Descriptions.Item label="상태"><Tag color={QUOTE_STATUS_COLORS[detailTarget.status]}>{detailTarget.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="신고 수">{detailTarget.reportCount > 0 ? <Tag color="red">{detailTarget.reportCount}</Tag> : detailTarget.reportCount}</Descriptions.Item>
            <Descriptions.Item label="생성일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="수정일">{formatDateTime(detailTarget.updatedAt)}</Descriptions.Item>
            {detailTarget.typingStats && (
              <>
                <Descriptions.Item label="총 시도">{detailTarget.typingStats.totalAttemptsCount}</Descriptions.Item>
                <Descriptions.Item label="유효 시도">{detailTarget.typingStats.validAttemptsCount}</Descriptions.Item>
                <Descriptions.Item label="평균 CPM">{detailTarget.typingStats.avgCpm?.toFixed(1) ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="평균 정확도">{detailTarget.typingStats.avgAcc != null ? `${(detailTarget.typingStats.avgAcc * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
                <Descriptions.Item label="평균 초기화">{detailTarget.typingStats.avgResetCount?.toFixed(1) ?? '-'}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 수정 모달 */}
      <Modal title="문장 수정" open={editModalOpen} onOk={handleEdit} onCancel={() => { setEditModalOpen(false); setEditTarget(null); }} okText="수정" cancelText="취소">
        <div style={{ marginBottom: 16 }}>
          <label>문장</label>
          <Input.TextArea value={editForm.sentence} onChange={(e) => setEditForm({ ...editForm, sentence: e.target.value })} rows={4} />
        </div>
        <div>
          <label>출처</label>
          <Input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
