import { useState } from 'react';
import { Button, Card, Space, Typography, message, DatePicker, Row, Col, Divider } from 'antd';
import { ThunderboltOutlined, SyncOutlined } from '@ant-design/icons';
import { statsApi } from '../api';

const { Title, Text } = Typography;

const QUOTE_JOBS = [
  {
    key: 'difficulty',
    title: '동적 난이도 보정 (올인원)',
    description: '문장별 타이핑 통계 → 전역 통계 → 난이도 보정을 순서대로 실행합니다.',
    api: () => statsApi.recalculateDifficulty(),
    primary: true,
  },
  {
    key: 'quoteTyping',
    title: '문장별 타이핑 통계 재계산',
    description: 'MongoDB 집계 → PostgreSQL overwrite',
    api: () => statsApi.recalculateQuoteTyping(),
  },
  {
    key: 'globalQuote',
    title: '전역 문장 통계 재계산',
    description: '전역 μ/σ 재계산. 변화율 초과 시 전체 difficultySeed 재계산',
    api: () => statsApi.recalculateGlobalQuote(),
  },
];

const MEMBER_JOBS = [
  {
    key: 'memberTyping',
    title: '개인 타이핑 통계 재계산',
    description: 'MemberTypingStats 전체 재계산',
    api: () => statsApi.recalculateMemberTyping(),
  },
  {
    key: 'memberTypo',
    title: '개인 오타 통계 재계산',
    description: 'MemberTypoStats 전체 재계산',
    api: () => statsApi.recalculateMemberTypo(),
  },
];

function BatchCard({ job, loading, onRun }) {
  return (
    <Col span={8}>
      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>{job.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{job.description}</Text>
          <Button
            type={job.primary ? 'primary' : 'default'}
            icon={job.primary ? <ThunderboltOutlined /> : <SyncOutlined />}
            loading={loading}
            onClick={onRun}
            block
          >
            실행
          </Button>
        </Space>
      </Card>
    </Col>
  );
}

export default function BatchPage() {
  const [loading, setLoading] = useState({});
  const [dailyDate, setDailyDate] = useState(null);

  const handleRun = async (key, apiFn) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      await apiFn();
      message.success(`${key} 배치 실행 완료`);
    } catch (error) {
      message.error(`${key} 배치 실행 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDailyRun = async () => {
    if (!dailyDate) {
      message.warning('날짜를 선택해주세요.');
      return;
    }
    const dateStr = dailyDate.format('YYYY-MM-DD');
    setLoading(prev => ({ ...prev, memberDaily: true }));
    try {
      await statsApi.recalculateMemberDaily(dateStr);
      message.success(`${dateStr} 일간 통계 재계산 완료`);
    } catch (error) {
      message.error(`일간 통계 재계산 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, memberDaily: false }));
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>배치 관리</Title>

      <Divider orientation="left">문장 통계</Divider>
      <Row gutter={[16, 16]}>
        {QUOTE_JOBS.map(job => (
          <BatchCard
            key={job.key}
            job={job}
            loading={loading[job.key]}
            onRun={() => handleRun(job.key, job.api)}
          />
        ))}
      </Row>

      <Divider orientation="left" style={{ marginTop: 120 }}>개인 통계</Divider>
      <Row gutter={[16, 16]}>
        {MEMBER_JOBS.map(job => (
          <BatchCard
            key={job.key}
            job={job}
            loading={loading[job.key]}
            onRun={() => handleRun(job.key, job.api)}
          />
        ))}
        <Col span={8}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>개인 일간 통계 재계산</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>특정 날짜의 MemberDailyStats 재계산</Text>
              <Space.Compact style={{ width: '100%' }}>
                <DatePicker
                  value={dailyDate}
                  onChange={setDailyDate}
                  style={{ flex: 1 }}
                  placeholder="날짜 선택"
                />
                <Button
                  icon={<SyncOutlined />}
                  loading={loading.memberDaily}
                  onClick={handleDailyRun}
                >
                  실행
                </Button>
              </Space.Compact>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}