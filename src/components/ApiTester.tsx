import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Card,
  Tabs,
  Row,
  Col,
  Tag,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Parameter } from './ParameterEditor';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ApiTesterProps {
  visible: boolean;
  onCancel: () => void;
  workflowId: string;
  workflowName: string;
  method: 'GET' | 'POST';
  parameters: Parameter[];
  token: string;
}

interface TestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  executionTime: number;
}

const ApiTester: React.FC<ApiTesterProps> = ({
  visible,
  onCancel,
  workflowId,
  workflowName,
  method,
  parameters,
  token
}) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const values = await form.validateFields();
      const startTime = Date.now();

      // 构建请求参数
      const requestParams: Record<string, any> = {};
      parameters.forEach(param => {
        if (values[param.name] !== undefined && values[param.name] !== '') {
          let value = values[param.name];
          
          // 根据参数类型转换值
          switch (param.type) {
            case 'number':
              value = Number(value);
              break;
            case 'boolean':
              value = value === 'true' || value === true;
              break;
            case 'object':
            case 'array':
              try {
                value = JSON.parse(value);
              } catch (e) {
                // 如果解析失败，保持原值
              }
              break;
          }
          
          requestParams[param.name] = value;
        } else if (param.defaultValue !== undefined && param.defaultValue !== '') {
          requestParams[param.name] = param.defaultValue;
        }
      });

      // 发送测试请求
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/execute/${workflowId}`;
      
      let response: Response;
      
      if (method === 'GET') {
        const queryParams = new URLSearchParams();
        Object.entries(requestParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        });
        const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestParams)
        });
      }

      const executionTime = Date.now() - startTime;
      const responseData = await response.json();

      setTestResult({
        success: response.ok,
        status: response.status,
        data: responseData,
        executionTime
      });

    } catch (error: any) {
      const executionTime = Date.now() - Date.now();
      setTestResult({
        success: false,
        status: 0,
        error: error.message || '请求失败',
        executionTime
      });
    } finally {
      setTesting(false);
    }
  };

  const renderParameterForm = () => {
    if (parameters.length === 0) {
      return (
        <Alert
          message="无参数配置"
          description="该工作流没有配置参数，将使用空参数进行测试。"
          type="info"
          showIcon
        />
      );
    }

    return (
      <Form form={form} layout="vertical">
        {parameters.map((param) => (
          <Form.Item
            key={param.name}
            name={param.name}
            label={
              <Space>
                <span>{param.name}</span>
                <Tag color={param.type === 'string' ? 'blue' : param.type === 'number' ? 'green' : param.type === 'boolean' ? 'orange' : 'purple'}>
                  {param.type}
                </Tag>
                {param.required && <Tag color="red">必需</Tag>}
              </Space>
            }
            rules={param.required ? [{ required: true, message: `请输入${param.name}` }] : []}
            extra={param.description}
          >
            {param.type === 'boolean' ? (
              <Input.Group compact>
                <Button
                  type={form.getFieldValue(param.name) === 'true' ? 'primary' : 'default'}
                  onClick={() => form.setFieldsValue({ [param.name]: 'true' })}
                >
                  true
                </Button>
                <Button
                  type={form.getFieldValue(param.name) === 'false' ? 'primary' : 'default'}
                  onClick={() => form.setFieldsValue({ [param.name]: 'false' })}
                >
                  false
                </Button>
              </Input.Group>
            ) : param.type === 'object' || param.type === 'array' ? (
              <TextArea
                rows={3}
                placeholder={param.type === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
                defaultValue={param.defaultValue ? JSON.stringify(param.defaultValue, null, 2) : ''}
              />
            ) : (
              <Input
                type={param.type === 'number' ? 'number' : 'text'}
                placeholder={`输入${param.name}的值`}
                defaultValue={param.defaultValue}
              />
            )}
          </Form.Item>
        ))}
      </Form>
    );
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            {testResult.success ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
            )}
            <Text strong>
              {testResult.success ? '测试成功' : '测试失败'}
            </Text>
            <Tag color={testResult.success ? 'success' : 'error'}>
              {testResult.status || 'Network Error'}
            </Tag>
            <Text type="secondary">
              耗时: {testResult.executionTime}ms
            </Text>
          </Space>
        </div>

        <Tabs defaultActiveKey="response">
          <TabPane tab="响应数据" key="response">
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {testResult.data ? JSON.stringify(testResult.data, null, 2) : testResult.error}
            </pre>
          </TabPane>
          <TabPane tab="请求信息" key="request">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>请求方法:</Text>
                <div><Tag color="blue">{method}</Tag></div>
              </Col>
              <Col span={12}>
                <Text strong>工作流ID:</Text>
                <div><Text code>{workflowId}</Text></div>
              </Col>
            </Row>
            <Divider />
            <Text strong>请求URL:</Text>
            <div style={{ marginTop: 8 }}>
              <Text code>{`${window.location.origin}/api/execute/${workflowId}`}</Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  const renderUsageGuide = () => {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/execute/${workflowId}`;
    
    // 构建示例参数
    const exampleParams = parameters.length > 0 ? 
      parameters.reduce((acc, param) => {
        acc[param.name] = param.defaultValue || (
          param.type === 'string' ? '示例值' :
          param.type === 'number' ? 123 :
          param.type === 'boolean' ? true :
          param.type === 'object' ? { key: 'value' } :
          param.type === 'array' ? ['item1', 'item2'] :
          '示例值'
        );
        return acc;
      }, {} as Record<string, any>) : 
      { example_param: '示例值' };

    return (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message={`当前工作流使用 ${method} 方法`}
          description={`此工作流配置为使用 ${method} 方法调用，请参考下方对应的使用示例。`}
          type={method === 'GET' ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Tabs defaultActiveKey={method.toLowerCase()}>
          <TabPane tab={
            <Space>
              <Tag color={method === 'GET' ? 'success' : 'default'}>GET</Tag>
              <span>GET 方法调用</span>
            </Space>
          } key="get">
            <Card title="GET 方法使用说明" style={{ marginBottom: 16 }}>
              <p>GET 方法通过 URL 查询参数传递数据，适用于数据查询和获取操作。</p>
              
              <Title level={5}>URL 构建方式</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`${apiUrl}?${Object.entries(exampleParams).map(([key, value]) => 
  `${key}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value))}`
).join('&')}`}
              </pre>

              <Title level={5}>cURL 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`curl -X GET "${apiUrl}?${Object.entries(exampleParams).map(([key, value]) => 
  `${key}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value))}`
).join('&')}" \\
  -H "Content-Type: application/json"`}
              </pre>

              <Title level={5}>JavaScript Fetch 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`const params = new URLSearchParams();
${Object.entries(exampleParams).map(([key, value]) => 
  `params.append('${key}', ${typeof value === 'object' ? `JSON.stringify(${JSON.stringify(value)})` : `'${value}'`});`
).join('\n')}

const response = await fetch(\`${apiUrl}?\${params.toString()}\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
              </pre>

              <Title level={5}>Python 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`import requests
import json

params = ${JSON.stringify(exampleParams, null, 2)}

# 对于复杂对象，需要转换为字符串
for key, value in params.items():
    if isinstance(value, (dict, list)):
        params[key] = json.dumps(value)

response = requests.get('${apiUrl}', params=params)
data = response.json()
print(data)`}
              </pre>
            </Card>
          </TabPane>

          <TabPane tab={
            <Space>
              <Tag color={method === 'POST' ? 'success' : 'default'}>POST</Tag>
              <span>POST 方法调用</span>
            </Space>
          } key="post">
            <Card title="POST 方法使用说明" style={{ marginBottom: 16 }}>
              <p>POST 方法通过请求体传递数据，适用于数据提交和复杂参数传递。</p>
              
              <Title level={5}>请求体格式</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{JSON.stringify(exampleParams, null, 2)}
              </pre>

              <Title level={5}>cURL 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(exampleParams)}'`}
              </pre>

              <Title level={5}>JavaScript Fetch 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`const requestData = ${JSON.stringify(exampleParams, null, 2)};

const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});

const data = await response.json();
console.log(data);`}
              </pre>

              <Title level={5}>Python 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`import requests
import json

data = ${JSON.stringify(exampleParams, null, 2)}

response = requests.post('${apiUrl}', 
                        headers={'Content-Type': 'application/json'},
                        json=data)
result = response.json()
print(result)`}
              </pre>

              <Title level={5}>Node.js Axios 示例</Title>
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`const axios = require('axios');

const data = ${JSON.stringify(exampleParams, null, 2)};

try {
  const response = await axios.post('${apiUrl}', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  console.log(response.data);
} catch (error) {
  console.error('请求失败:', error.response?.data || error.message);
}`}
              </pre>
            </Card>
          </TabPane>

          <TabPane tab="参数说明" key="params-guide">
            <Card title="参数传递说明">
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}>GET 方法参数传递</Title>
                  <ul>
                    <li>参数通过 URL 查询字符串传递</li>
                    <li>复杂对象需要 JSON.stringify() 后传递</li>
                    <li>参数会显示在 URL 中，不适合敏感数据</li>
                    <li>URL 长度有限制（通常 2048 字符）</li>
                  </ul>
                </Col>
                <Col span={12}>
                  <Title level={5}>POST 方法参数传递</Title>
                  <ul>
                    <li>参数通过请求体 JSON 格式传递</li>
                    <li>支持复杂的嵌套对象和数组</li>
                    <li>参数不会显示在 URL 中，更安全</li>
                    <li>没有数据大小限制</li>
                  </ul>
                </Col>
              </Row>

              {parameters.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>当前工作流参数</Title>
                  <div style={{ backgroundColor: '#fafafa', padding: 16, borderRadius: 4 }}>
                    {parameters.map((param, index) => (
                      <div key={param.name} style={{ marginBottom: index < parameters.length - 1 ? 12 : 0 }}>
                        <Space>
                          <Text strong>{param.name}</Text>
                          <Tag color={param.type === 'string' ? 'blue' : param.type === 'number' ? 'green' : param.type === 'boolean' ? 'orange' : 'purple'}>
                            {param.type}
                          </Tag>
                          {param.required && <Tag color="red">必需</Tag>}
                        </Space>
                        {param.description && (
                          <div style={{ marginTop: 4, color: '#666' }}>
                            {param.description}
                          </div>
                        )}
                        {param.defaultValue && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">默认值: </Text>
                            <Text code>{typeof param.defaultValue === 'object' ? JSON.stringify(param.defaultValue) : String(param.defaultValue)}</Text>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <PlayCircleOutlined />
          <span>API 测试 - {workflowName}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>关闭</Button>
          <Button
            type="primary"
            icon={testing ? <LoadingOutlined /> : <PlayCircleOutlined />}
            loading={testing}
            onClick={handleTest}
          >
            {testing ? '测试中...' : '开始测试'}
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="API 测试说明"
          description={
            <div>
              <p>• 此功能会向实际的 Coze API 发送请求进行测试</p>
              <p>• 请确保配置的 Token 有效且有足够的调用额度</p>
              <p>• 测试结果仅供参考，实际使用时可能因参数不同而有所差异</p>
              <p>• 支持 GET 和 POST 两种请求方法，请查看"使用说明"了解详细用法</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>

      <Tabs defaultActiveKey="params">
        <TabPane tab="参数配置" key="params">
          {renderParameterForm()}
        </TabPane>
        <TabPane tab="使用说明" key="usage">
          {renderUsageGuide()}
        </TabPane>
        <TabPane tab="测试结果" key="result">
          {testResult ? renderTestResult() : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div>
                <Text type="secondary">点击"开始测试"按钮执行 API 测试</Text>
              </div>
            </div>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ApiTester;