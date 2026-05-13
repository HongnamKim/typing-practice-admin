import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Tag, Button, Space, Modal, message, Typography, Popconfirm, Spin, Descriptions, DatePicker, Switch, Tabs } from 'antd';
import { PlusOutlined, ReloadOutlined, PushpinFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { announcementsApi } from '../api';
import { useCursorInfiniteScroll } from '../hooks';
import { formatDateTime, parseServerDate } from '../utils';
import LocalizedInput from '../components/LocalizedInput';

const { Title, Paragraph, Text } = Typography;

const emptyLocalized = () => ({ ko: '', en: null, ja: null });
const toKstString = (dt) => (dt ? dt.format('YYYY-MM-DDTHH:mm:ss') : null);
const fromServerToDayjs = (utcStr) => {
  const parsed = parseServerDate(utcStr);
  return parsed ? dayjs(parsed) : null;
};
const cursorKeys = { at: 'postedAt', cursorAtParam: 'cursorPostedAt' };

export default function AnnouncementsPage() {
  const filters = useMemo(() => ({}), []);

  const { data: items, loading, loadingMore, handleScroll, updateItem, removeItem, prependItem, refresh } =
    useCursorInfiniteScroll(announcementsApi.getList, filters, cursorKeys, '공지사항을 불러오는데 실패했습니다.');

  const [pinnedItems, setPinnedItems] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);

  const fetchPinned = useCallback(async () => {
    setPinnedLoading(true);
    try {
      const result = await announcementsApi.getPinned();
      setPinnedItems(result.items);
    } catch (error) {
      message.error('고정 공지 조회에 실패했습니다.');
    } finally {
      setPinnedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPinned();
  }, [fetchPinned]);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    postedAt: null,
    title: emptyLocalized(),
    content: emptyLocalized(),
    published: true,
    pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ postedAt: dayjs(), title: emptyLocalized(), content: emptyLocalized(), published: true, pinned: false });
    setFormModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditingId(record.id);
    setFormLoading(true);
    setFormModalOpen(true);
    try {
      const detail = await announcementsApi.getDetail(record.id);
      setForm({
        postedAt: fromServerToDayjs(detail.postedAt),
        title: detail.title,
        content: detail.content,
        published: detail.published,
        pinned: detail.pinned,
      });
    } catch (error) {
      message.error('공지사항 조회에 실패했습니다.');
      setFormModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.postedAt) { message.warning('게시 일시를 입력해주세요.'); return false; }
    if (!form.title.ko?.trim()) { message.warning('제목(한국어)을 입력해주세요.'); return false; }
    if (!form.content.ko?.trim()) { message.warning('본문(한국어)을 입력해주세요.'); return false; }
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        postedAt: toKstString(form.postedAt),
        title: form.title,
        content: form.content,
        published: form.published,
        pinned: form.pinned,
      };
      if (editingId) {
        const updated = await announcementsApi.update(editingId, payload);
        message.success('공지사항이 수정되었습니다.');
        if (updated.pinned) removeItem(editingId, 'id');
        else updateItem(editingId, updated, 'id');
        fetchPinned();
      } else {
        const created = await announcementsApi.create(payload);
        message.success('공지사항이 등록되었습니다.');
        if (created.pinned) fetchPinned();
        else prependItem(created);
      }
      setFormModalOpen(false);
    } catch (error) {
      message.error(`저장에 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, isPinned) => {
    try {
      await announcementsApi.delete(id);
      message.success('공지사항이 삭제되었습니다.');
      if (isPinned) fetchPinned();
      else removeItem(id, 'id');
      if (detailTarget?.id === id) closeDetail();
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };
  const openDetail = async (record) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detail = await announcementsApi.getDetail(record.id);
      setDetailTarget(detail);
    } catch (error) {
      message.error('공지사항 상세 조회에 실패했습니다.');
      setDetailTarget(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
        { title: '제목 (KO)', dataIndex: ['title', 'ko'], key: 'title', ellipsis: true },
        { title: '게시', dataIndex: 'published', key: 'published', width: 80, render: (v) => v ? <Tag color="green">게시</Tag> : <Tag>비공개</Tag> },
        { title: '고정', dataIndex: 'pinned', key: 'pinned', width: 60, render: (v) => v ? <PushpinFilled style={{ color: '#fa8c16' }} /> : null },
        { title: '게시일', dataIndex: 'postedAt', key: 'postedAt', width: 160, render: (v) => formatDateTime(v) },
    ];
    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>공지사항</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>새 공지</Button>
                    <Button icon={<ReloadOutlined />} onClick={() => { refresh(); fetchPinned(); }} loading={loading || pinnedLoading}>새로고침</Button>
                </Space>
            </div>

            {pinnedItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <Text strong><PushpinFilled style={{ color: '#fa8c16', marginRight: 4 }} />고정 공지</Text>
                    <Table
                        columns={columns}
                        dataSource={pinnedItems}
                        rowKey="id"
                        loading={pinnedLoading}
                        pagination={false}
                        size="small"
                        style={{ marginTop: 8 }}
                        onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
                    />
                </div>
            )}

            <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
                <Table
                    columns={columns}
                    dataSource={items}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    locale={{ emptyText: '공지사항이 없습니다.' }}
                    onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
                />
                {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
            </div>

            <Modal
                title={editingId ? '공지사항 수정' : '새 공지사항'}
                open={formModalOpen}
                onCancel={() => !submitting && setFormModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                okText={editingId ? '수정' : '등록'}
                cancelText="취소"
                width={720}
                destroyOnClose
            >
                {formLoading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div>
                            <Text strong>게시 일시 (KST) *</Text>
                            <DatePicker
                                showTime
                                value={form.postedAt}
                                onChange={(v) => setForm({ ...form, postedAt: v })}
                                style={{ width: '100%', marginTop: 8 }}
                                format="YYYY-MM-DD HH:mm"
                            />
                        </div>
                        <div>
                            <Text strong>제목 *</Text>
                            <LocalizedInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="공지 제목" />
                        </div>
                        <div>
                            <Text strong>본문 *</Text>
                            <LocalizedInput value={form.content} onChange={(v) => setForm({ ...form, content: v })} textarea rows={8} placeholder="공지 본문" />
                        </div>
                        <Space size="large">
                            <div><Text strong>게시 여부 </Text><Switch checked={form.published} onChange={(v) => setForm({ ...form, published: v })} /></div>
                            <div><Text strong>고정 </Text><Switch checked={form.pinned} onChange={(v) => setForm({ ...form, pinned: v })} /></div>
                        </Space>
                    </Space>
                )}
            </Modal>

            <Modal
                title="공지사항 상세"
                open={detailModalOpen}
                onCancel={closeDetail}
                width={720}
                footer={
                    detailTarget && (
                        <Space>
                            <Button onClick={() => { closeDetail(); openEdit(detailTarget); }}>수정</Button>
                            <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(detailTarget.id, detailTarget.pinned)} okText="삭제" cancelText="취소">
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
                        <Descriptions.Item label="게시일">{formatDateTime(detailTarget.postedAt)}</Descriptions.Item>
                        <Descriptions.Item label="게시 여부">{detailTarget.published ? <Tag color="green">게시</Tag> : <Tag>비공개</Tag>}</Descriptions.Item>
                        <Descriptions.Item label="고정">{detailTarget.pinned ? <Tag color="orange"><PushpinFilled /> 고정</Tag> : '-'}</Descriptions.Item>
                        <Descriptions.Item label="제목">
                            <Tabs
                                size="small"
                                items={['ko', 'en', 'ja'].map(lang => ({
                                    key: lang,
                                    label: lang.toUpperCase(),
                                    children: <div>{detailTarget.title?.[lang] ?? <Text type="secondary">없음</Text>}</div>,
                                }))}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="본문">
                            <Tabs
                                size="small"
                                items={['ko', 'en', 'ja'].map(lang => ({
                                    key: lang,
                                    label: lang.toUpperCase(),
                                    children: detailTarget.content?.[lang]
                                        ? <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{detailTarget.content[lang]}</Paragraph>
                                        : <Text type="secondary">없음</Text>,
                                }))}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label="생성일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
                        <Descriptions.Item label="수정일">{formatDateTime(detailTarget.updatedAt)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}
