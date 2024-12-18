/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path = require('path')
import { type Request, type Response, type NextFunction } from 'express'
import sanitize from 'sanitize-filename';

module.exports = function serveKeyFiles () {
  return ({ params }: Request, res: Response, next: NextFunction) => {
    const file = params.file;

    if (!file.includes('/')) {
      const sanitizedFile = sanitize(file);
      const safeBasePath = path.resolve('encryptionkeys/');
      const resolvedPath = path.resolve(safeBasePath, sanitizedFile);

      // Ensure the resolved path is within the 'encryptionkeys' directory
      if (resolvedPath.startsWith(safeBasePath)) {
        res.sendFile(resolvedPath);
      } else {
        res.status(400).send('Invalid file path');
      }
    } else {
      res.status(403);
      next(new Error('File names cannot contain forward slashes!'));
    }
  }
}

