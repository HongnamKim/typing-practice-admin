import { useState, useMemo, useRef } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message, Typography, Popconfirm, Spin, Descriptions, DatePicker, Switch, Tabs } from 'antd';
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { updateNotesApi } from '../api';
import { useCursorInfiniteScroll } from '../hooks';
import { formatDateTime, parseServerDate } from '../utils';
import LocalizedInput from '../components/LocalizedInput';

const { Title, Text } = Typography;
let itemKeyCounter = 0;
const generateItemKey = () => `item-${++itemKeyCounter}`;
const emptyLocalizedItem = () => ({ _key: generateItemKey(), ko: '', en: null, ja: null });
const withItemKey = (item) => ({ ...item, _key: generateItemKey() });
const stripItemKey = ({ _key, ...rest }) => rest;
const toKstString = (dt) => (dt ? dt.format('YYYY-MM-DDTHH:mm:ss') : null);
const fromServerToDayjs = (utcStr) => {
  const parsed = parseServerDate(utcStr);
  return parsed ? dayjs(parsed) : null;
};
const cursorKeys = { at: 'releasedAt', cursorAtParam: 'cursorReleasedAt' };
const VERSION_REGEX = /^v\d+\.\d+\.\d+$/;
export default function UpdateNotesPage() {
  const filters = useMemo(() => ({}), []);

  const { data: items, loading, loadingMore, handleScroll, updateItem, removeItem, prependItem, refresh } =
    useCursorInfiniteScroll(updateNotesApi.getList, filters, cursorKeys, '업데이트 노트를 불러오는데 실패했습니다.');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    version: '',
    releasedAt: null,
    newFeatures: [],
    improvements: [],
    published: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const editRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const openCreate = () => {
    setEditingId(null);
    setForm({ version: '', releasedAt: dayjs(), newFeatures: [], improvements: [], published: true });
    setFormModalOpen(true);
  };

  const openEdit = async (record) => {
    const requestId = ++editRequestIdRef.current;
    setEditingId(record.id);
    setFormLoading(true);
    setFormModalOpen(true);
    try {
      const detail = await updateNotesApi.getDetail(record.id);
      if (requestId !== editRequestIdRef.current) return;
      setForm({
        version: detail.version,
        releasedAt: fromServerToDayjs(detail.releasedAt),
        newFeatures: (detail.newFeatures || []).map(withItemKey),
        improvements: (detail.improvements || []).map(withItemKey),
        published: detail.published,
      });
    } catch (error) {
      if (requestId !== editRequestIdRef.current) return;
      message.error('업데이트 노트 조회에 실패했습니다.');
      setFormModalOpen(false);
    } finally {
      if (requestId === editRequestIdRef.current) {
        setFormLoading(false);
      }
    }
  };

  const validateForm = () => {
    if (!form.version?.trim()) { message.warning('버전을 입력해주세요.'); return false; }
    if (!VERSION_REGEX.test(form.version.trim())) { message.warning('버전 형식이 잘못되었습니다. (예: v1.8.1)'); return false; }
    if (!form.releasedAt) { message.warning('배포 일시를 입력해주세요.'); return false; }
    for (const item of form.newFeatures) {
      if (!item.ko?.trim()) { message.warning('새 기능 항목의 한국어 텍스트를 입력해주세요.'); return false; }
    }
    for (const item of form.improvements) {
      if (!item.ko?.trim()) { message.warning('개선 항목의 한국어 텍스트를 입력해주세요.'); return false; }
    }
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        version: form.version.trim(),
        releasedAt: toKstString(form.releasedAt),
        newFeatures: form.newFeatures.map(stripItemKey),
        improvements: form.improvements.map(stripItemKey),
        published: form.published,
      };
      if (editingId) {
        const updated = await updateNotesApi.update(editingId, payload);
        message.success('업데이트 노트가 수정되었습니다.');
        updateItem(editingId, updated, 'id');
      } else {
        const created = await updateNotesApi.create(payload);
        message.success('업데이트 노트가 등록되었습니다.');
        prependItem(created);
      }
      setFormModalOpen(false);
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        message.error('이미 존재하는 버전입니다.');
      } else {
        message.error(`저장에 실패했습니다: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await updateNotesApi.delete(id);
      message.success('업데이트 노트가 삭제되었습니다.');
      removeItem(id, 'id');
      if (detailTarget?.id === id) closeDetail();
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };
  const openDetail = async (record) => {
    const requestId = ++detailRequestIdRef.current;
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detail = await updateNotesApi.getDetail(record.id);
      if (requestId !== detailRequestIdRef.current) return;
      setDetailTarget(detail);
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return;
      message.error('업데이트 노트 상세 조회에 실패했습니다.');
      setDetailTarget(null);
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };
  const addItem = (key) => {
    setForm({ ...form, [key]: [...form[key], emptyLocalizedItem()] });
  };

  const updateItemAt = (key, idx, value) => {
    const next = [...form[key]];
    next[idx] = { ...value, _key: form[key][idx]._key };
    setForm({ ...form, [key]: next });
  };

  const removeItemAt = (key, idx) => {
    const next = form[key].filter((_, i) => i !== idx);
    setForm({ ...form, [key]: next });
  };
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '버전', dataIndex: 'version', key: 'version', width: 120, render: (v) => <Tag>{v}</Tag> },
    { title: '새 기능', dataIndex: 'newFeatures', key: 'newFeatures', width: 90, render: (arr) => arr?.length || 0 },
    { title: '개선', dataIndex: 'improvements', key: 'improvements', width: 70, render: (arr) => arr?.length || 0 },
    { title: '게시', dataIndex: 'published', key: 'published', width: 80, render: (v) => v ? <Tag color="green">게시</Tag> : <Tag>비공개</Tag> },
    { title: '배포일', dataIndex: 'releasedAt', key: 'releasedAt', width: 160, render: (v) => formatDateTime(v) },
  ];
  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>업데이트 노트</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>새 노트</Button>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>새로고침</Button>
        </Space>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '업데이트 노트가 없습니다.' }}
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>
      <Modal
        title={editingId ? '업데이트 노트 수정' : '새 업데이트 노트'}
        open={formModalOpen}
        onCancel={() => !submitting && setFormModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingId ? '수정' : '등록'}
        cancelText="취소"
        width={800}
        destroyOnClose
      >
        {formLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>버전 *</Text>
              <Input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="v1.8.1"
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>배포 일시 (KST) *</Text>
              <DatePicker
                showTime
                value={form.releasedAt}
                onChange={(v) => setForm({ ...form, releasedAt: v })}
                style={{ width: '100%', marginTop: 8 }}
                format="YYYY-MM-DD HH:mm"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>새 기능</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => addItem('newFeatures')}>항목 추가</Button>
              </div>
              {form.newFeatures.length === 0 && <Text type="secondary">항목이 없습니다.</Text>}
              {form.newFeatures.map((item, idx) => (
                <div key={item._key} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text type="secondary">#{idx + 1}</Text>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItemAt('newFeatures', idx)} />
                  </div>
                  <LocalizedInput value={item} onChange={(v) => updateItemAt('newFeatures', idx, v)} placeholder="새 기능 내용" />
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>개선 사항</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => addItem('improvements')}>항목 추가</Button>
              </div>
              {form.improvements.length === 0 && <Text type="secondary">항목이 없습니다.</Text>}
              {form.improvements.map((item, idx) => (
                <div key={item._key} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text type="secondary">#{idx + 1}</Text>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItemAt('improvements', idx)} />
                  </div>
                  <LocalizedInput value={item} onChange={(v) => updateItemAt('improvements', idx, v)} placeholder="개선 사항 내용" />
                </div>
              ))}
            </div>
            <div>
              <Text strong>게시 여부 </Text>
              <Switch checked={form.published} onChange={(v) => setForm({ ...form, published: v })} />
            </div>
          </Space>
        )}
      </Modal>
      <Modal
        title="업데이트 노트 상세"
        open={detailModalOpen}
        onCancel={closeDetail}
        width={800}
        footer={
          detailTarget && (
            <Space>
              <Button onClick={() => { closeDetail(); openEdit(detailTarget); }}>수정</Button>
              <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(detailTarget.id)} okText="삭제" cancelText="취소">
                <Button danger>삭제</Button>
              </Popconfirm>
              <Button onClick={closeDetail}>닫기</Button>
            </Space>
          )
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : detailTarget && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailTarget.id}</Descriptions.Item>
            <Descriptions.Item label="버전"><Tag>{detailTarget.version}</Tag></Descriptions.Item>
            <Descriptions.Item label="배포일">{formatDateTime(detailTarget.releasedAt)}</Descriptions.Item>
            <Descriptions.Item label="게시 여부">{detailTarget.published ? <Tag color="green">게시</Tag> : <Tag>비공개</Tag>}</Descriptions.Item>
            <Descriptions.Item label="새 기능">
              {detailTarget.newFeatures?.length > 0 ? (
                <Tabs
                  size="small"
                  items={['ko', 'en', 'ja'].map(lang => ({
                    key: lang,
                    label: lang.toUpperCase(),
                    children: (
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {detailTarget.newFeatures.map((item, idx) => (
                          <li key={idx}>{item[lang] ?? <Text type="secondary">없음</Text>}</li>
                        ))}
                      </ul>
                    ),
                  }))}
                />
              ) : <Text type="secondary">없음</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="개선 사항">
              {detailTarget.improvements?.length > 0 ? (
                <Tabs
                  size="small"
                  items={['ko', 'en', 'ja'].map(lang => ({
                    key: lang,
                    label: lang.toUpperCase(),
                    children: (
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {detailTarget.improvements.map((item, idx) => (
                          <li key={idx}>{item[lang] ?? <Text type="secondary">없음</Text>}</li>
                        ))}
                      </ul>
                    ),
                  }))}
                />
              ) : <Text type="secondary">없음</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="생성일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="수정일">{formatDateTime(detailTarget.updatedAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
