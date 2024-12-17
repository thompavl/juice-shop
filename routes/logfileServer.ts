/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import sanitize from 'sanitize-filename';
import path = require('path')
import { type Request, type Response, type NextFunction } from 'express'

module.exports = function serveLogFiles () {
  return ({ params }: Request, res: Response, next: NextFunction) => {
    const file = params.file

    if (!file.includes('/')) {
      const sanitizedFile = sanitize(file);
      const resolvedPath = path.resolve('logs/', sanitizedFile);

      // Ensure the resolved path is within the 'logs' directory
      if (resolvedPath.startsWith(path.resolve('logs/'))) {
        res.sendFile(resolvedPath);
      } else {
        res.status(400).send('Invalid file path');
      }
    } else {
      res.status(403)
      next(new Error('File names cannot contain forward slashes!'))
    }
  }
}
