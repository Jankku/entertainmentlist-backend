import * as bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getUserByUsername } from '../db/users';
import { query } from '../db/config';
import { success } from '../util/response';
import Logger from '../util/logger';
import { generateAccessToken, generatePasswordHash, generateRefreshToken } from '../util/auth';
import { ErrorWithStatus } from '../util/errorhandler';
import { QueryConfig } from 'pg';
import JwtPayload from '../model/jwtpayload';
import config from '../config';

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await generatePasswordHash(password);
    const registerQuery: QueryConfig = {
      text: `INSERT INTO users (username, password)
             VALUES ($1, $2)`,
      values: [username, hashedPassword],
    };

    await query(registerQuery);
    res.status(200).json(success([{ name: 'user_registered', message: username }]));
  } catch (error) {
    Logger.error((error as Error).stack);
    next(
      new ErrorWithStatus(
        500,
        'authentication_error',
        'Unknown error while trying to register user'
      )
    );
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsername(username);

    if (user === undefined) {
      next(new ErrorWithStatus(422, 'authentication_error', 'Incorrect username or password'));
      return;
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      next(new ErrorWithStatus(422, 'authentication_error', 'Incorrect username or password'));
      return;
    }

    const accessToken = generateAccessToken(user.user_id, username);
    const refreshToken = generateRefreshToken(user.user_id, username);

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    Logger.error((error as Error).stack);
    next(
      new ErrorWithStatus(500, 'authentication_error', 'Unknown error while trying to log-in user')
    );
  }
};

const generateNewAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  try {
    const { userId, username } = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, {
      audience: 'eino',
      issuer: 'eino-backend',
    }) as JwtPayload;

    const newAccessToken = generateAccessToken(userId, username);
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(new ErrorWithStatus(422, 'jwt_refresh_error', (error as Error)?.message));
  }
};

export { register, login, generateNewAccessToken };
