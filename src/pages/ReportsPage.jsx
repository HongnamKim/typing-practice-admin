import { useState, useMemo } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Input, message, Typography, Popconfirm, Spin, Descriptions } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { reportsApi } from '../api';
import { useInfiniteScroll } from '../hooks';
import { REPORT_STATUS, REPORT_STATUS_COLORS, REPORT_STATUS_OPTIONS, REPORT_REASON_LABELS, REPORT_ORDER_OPTIONS } from '../constants';
import { formatDate, formatDateTime } from '../utils';

const { Title, Text } = Typography;

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processForm, setProcessForm] = useState({ sentence: '', author: '' });

  const filters = useMemo(() => {
    const f = { orderBy, sortDirection };
    if (statusFilter) f.status = statusFilter;
    return f;
  }, [statusFilter, orderBy, sortDirection]);

  const { data: reports, loading, loadingMore, handleScroll, removeItem, refresh } = useInfiniteScroll(
    reportsApi.getList,
    filters,
    '신고 목록을 불러오는데 실패했습니다.'
  );

  const openProcessModal = () => {
    setProcessForm({ sentence: detailTarget.quote?.sentence || '', author: detailTarget.quote?.author || '' });
    setProcessModalOpen(true);
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };

  const handleProcess = async (deleteQuote = false) => {
    try {
      const data = deleteQuote ? { sentence: null, author: null } : { sentence: processForm.sentence, author: processForm.author };
      await reportsApi.process(detailTarget.quote.quoteId, data);
      message.success(deleteQuote ? '문장이 삭제되었습니다.' : '신고가 처리되었습니다.');
      setProcessModalOpen(false);
      closeDetail();
      refresh();
    } catch (error) {
      message.error('처리에 실패했습니다.');
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportsApi.delete(reportId);
      message.success('신고가 삭제되었습니다.');
      removeItem(reportId);
      if (detailTarget?.id === reportId) {
        closeDetail();
      }
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const openDetail = (record) => {
    setDetailTarget(record);
    setDetailModalOpen(true);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '사유', dataIndex: 'reason', key: 'reason', width: 100, render: (reason) => REPORT_REASON_LABELS[reason] || reason },
    { title: '상세', dataIndex: 'detail', key: 'detail', ellipsis: true, render: (detail) => detail || '-' },
    { title: '상태', dataIndex: 'status', key: 'status', width: 100, render: (status) => <Tag color={REPORT_STATUS_COLORS[status]}>{status}</Tag> },
    { title: '문장', key: 'quote', ellipsis: true, render: (_, record) => record.quoteDeleted ? <Text type="secondary">(삭제됨)</Text> : record.quote?.sentence },
    { title: '신고자', key: 'member', width: 120, render: (_, record) => record.member?.nickname || record.member?.email },
    { title: '신고일', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: formatDate },
  ];

  const renderDetailActions = () => {
    if (!detailTarget) return null;
    return (
      <Space>
        {detailTarget.status === REPORT_STATUS.PENDING && !detailTarget.quoteDeleted && (
          <Button type="primary" onClick={openProcessModal}>처리</Button>
        )}
        <Popconfirm title="신고를 삭제하시겠습니까?" onConfirm={() => handleDeleteReport(detailTarget.id)} okText="삭제" cancelText="취소">
          <Button danger>삭제</Button>
        </Popconfirm>
        <Button onClick={closeDetail}>닫기</Button>
      </Space>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>신고 관리</Title>
        <Space>
          <Select placeholder="상태 필터" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter} options={REPORT_STATUS_OPTIONS} />
          <Select style={{ width: 100 }} value={orderBy} onChange={setOrderBy} options={REPORT_ORDER_OPTIONS} />
          <Button
            icon={sortDirection === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
          />
        </Space>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={false}
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>

      {/* 상세 보기 모달 */}
      <Modal title="신고 상세" open={detailModalOpen} onCancel={closeDetail} footer={renderDetailActions()} width={600}>
        {detailTarget && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailTarget.id}</Descriptions.Item>
            <Descriptions.Item label="신고 사유">{REPORT_REASON_LABELS[detailTarget.reason] || detailTarget.reason}</Descriptions.Item>
            <Descriptions.Item label="상세 내용">{detailTarget.detail || '-'}</Descriptions.Item>
            <Descriptions.Item label="상태"><Tag color={REPORT_STATUS_COLORS[detailTarget.status]}>{detailTarget.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="신고된 문장">
              {detailTarget.quoteDeleted ? <Text type="secondary">(삭제됨)</Text> : <Text style={{ whiteSpace: 'pre-wrap' }}>{detailTarget.quote?.sentence}</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="문장 출처">{detailTarget.quoteDeleted ? '-' : (detailTarget.quote?.author || '-')}</Descriptions.Item>
            <Descriptions.Item label="신고자">{detailTarget.member?.nickname || detailTarget.member?.email}</Descriptions.Item>
            <Descriptions.Item label="신고일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 처리 모달 */}
      <Modal title="신고 처리" open={processModalOpen} onCancel={() => setProcessModalOpen(false)} footer={null} width={600}>
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <Text strong>신고 사유: </Text>{REPORT_REASON_LABELS[detailTarget?.reason] || detailTarget?.reason}<br />
          <Text strong>상세 내용: </Text>{detailTarget?.detail || '-'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>문장</label>
          <Input.TextArea value={processForm.sentence} onChange={(e) => setProcessForm({ ...processForm, sentence: e.target.value })} rows={4} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>출처</label>
          <Input value={processForm.author} onChange={(e) => setProcessForm({ ...processForm, author: e.target.value })} />
        </div>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setProcessModalOpen(false)}>취소</Button>
          <Popconfirm title="문장을 삭제하시겠습니까?" onConfirm={() => handleProcess(true)} okText="삭제" cancelText="취소">
            <Button danger>문장 삭제</Button>
          </Popconfirm>
          <Button type="primary" onClick={() => handleProcess(false)}>수정 후 처리</Button>
        </Space>
      </Modal>
    </div>
  );
}
