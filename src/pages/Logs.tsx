import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Tag,
  Drawer,
  Descriptions,
  Alert,
  Statistic,
  Row,
  Col,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { getLogs, getLogDetail, deleteLogs, deleteLogsByDays } from '../services/logs';
import { getWorkflows } from '../services/workflows';
import type { WorkflowLog, LogsQuery, Workflow } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [viewingLog, setViewingLog] = useState<WorkflowLog | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState<LogsQuery>({});
  const [form] = Form.useForm();

  // 加载日志列表
  const loadLogs = async (params: LogsQuery = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        ...params
      };

      const response = await getLogs(queryParams);
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          current: response.data.pagination.page
        }));
      }
    } catch (error) {
      console.error('加载日志列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载工作流列表（用于筛选）
  const loadWorkflows = async () => {
    try {
      const response = await getWorkflows();
      if (response.success && response.data) {
        setWorkflows(response.data);
      }
    } catch (error) {
      console.error('加载工作流列表失败:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadWorkflows();
  }, []);

  // 打开详情抽屉
  const openDrawer = async (log: WorkflowLog) => {
    try {
      const response = await getLogDetail(log.id);
      if (response.success && response.data) {
        setViewingLog(response.data);
        setDrawerVisible(true);
      }
    } catch (error: any) {
      message.error(error.message || '获取日志详情失败');
    }
  };

  // 关闭详情抽屉
  const closeDrawer = () => {
    setDrawerVisible(false);
    setViewingLog(null);
  };

  // 应用筛选
  const handleFilter = (values: any) => {
    const newFilters: LogsQuery = {};
    
    if (values.status) {
      newFilters.status = values.status;
    }
    
    if (values.workflow_id) {
      newFilters.workflow_id = values.workflow_id;
    }
    
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.start_date = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.end_date = values.dateRange[1].format('YYYY-MM-DD');
    }

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadLogs(newFilters);
    setFilterVisible(false);
  };

  // 重置筛选
  const resetFilter = () => {
    form.resetFields();
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
    loadLogs({});
    setFilterVisible(false);
  };

  // 批量删除日志
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的日志');
      return;
    }

    try {
      const response = await deleteLogs(selectedRowKeys as number[]);
      if (response.success) {
        message.success(response.message || '删除成功');
        setSelectedRowKeys([]);
        loadLogs();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 清理历史日志
  const handleCleanHistory = async (days: number) => {
    try {
      const response = await deleteLogsByDays(days);
      if (response.success) {
        message.success(response.message || '清理成功');
        loadLogs();
      }
    } catch (error: any) {
      message.error(error.message || '清理失败');
    }
  };

  // 表格分页变化
  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
    
    loadLogs({
      page: paginationConfig.current,
      limit: paginationConfig.pageSize
    });
  };

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      success: { color: 'success', text: '成功' },
      error: { color: 'error', text: '失败' },
      timeout: { color: 'warning', text: '超时' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '工作流',
      dataIndex: 'workflow_name',
      key: 'workflow_name',
      render: (name: string, record: WorkflowLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name || '未知工作流'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.workflow_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '请求方法',
      dataIndex: 'request_method',
      key: 'request_method',
      width: 100,
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : 'green'}>{method}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: renderStatusTag,
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time',
      key: 'execution_time',
      width: 100,
      render: (time: number) => `${time}ms`,
      sorter: true,
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (error: string) => error ? (
        <Text type="danger" ellipsis style={{ maxWidth: 200 }}>
          {error}
        </Text>
      ) : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm:ss'),
      sorter: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record: WorkflowLog) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>执行日志</Title>
          <Text type="secondary">查看和管理 API 执行日志</Text>
        </div>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterVisible(true)}
          >
            筛选
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadLogs()}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <Alert
          message={
            <Space>
              <Text>已选择 {selectedRowKeys.length} 条记录</Text>
              <Popconfirm
                title="确定要删除选中的日志吗？"
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        extra={
          <Space>
            <Popconfirm
              title="清理历史日志"
              description="选择要清理的日志时间范围"
              onConfirm={() => handleCleanHistory(7)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small">清理7天前</Button>
            </Popconfirm>
            <Popconfirm
              title="清理历史日志"
              description="选择要清理的日志时间范围"
              onConfirm={() => handleCleanHistory(30)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small">清理30天前</Button>
            </Popconfirm>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range?.[0]}-${range?.[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          size="small"
        />
      </Card>

      {/* 筛选弹窗 */}
      <Modal
        title="筛选日志"
        open={filterVisible}
        onCancel={() => setFilterVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilter}
          initialValues={filters}
        >
          <Form.Item name="status" label="状态">
            <Select placeholder="选择状态" allowClear>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="error">失败</Select.Option>
              <Select.Option value="timeout">超时</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="workflow_id" label="工作流">
            <Select placeholder="选择工作流" allowClear>
              {workflows.map(workflow => (
                <Select.Option key={workflow.workflow_id} value={workflow.workflow_id}>
                  {workflow.workflow_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="时间范围">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={resetFilter}>
                重置
              </Button>
              <Button onClick={() => setFilterVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                应用筛选
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="日志详情"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={700}
      >
        {viewingLog && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="执行时间"
                  value={viewingLog.execution_time}
                  suffix="ms"
                  valueStyle={{ 
                    color: viewingLog.execution_time > 5000 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="请求方法"
                  value={viewingLog.request_method}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">状态</Text>
                  <div style={{ marginTop: 4 }}>
                    {renderStatusTag(viewingLog.status)}
                  </div>
                </div>
              </Col>
            </Row>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="工作流名称">
                {viewingLog.workflow_name || '未知工作流'}
              </Descriptions.Item>
              <Descriptions.Item label="工作流ID">
                <Text code>{viewingLog.workflow_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {viewingLog.error_message && (
                <Descriptions.Item label="错误信息">
                  <Text type="danger">{viewingLog.error_message}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="请求参数" size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(viewingLog.request_params, null, 2)}
              </pre>
            </Card>

            <Card title="响应数据" size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(viewingLog.response_data, null, 2)}
              </pre>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default Logs;