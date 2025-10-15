<?php
/**
 * 宝塔面板 Webhook 自动部署脚本
 * 适用于 GitHub/GitLab Webhook 触发自动部署
 */

// 配置
$config = [
    'secret' => 'coze_api_deploy_2024', // Webhook密钥
    'project_dir' => '/www/wwwroot/coze-freeapi',
    'deploy_script' => '/www/wwwroot/coze-freeapi/bt-auto-deploy.sh', // 部署脚本路径
    'log_file' => '/www/wwwroot/coze-freeapi/webhook.log', // 日志文件
    'allowed_ips' => [
        '115.190.0.171', // 服务器本地IP
        '127.0.0.1',     // 本地回环
        '::1',           // IPv6本地回环
        // GitHub Webhook IP 范围
        '192.30.252.0/22',
        '185.199.108.0/22', 
        '140.82.112.0/20',
        '143.55.64.0/20',
        '20.201.28.151/32',
        '20.205.243.166/32'
    ]
];

// 日志函数
function writeLog($message) {
    global $config;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($config['log_file'], "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// 验证IP地址
function isAllowedIP($ip) {
    global $config;
    foreach ($config['allowed_ips'] as $allowed) {
        if (strpos($allowed, '/') !== false) {
            list($subnet, $mask) = explode('/', $allowed);
            if ((ip2long($ip) & ~((1 << (32 - $mask)) - 1)) == ip2long($subnet)) {
                return true;
            }
        } else {
            if ($ip === $allowed) {
                return true;
            }
        }
    }
    return false;
}

// 验证Gitea签名
function verifyGiteaSignature($payload, $signature) {
    global $config;
    $expected = hash_hmac('sha256', $payload, $config['secret']);
    return hash_equals($expected, $signature);
}

// 验证GitHub签名
function verifyGitHubSignature($payload, $signature) {
    global $config;
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $config['secret']);
    return hash_equals($expected, $signature);
}

// 验证GitLab签名
function verifyGitLabSignature($token) {
    global $config;
    return hash_equals($config['secret'], $token);
}

// 主逻辑
try {
    // 获取客户端IP
    $client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    writeLog("收到来自 $client_ip 的Webhook请求");

    // 验证IP地址（可选，如果使用CDN可能需要调整）
    // if (!isAllowedIP($client_ip)) {
    //     writeLog("IP地址 $client_ip 不在允许列表中");
    //     http_response_code(403);
    //     exit('Forbidden');
    // }

    // 获取请求数据
    $payload = file_get_contents('php://input');
    $headers = getallheaders();

    // 验证签名
    $is_valid = false;
    
    // Gitea Webhook
    if (isset($headers['X-Gitea-Signature'])) {
        $is_valid = verifyGiteaSignature($payload, $headers['X-Gitea-Signature']);
        $platform = 'Gitea';
    }
    // GitHub Webhook
    elseif (isset($headers['X-Hub-Signature-256'])) {
        $is_valid = verifyGitHubSignature($payload, $headers['X-Hub-Signature-256']);
        $platform = 'GitHub';
    }
    // GitLab Webhook
    elseif (isset($headers['X-Gitlab-Token'])) {
        $is_valid = verifyGitLabSignature($headers['X-Gitlab-Token']);
        $platform = 'GitLab';
    }
    else {
        writeLog("未识别的Webhook平台");
        http_response_code(400);
        exit('Bad Request');
    }

    if (!$is_valid) {
        writeLog("$platform Webhook签名验证失败");
        http_response_code(401);
        exit('Unauthorized');
    }

    // 解析payload
    $data = json_decode($payload, true);
    if (!$data) {
        writeLog("无效的JSON数据");
        http_response_code(400);
        exit('Bad Request');
    }

    // 检查是否为主分支推送
    $is_main_branch = false;
    if ($platform === 'GitHub') {
        $is_main_branch = isset($data['ref']) && ($data['ref'] === 'refs/heads/main' || $data['ref'] === 'refs/heads/master');
    } elseif ($platform === 'GitLab') {
        $is_main_branch = isset($data['ref']) && ($data['ref'] === 'refs/heads/main' || $data['ref'] === 'refs/heads/master');
    }

    if (!$is_main_branch) {
        writeLog("非主分支推送，忽略部署");
        echo json_encode(['status' => 'ignored', 'message' => '非主分支推送']);
        exit;
    }

    writeLog("$platform 主分支推送验证成功，开始部署");

    // 执行部署脚本
    $deploy_command = "cd {$config['project_dir']} && bash {$config['deploy_script']} > /dev/null 2>&1 &";
    exec($deploy_command, $output, $return_code);

    if ($return_code === 0) {
        writeLog("部署脚本启动成功");
        echo json_encode(['status' => 'success', 'message' => '部署已启动']);
    } else {
        writeLog("部署脚本启动失败，返回码: $return_code");
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => '部署启动失败']);
    }

} catch (Exception $e) {
    writeLog("异常: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '服务器内部错误']);
}
?>