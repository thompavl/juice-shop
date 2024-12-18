/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path = require('path');
import { type Request, type Response, type NextFunction } from 'express';

module.exports = function serveQuarantineFiles() {
  return ({ params }: Request, res: Response, next: NextFunction) => {
    const file = params.file;

    // Validate user input
    if (typeof file !== 'string' || file.includes('..') || path.isAbsolute(file)) {
      res.status(400);
      return next(new Error('Invalid file'));
    }

    const resolvedPath = path.resolve('ftp/quarantine/', file);

    // Ensure the resolved path is within the intended directory
    if (!resolvedPath.startsWith(path.resolve('ftp/quarantine/'))) {
      res.status(400);
      return next(new Error('Invalid path'));
    }

    res.sendFile(resolvedPath);
  };
};