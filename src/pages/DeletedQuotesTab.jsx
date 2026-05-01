import { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message, Typography, Spin, Descriptions, Alert } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { quotesApi } from '../api';
import { useInfiniteScroll } from '../hooks';
import { QUOTE_STATUS_COLORS, QUOTE_TYPE_COLORS } from '../constants';
import { formatDateTime } from '../utils';

const { Text, Paragraph } = Typography;

export default function DeletedQuotesTab() {
  const [target, setTarget] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const filters = useMemo(() => ({}), []);

  const { data: quotes, loading, loadingMore, handleScroll, removeItem, refresh } = useInfiniteScroll(
    quotesApi.getDeletedList,
    filters,
    '삭제된 문장 목록을 불러오는데 실패했습니다.'
  );

  const openConfirm = (record) => {
    setTarget(record);
    setConfirmInput('');
  };

  const closeConfirm = () => {
    if (deleting) return;
    setTarget(null);
    setConfirmInput('');
  };

  const handlePermanentDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await quotesApi.permanentDelete(target.quoteId);
      message.success(`문장 #${target.quoteId}이 영구 삭제되었습니다.`);
      removeItem(target.quoteId, 'quoteId');
      setTarget(null);
      setConfirmInput('');
    } catch (error) {
      message.error(`영구 삭제에 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const isInputMatch = target && confirmInput.trim() === String(target.quoteId);

  const columns = [
    { title: 'ID', dataIndex: 'quoteId', key: 'quoteId', width: 70 },
    { title: '문장', dataIndex: 'sentence', key: 'sentence', ellipsis: true },
    { title: '출처', dataIndex: 'author', key: 'author', width: 120, render: (v) => v || '-' },
    { title: '언어', dataIndex: 'language', key: 'language', width: 80 },
    { title: '타입', dataIndex: 'type', key: 'type', width: 90, render: (type) => <Tag color={QUOTE_TYPE_COLORS[type]}>{type}</Tag> },
    { title: '삭제 시점 상태', dataIndex: 'status', key: 'status', width: 130, render: (status) => <Tag color={QUOTE_STATUS_COLORS[status]}>{status}</Tag> },
    { title: '삭제일', dataIndex: 'deletedAt', key: 'deletedAt', width: 160, render: (v) => formatDateTime(v) },
  ];

  return (
    <div>
      <Alert
        message="삭제된 문장 목록"
        description="논리 삭제된 문장입니다. 행을 클릭하여 영구 삭제할 수 있으며, 영구 삭제는 되돌릴 수 없습니다."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>새로고침</Button>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="quoteId"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '삭제된 문장이 없습니다.' }}
          onRow={(record) => ({ onClick: () => openConfirm(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>영구 삭제 확인</span>
          </Space>
        }
        open={!!target}
        onCancel={closeConfirm}
        closable={!deleting}
        maskClosable={!deleting}
        width={600}
        footer={
          <Space>
            <Button onClick={closeConfirm} disabled={deleting}>취소</Button>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={deleting}
              disabled={!isInputMatch}
              onClick={handlePermanentDelete}
            >
              영구 삭제
            </Button>
          </Space>
        }
      >
        {target && (
          <>
            <Alert
              message="이 작업은 되돌릴 수 없습니다."
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>문장 본문 및 메타데이터</li>
                  <li>해당 문장의 모든 타이핑 통계</li>
                  <li>해당 문장의 모든 사용자 타이핑 기록</li>
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{target.quoteId}</Descriptions.Item>
              <Descriptions.Item label="문장">
                <Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {target.sentence}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="출처">{target.author || '-'}</Descriptions.Item>
              <Descriptions.Item label="언어">{target.language}</Descriptions.Item>
              <Descriptions.Item label="삭제일">{formatDateTime(target.deletedAt)}</Descriptions.Item>
            </Descriptions>

            <div>
              <Text>확인을 위해 문장 ID <Text strong code>{target.quoteId}</Text>를 입력하세요:</Text>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`${target.quoteId} 입력`}
                disabled={deleting}
                style={{ marginTop: 8 }}
                status={confirmInput && !isInputMatch ? 'error' : ''}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
