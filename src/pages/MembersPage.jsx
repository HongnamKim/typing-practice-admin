import { useState, useMemo } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Input, message, Typography, Spin, Descriptions } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { membersApi } from '../api';
import { useInfiniteScroll } from '../hooks';
import { ROLE, ROLE_COLORS, ROLE_OPTIONS, MEMBER_ORDER_OPTIONS } from '../constants';
import { formatDate, formatDateTime } from '../utils';

const { Title } = Typography;

const ROLE_CHANGE_OPTIONS = [
  { value: ROLE.USER, label: <Tag color={ROLE_COLORS[ROLE.USER]}>USER</Tag> },
  { value: ROLE.ADMIN, label: <Tag color={ROLE_COLORS[ROLE.ADMIN]}>ADMIN</Tag> },
];

export default function MembersPage() {
  const [roleFilter, setRoleFilter] = useState(null);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const [adminConfirmOpen, setAdminConfirmOpen] = useState(false);
  const [adminConfirmTarget, setAdminConfirmTarget] = useState(null);

  const filters = useMemo(() => {
    const f = { orderBy, sortDirection };
    if (roleFilter) f.role = roleFilter;
    return f;
  }, [roleFilter, orderBy, sortDirection]);

  const { data: members, loading, loadingMore, handleScroll, updateItem } = useInfiniteScroll(
    membersApi.getList,
    filters,
    '회원 목록을 불러오는데 실패했습니다.'
  );

  const executeRoleChange = async (memberId, newRole) => {
    try {
      await membersApi.changeRole(memberId, newRole);
      message.success('권한이 변경되었습니다.');
      updateItem(memberId, { role: newRole });
      if (detailTarget?.id === memberId) {
        setDetailTarget(prev => ({ ...prev, role: newRole }));
      }
    } catch (error) {
      message.error('권한 변경에 실패했습니다.');
    }
  };

  const handleRoleChange = (memberId, newRole) => {
    if (newRole === ROLE.ADMIN) {
      const member = members.find(m => m.id === memberId) || detailTarget;
      setAdminConfirmTarget({ ...member, newRole });
      setAdminConfirmOpen(true);
      return;
    }
    executeRoleChange(memberId, newRole);
  };

  const handleAdminConfirm = async () => {
    await executeRoleChange(adminConfirmTarget.id, adminConfirmTarget.newRole);
    setAdminConfirmOpen(false);
    setAdminConfirmTarget(null);
  };

  const handleBan = async () => {
    try {
      await membersApi.ban(banTarget.id, banReason || null);
      message.success('회원이 차단되었습니다.');
      setBanModalOpen(false);
      updateItem(banTarget.id, { role: ROLE.BANNED });
      if (detailTarget?.id === banTarget.id) {
        setDetailTarget(prev => ({ ...prev, role: ROLE.BANNED }));
      }
      setBanTarget(null);
      setBanReason('');
    } catch (error) {
      message.error('차단에 실패했습니다.');
    }
  };

  const handleUnban = async (memberId) => {
    try {
      await membersApi.unban(memberId);
      message.success('차단이 해제되었습니다.');
      updateItem(memberId, { role: ROLE.USER });
      if (detailTarget?.id === memberId) {
        setDetailTarget(prev => ({ ...prev, role: ROLE.USER }));
      }
    } catch (error) {
      message.error('차단 해제에 실패했습니다.');
    }
  };

  const openDetail = (record) => {
    setDetailTarget(record);
    setDetailModalOpen(true);
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetailTarget(null);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { title: '닉네임', dataIndex: 'nickname', key: 'nickname' },
    { title: '권한', dataIndex: 'role', key: 'role', render: (role) => <Tag color={ROLE_COLORS[role]}>{role}</Tag> },
    { title: '가입일', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>회원 관리</Title>
        <Space>
          <Select placeholder="권한 필터" allowClear style={{ width: 120 }} value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} />
          <Select style={{ width: 100 }} value={orderBy} onChange={setOrderBy} options={MEMBER_ORDER_OPTIONS} />
          <Button
            icon={sortDirection === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
            onClick={() => setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
          />
        </Space>
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={false}
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
        {loadingMore && <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>}
      </div>

      {/* 상세 보기 모달 */}
      <Modal
        title="회원 상세"
        open={detailModalOpen}
        onCancel={closeDetail}
        footer={
          <Space>
            {detailTarget?.role === ROLE.BANNED ? (
              <Button onClick={() => handleUnban(detailTarget.id)}>차단 해제</Button>
            ) : (
              <Button danger onClick={() => { setBanTarget(detailTarget); setBanModalOpen(true); }}>차단</Button>
            )}
            <Button onClick={closeDetail}>닫기</Button>
          </Space>
        }
        width={500}
      >
        {detailTarget && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailTarget.id}</Descriptions.Item>
            <Descriptions.Item label="이메일">{detailTarget.email}</Descriptions.Item>
            <Descriptions.Item label="닉네임">{detailTarget.nickname}</Descriptions.Item>
            <Descriptions.Item label="권한">
              <Select
                value={detailTarget.role}
                style={{ width: 120 }}
                onChange={(value) => handleRoleChange(detailTarget.id, value)}
                options={ROLE_CHANGE_OPTIONS}
                disabled={detailTarget.role === ROLE.BANNED}
              />
            </Descriptions.Item>
            <Descriptions.Item label="가입일">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 차단 모달 */}
      <Modal
        title="회원 차단"
        open={banModalOpen}
        onOk={handleBan}
        onCancel={() => { setBanModalOpen(false); setBanTarget(null); setBanReason(''); }}
        okText="차단"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <p><strong>{banTarget?.nickname || banTarget?.email}</strong>님을 차단하시겠습니까?</p>
        <Input.TextArea placeholder="차단 사유 (선택)" value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={3} />
      </Modal>

      {/* 관리자 권한 부여 확인 모달 */}
      <Modal
        title="관리자 권한 부여"
        open={adminConfirmOpen}
        onOk={handleAdminConfirm}
        onCancel={() => { setAdminConfirmOpen(false); setAdminConfirmTarget(null); }}
        okText="확인"
        cancelText="취소"
      >
        <p>다음 회원에게 관리자 권한을 부여하시겠습니까?</p>
        <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="이메일">{adminConfirmTarget?.email}</Descriptions.Item>
          <Descriptions.Item label="닉네임">{adminConfirmTarget?.nickname}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
}
