import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import dotenv from 'dotenv';

dotenv.config();

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

// JWT 认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'coze_api_jwt_secret_key_2024', (err: any, user: any) => {
    if (err) {
      console.error('JWT验证错误:', err);
      return res.status(403).json({
        success: false,
        message: '访问令牌无效'
      });
    }

    req.user = user;
    next();
  });
};

// 生成 JWT Token
export const generateToken = (user: { id: number; username: string }): string => {
  const secret = process.env.JWT_SECRET || 'coze_api_jwt_secret_key_2024';
  const expiresIn: StringValue = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;
  
  const options: SignOptions = { expiresIn };
  
  const token = jwt.sign(
    { id: user.id, username: user.username },
    secret,
    options
  );
  
  return token;
};