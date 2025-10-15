import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  message,
  Popconfirm,
  Typography,
  Tag,
  Tooltip,
  Drawer,
  Descriptions,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  CopyOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from '../services/workflows';
import { getTokens } from '../services/tokens';
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest, Token } from '../types';
import dayjs from 'dayjs';
import ParameterEditor, { Parameter } from '../components/ParameterEditor';
import ApiTester from '../components/ApiTester';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);
  const [apiTesterVisible, setApiTesterVisible] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [form] = Form.useForm();

  // 加载工作流列表
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const response = await getWorkflows();
      if (response.success && response.data) {
        setWorkflows(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载工作流列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载Token列表
  const loadTokens = async () => {
    try {
      const response = await getTokens();
      if (response.success && response.data) {
        setTokens(response.data.filter(token => token.is_active));
      }
    } catch (error: any) {
      console.error('加载Token列表失败:', error);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadTokens();
  }, []);

  // 打开新增/编辑弹窗
  const openModal = (workflow?: Workflow) => {
    setEditingWorkflow(workflow || null);
    setModalVisible(true);
    if (workflow) {
      form.setFieldsValue({
        workflow_name: workflow.workflow_name,
        workflow_id: workflow.workflow_id,
        token: workflow.token,
        description: workflow.description,
        default_params: workflow.default_params ? JSON.stringify(workflow.default_params, null, 2) : '',
        is_active: workflow.is_active
      });
      // 设置参数
      setParameters(workflow.parameters || []);
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
      setParameters([]);
    }
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingWorkflow(null);
    form.resetFields();
    setParameters([]);
  };

  // 打开详情抽屉
  const openDrawer = (workflow: Workflow) => {
    setViewingWorkflow(workflow);
    setDrawerVisible(true);
  };

  // 关闭详情抽屉
  const closeDrawer = () => {
    setDrawerVisible(false);
    setViewingWorkflow(null);
  };

  // 打开API测试器
  const openApiTester = () => {
    setApiTesterVisible(true);
  };

  // 关闭API测试器
  const closeApiTester = () => {
    setApiTesterVisible(false);
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      // 解析默认参数
      let defaultParams = null;
      if (values.default_params) {
        try {
          defaultParams = JSON.parse(values.default_params);
        } catch (error) {
          message.error('默认参数格式不正确，请输入有效的 JSON');
          return;
        }
      }

      const data = {
         workflow_name: values.workflow_name,
         workflow_id: values.workflow_id,
         token: values.token,
         description: values.description,
         default_params: defaultParams,
         parameters: parameters,
         is_active: values.is_active
       };

      if (editingWorkflow) {
        // 编辑
        const response = await updateWorkflow(editingWorkflow.workflow_id, data);
        if (response.success) {
          message.success('工作流更新成功');
          loadWorkflows();
          closeModal();
        }
      } else {
        // 新增
        const response = await createWorkflow(data);
        if (response.success) {
          message.success('工作流创建成功');
          loadWorkflows();
          closeModal();
        }
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除工作流
  const handleDelete = async (workflowId: string) => {
    try {
      const response = await deleteWorkflow(workflowId);
      if (response.success) {
        message.success('工作流删除成功');
        loadWorkflows();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换工作流状态
  const toggleStatus = async (workflow: Workflow) => {
    try {
      const response = await updateWorkflow(workflow.workflow_id, { is_active: !workflow.is_active });
      if (response.success) {
        message.success(`工作流已${!workflow.is_active ? '启用' : '禁用'}`);
        loadWorkflows();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 复制 API 地址
  const copyApiUrl = (workflowId: string, method: 'GET' | 'POST') => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/execute/${workflowId}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success(`${method} API 地址已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '工作流信息',
      dataIndex: 'workflow_name',
      key: 'workflow_name',
      render: (name: string, record: Workflow) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.workflow_id}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Workflow ID',
      dataIndex: 'workflow_id',
      key: 'workflow_id',
      render: (workflowId: string) => (
        <Text code style={{ fontFamily: 'monospace' }}>
          {workflowId}
        </Text>
      ),
    },
    {
      title: 'API 地址',
      key: 'api_urls',
      render: (_, record: Workflow) => (
        <Space direction="vertical" size={4}>
          <Space size={4}>
            <Tag color="blue">GET</Tag>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyApiUrl(record.workflow_id, 'GET')}
            >
              复制
            </Button>
          </Space>
          <Space size={4}>
            <Tag color="green">POST</Tag>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyApiUrl(record.workflow_id, 'POST')}
            >
              复制
            </Button>
          </Space>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: Workflow) => (
        <Switch
          checked={isActive}
          onChange={() => toggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Workflow) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => openDrawer(record)}
          >
            查看
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个工作流吗？"
            description="删除后将无法恢复，相关的执行日志将保留。"
            onConfirm={() => handleDelete(record.workflow_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>工作流管理</Title>
          <Text type="secondary">管理 Coze API 转换工作流配置</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          新增工作流
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={workflows}
          rowKey="workflow_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingWorkflow ? '编辑工作流' : '新增工作流'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="workflow_name"
            label="工作流名称"
            rules={[
              { required: true, message: '请输入工作流名称' },
              { max: 100, message: '工作流名称最多100个字符' }
            ]}
          >
            <Input placeholder="请输入工作流名称" />
          </Form.Item>

          <Form.Item
             name="workflow_id"
             label="Workflow ID"
             rules={[
               { required: true, message: '请输入 Workflow ID' },
               { pattern: /^[0-9]+$/, message: 'Workflow ID 只能包含数字' }
             ]}
           >
             <Input placeholder="请输入 Workflow ID" />
           </Form.Item>

           <Form.Item
             name="token"
             label="Token"
             rules={[
               { required: true, message: '请选择 Token' }
             ]}
           >
             <Select placeholder="请选择 Token" allowClear>
               {tokens.map(token => (
                 <Option key={token.token_value} value={token.token_value}>
                   {token.token_name}
                 </Option>
               ))}
             </Select>
           </Form.Item>

           <Form.Item
             name="description"
             label="描述"
             rules={[
               { max: 500, message: '描述最多500个字符' }
             ]}
           >
             <TextArea
               rows={3}
               placeholder="请输入工作流描述（可选）"
             />
           </Form.Item>

          <Form.Item
            label="参数配置"
            help="配置工作流的参数，支持可视化编辑"
          >
            <ParameterEditor
              value={parameters}
              onChange={setParameters}
              method="POST"
            />
          </Form.Item>

          <Form.Item
            name="default_params"
            label="默认参数"
            help="请输入有效的 JSON 格式，这些参数将作为默认值传递给 Coze API"
          >
            <TextArea
              rows={6}
              placeholder='例如: {"user_id": "default_user", "stream": false}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button 
                type="default" 
                icon={<ApiOutlined />}
                onClick={openApiTester}
                disabled={!form.getFieldValue('workflow_id') || !form.getFieldValue('token')}
              >
                测试 API
              </Button>
              <Button type="primary" htmlType="submit">
                {editingWorkflow ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="工作流详情"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={600}
      >
        {viewingWorkflow && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="API 使用说明"
              description={
                <div>
                  <p>此工作流支持 GET 和 POST 两种请求方式：</p>
                  <ul>
                    <li><strong>GET:</strong> 参数通过 URL 查询字符串传递</li>
                    <li><strong>POST:</strong> 参数通过请求体传递（JSON 格式）</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
            />

            <Descriptions column={1} bordered>
              <Descriptions.Item label="工作流名称">
                {viewingWorkflow.workflow_name}
              </Descriptions.Item>
              <Descriptions.Item label="工作流ID">
                <Text code>{viewingWorkflow.workflow_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Workflow ID">
                <Text code>{viewingWorkflow.workflow_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={viewingWorkflow.is_active ? 'success' : 'default'}>
                  {viewingWorkflow.is_active ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {viewingWorkflow.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(viewingWorkflow.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(viewingWorkflow.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Card title="API 地址" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Space>
                    <Tag color="blue">GET</Tag>
                    <Text code style={{ flex: 1 }}>
                      {window.location.origin}/api/execute/{viewingWorkflow.workflow_id}
                    </Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyApiUrl(viewingWorkflow.workflow_id, 'GET')}
                    >
                      复制
                    </Button>
                  </Space>
                </div>
                <div>
                  <Space>
                    <Tag color="green">POST</Tag>
                    <Text code style={{ flex: 1 }}>
                      {window.location.origin}/api/execute/{viewingWorkflow.workflow_id}
                    </Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyApiUrl(viewingWorkflow.workflow_id, 'POST')}
                    >
                      复制
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>

            {viewingWorkflow.default_params && (
              <Card title="默认参数" size="small">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(viewingWorkflow.default_params, null, 2)}
                </pre>
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      {/* API 测试器 */}
      <ApiTester
        visible={apiTesterVisible}
        onCancel={closeApiTester}
        workflowId={form.getFieldValue('workflow_id') || ''}
        workflowName={form.getFieldValue('workflow_name') || ''}
        method="POST"
        parameters={parameters}
        token={form.getFieldValue('token') || ''}
      />
    </div>
  );
};

export default Workflows;