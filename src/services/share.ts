import { NextFunction } from 'express';
import * as fs from 'node:fs/promises';
import { getShare } from '../db/share';
import { ErrorWithStatus } from '../util/errorhandler';
import { Logger } from '../util/logger';
import { getShareItemPath } from '../util/share';
import { TypedRequest, TypedResponse } from '../util/zod';
import { getShareImageSchema } from '../routes/share';
import { db } from '../db/config';

export const getShareImage = async (
  req: TypedRequest<typeof getShareImageSchema>,
  res: TypedResponse,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const share = await db.task('getShareImage', async (t) => {
      return await getShare(t, id);
    });
    const imagePath = getShareItemPath(share.username);
    const shareImage = await fs.readFile(imagePath);
    res.set({ 'Content-Type': 'image/png' }).send(shareImage);
  } catch (error) {
    Logger.error(error);
    next(new ErrorWithStatus(422, 'share_error', "Couldn't find share"));
  }
};
