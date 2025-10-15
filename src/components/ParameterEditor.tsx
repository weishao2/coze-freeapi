import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
  description?: string;
  required?: boolean;
}

interface ParameterEditorProps {
  value?: Parameter[];
  onChange?: (parameters: Parameter[]) => void;
  method?: 'GET' | 'POST';
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({
  value = [],
  onChange,
  method = 'POST'
}) => {
  const [parameters, setParameters] = useState<Parameter[]>(value);

  useEffect(() => {
    setParameters(value);
  }, [value]);

  const handleParametersChange = (newParameters: Parameter[]) => {
    setParameters(newParameters);
    onChange?.(newParameters);
  };

  const addParameter = () => {
    const newParameter: Parameter = {
      name: '',
      type: 'string',
      defaultValue: '',
      description: '',
      required: false
    };
    handleParametersChange([...parameters, newParameter]);
  };

  const removeParameter = (index: number) => {
    const newParameters = parameters.filter((_, i) => i !== index);
    handleParametersChange(newParameters);
  };

  const updateParameter = (index: number, field: keyof Parameter, value: any) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    
    // 根据类型调整默认值
    if (field === 'type') {
      switch (value) {
        case 'number':
          newParameters[index].defaultValue = 0;
          break;
        case 'boolean':
          newParameters[index].defaultValue = false;
          break;
        case 'object':
          newParameters[index].defaultValue = {};
          break;
        case 'array':
          newParameters[index].defaultValue = [];
          break;
        default:
          newParameters[index].defaultValue = '';
      }
    }
    
    handleParametersChange(newParameters);
  };

  const renderDefaultValueInput = (param: Parameter, index: number) => {
    switch (param.type) {
      case 'boolean':
        return (
          <Select
            value={param.defaultValue}
            onChange={(value) => updateParameter(index, 'defaultValue', value)}
            placeholder="选择布尔值"
          >
            <Option value={true}>true</Option>
            <Option value={false}>false</Option>
          </Select>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={param.defaultValue}
            onChange={(e) => updateParameter(index, 'defaultValue', Number(e.target.value))}
            placeholder="输入数字"
          />
        );
      case 'object':
        return (
          <TextArea
            rows={2}
            value={typeof param.defaultValue === 'object' ? JSON.stringify(param.defaultValue, null, 2) : param.defaultValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateParameter(index, 'defaultValue', parsed);
              } catch {
                updateParameter(index, 'defaultValue', e.target.value);
              }
            }}
            placeholder='{"key": "value"}'
          />
        );
      case 'array':
        return (
          <TextArea
            rows={2}
            value={Array.isArray(param.defaultValue) ? JSON.stringify(param.defaultValue, null, 2) : param.defaultValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateParameter(index, 'defaultValue', parsed);
              } catch {
                updateParameter(index, 'defaultValue', e.target.value);
              }
            }}
            placeholder='["item1", "item2"]'
          />
        );
      default:
        return (
          <Input
            value={param.defaultValue}
            onChange={(e) => updateParameter(index, 'defaultValue', e.target.value)}
            placeholder="输入字符串"
          />
        );
    }
  };

  const getMethodHelp = () => {
    if (method === 'GET') {
      return (
        <Alert
          message="GET 请求参数说明"
          description={
            <div>
              <p>• GET 请求的参数会作为 URL 查询参数传递</p>
              <p>• 参数值会自动进行 URL 编码</p>
              <p>• 复杂对象和数组会被序列化为 JSON 字符串</p>
              <p>• 示例：<code>?param1=value1&param2=value2</code></p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    } else {
      return (
        <Alert
          message="POST 请求参数说明"
          description={
            <div>
              <p>• POST 请求的参数会作为 JSON 格式的请求体发送</p>
              <p>• 支持复杂的嵌套对象和数组结构</p>
              <p>• 参数类型会被自动转换为对应的 JavaScript 类型</p>
              <p>• 示例：<code>{`{"param1": "value1", "param2": 123}`}</code></p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            参数配置
            <Tooltip title="配置工作流的默认参数，这些参数会在调用时作为默认值使用">
              <QuestionCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
            </Tooltip>
          </Title>
          <Text type="secondary">为 {method} 请求配置默认参数</Text>
        </div>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addParameter}
        >
          添加参数
        </Button>
      </div>

      {getMethodHelp()}

      {parameters.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Text type="secondary">
            暂无参数配置，点击"添加参数"开始配置
          </Text>
        </Card>
      ) : (
        <div>
          {parameters.map((param, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong>参数 {index + 1}</Text>
                  {param.name && <Text code style={{ marginLeft: 8 }}>{param.name}</Text>}
                </div>
              }
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeParameter(index)}
                >
                  删除
                </Button>
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="参数名称" style={{ marginBottom: 12 }}>
                    <Input
                      value={param.name}
                      onChange={(e) => updateParameter(index, 'name', e.target.value)}
                      placeholder="参数名称"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="参数类型" style={{ marginBottom: 12 }}>
                    <Select
                      value={param.type}
                      onChange={(value) => updateParameter(index, 'type', value)}
                    >
                      <Option value="string">字符串 (string)</Option>
                      <Option value="number">数字 (number)</Option>
                      <Option value="boolean">布尔值 (boolean)</Option>
                      <Option value="object">对象 (object)</Option>
                      <Option value="array">数组 (array)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="默认值" style={{ marginBottom: 12 }}>
                    {renderDefaultValueInput(param, index)}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item label="参数描述" style={{ marginBottom: 0 }}>
                    <Input
                      value={param.description}
                      onChange={(e) => updateParameter(index, 'description', e.target.value)}
                      placeholder="参数用途说明（可选）"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="是否必需" style={{ marginBottom: 0 }}>
                    <Select
                      value={param.required}
                      onChange={(value) => updateParameter(index, 'required', value)}
                    >
                      <Option value={false}>可选</Option>
                      <Option value={true}>必需</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      )}

      {parameters.length > 0 && (
        <Card style={{ marginTop: 16, backgroundColor: '#fafafa' }}>
          <Title level={5}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            生成的参数预览
          </Title>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 12, 
            borderRadius: 4,
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(
              parameters.reduce((acc, param) => {
                if (param.name) {
                  acc[param.name] = param.defaultValue;
                }
                return acc;
              }, {} as Record<string, any>),
              null,
              2
            )}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default ParameterEditor;