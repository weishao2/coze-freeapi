import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Table, 
  Tag, 
  Button,
  DatePicker,
  Select,
  Spin
} from 'antd';
import { 
  ApiOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLogStats, getLogs } from '../services/logs';
import { getWorkflows } from '../services/workflows';
import { getTokens } from '../services/tokens';
import type { LogStats, WorkflowLog, Workflow, Token } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkflowLog[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [statsDays, setStatsDays] = useState(7);
  const navigate = useNavigate();

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, workflowsRes, tokensRes] = await Promise.all([
        getLogStats(statsDays),
        getLogs({ page: 1, limit: 10 }),
        getWorkflows(),
        getTokens()
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (logsRes.success && logsRes.data) {
        setRecentLogs(logsRes.data.logs);
      }

      if (workflowsRes.success && workflowsRes.data) {
        setWorkflows(workflowsRes.data);
      }

      if (tokensRes.success && tokensRes.data) {
        setTokens(tokensRes.data);
      }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 刷新统计数据
  const refreshStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getLogStats(statsDays);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('刷新统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    refreshStats();
  }, [statsDays]);

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      error: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      timeout: { color: 'warning', icon: <ClockCircleOutlined />, text: '超时' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 最近日志表格列配置
  const logColumns = [
    {
      title: '工作流',
      dataIndex: 'workflow_name',
      key: 'workflow_name',
      render: (name: string, record: WorkflowLog) => name || record.workflow_id,
    },
    {
      title: '请求方法',
      dataIndex: 'request_method',
      key: 'request_method',
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : 'green'}>{method}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag,
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time',
      key: 'execution_time',
      render: (time: number) => `${time}ms`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm:ss'),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, textAlign: 'center' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>仪表板</Title>
        <Text type="secondary">系统运行状态和统计信息概览</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总调用次数"
              value={stats?.summary.total_calls || 0}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats?.summary.success_rate || '0.00'}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={stats?.summary.avg_execution_time || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃工作流"
              value={workflows.filter(w => w.is_active).length}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="调用统计"
            extra={
              <Space>
                <Select
                  value={statsDays}
                  onChange={setStatsDays}
                  style={{ width: 120 }}
                  options={[
                    { label: '最近7天', value: 7 },
                    { label: '最近15天', value: 15 },
                    { label: '最近30天', value: 30 },
                  ]}
                />
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={refreshStats}
                  loading={statsLoading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="成功调用"
                  value={stats?.summary.success_calls || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="失败调用"
                  value={stats?.summary.error_calls || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="超时调用"
                  value={stats?.summary.timeout_calls || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统状态">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>活跃 Token:</Text>
                <Text strong>{tokens.filter(t => t.is_active).length}/{tokens.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>活跃工作流:</Text>
                <Text strong>{workflows.filter(w => w.is_active).length}/{workflows.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>最大响应时间:</Text>
                <Text strong>{stats?.summary.max_execution_time || 0}ms</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>最小响应时间:</Text>
                <Text strong>{stats?.summary.min_execution_time || 0}ms</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 最近日志 */}
      <Card 
        title="最近执行日志"
        extra={
          <Button type="primary" onClick={() => navigate('/logs')}>
            查看全部
          </Button>
        }
      >
        <Table
          columns={logColumns}
          dataSource={recentLogs}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;