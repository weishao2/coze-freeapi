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
  message,
  Popconfirm,
  Typography,
  Tag,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { getTokens, createToken, updateToken, deleteToken } from '../services/tokens';
import type { Token, CreateTokenRequest, UpdateTokenRequest } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Tokens: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [form] = Form.useForm();
  const [showTokenValues, setShowTokenValues] = useState<Record<number, boolean>>({});

  // 加载 Token 列表
  const loadTokens = async () => {
    setLoading(true);
    try {
      const response = await getTokens();
      if (response.success && response.data) {
        setTokens(response.data);
      }
    } catch (error) {
      console.error('加载 Token 列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  // 打开新增/编辑弹窗
  const openModal = (token?: Token) => {
    setEditingToken(token || null);
    setModalVisible(true);
    if (token) {
      form.setFieldsValue({
        token_name: token.token_name,
        token_value: token.token_value,
        description: token.description,
        is_active: token.is_active
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingToken(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values: CreateTokenRequest & { is_active?: boolean }) => {
    try {
      if (editingToken) {
        // 编辑
        const updateData: UpdateTokenRequest = {
          token_name: values.token_name,
          description: values.description,
          is_active: values.is_active
        };
        
        // 只有当token_value不为空时才包含它
        if (values.token_value && values.token_value.trim()) {
          updateData.token_value = values.token_value;
        }
        
        const response = await updateToken(editingToken.id, updateData);
        if (response.success) {
          message.success('Token 更新成功');
          loadTokens();
          closeModal();
        }
      } else {
        // 新增
        const response = await createToken(values);
        if (response.success) {
          message.success('Token 创建成功');
          loadTokens();
          closeModal();
        }
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除 Token
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteToken(id);
      if (response.success) {
        message.success('Token 删除成功');
        loadTokens();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换 Token 状态
  const toggleStatus = async (token: Token) => {
    try {
      const response = await updateToken(token.id, { is_active: !token.is_active });
      if (response.success) {
        message.success(`Token 已${!token.is_active ? '启用' : '禁用'}`);
        loadTokens();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 切换 Token 值显示/隐藏
  const toggleTokenVisibility = (tokenId: number) => {
    setShowTokenValues(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  // 复制 Token 值
  const copyTokenValue = (tokenValue: string) => {
    const safeTokenValue = tokenValue || '';
    navigator.clipboard.writeText(safeTokenValue).then(() => {
      message.success('Token 值已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 表格列配置
  const columns = [
    {
      title: 'Token 名称',
      dataIndex: 'token_name',
      key: 'token_name',
      render: (name: string, record: Token) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Token 值',
      dataIndex: 'token_value',
      key: 'token_value',
      render: (value: string, record: Token) => {
        const isVisible = showTokenValues[record.id];
        const safeValue = value || '';
        const displayValue = isVisible ? safeValue : safeValue.replace(/./g, '*');
        
        return (
          <Space>
            <Text code style={{ fontFamily: 'monospace' }}>
              {displayValue}
            </Text>
            <Button
              type="text"
              size="small"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => toggleTokenVisibility(record.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyTokenValue(safeValue)}
            />
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: Token) => (
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
      render: (_, record: Token) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个 Token 吗？"
            description="删除后将无法恢复，相关的工作流可能会受到影响。"
            onConfirm={() => handleDelete(record.id)}
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
          <Title level={2}>Token 管理</Title>
          <Text type="secondary">管理 Coze API 访问令牌</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          新增 Token
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tokens}
          rowKey="id"
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
        title={editingToken ? '编辑 Token' : '新增 Token'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="token_name"
            label="Token 名称"
            rules={[
              { required: true, message: '请输入 Token 名称' },
              { max: 100, message: 'Token 名称最多100个字符' }
            ]}
          >
            <Input placeholder="请输入 Token 名称" />
          </Form.Item>

          <Form.Item
            name="token_value"
            label="Token 值"
            rules={[
              { required: !editingToken, message: '请输入 Token 值' },
              { min: 10, message: 'Token 值至少10个字符' }
            ]}
          >
            <Input.Password 
              placeholder={editingToken ? "留空则不修改 Token 值" : "请输入 Coze API Token 值"} 
            />
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
              placeholder="请输入 Token 描述（可选）"
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
              <Button type="primary" htmlType="submit">
                {editingToken ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tokens;