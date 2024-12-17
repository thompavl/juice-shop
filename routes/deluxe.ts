/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response} from 'express'
import { UserModel } from '../models/user'
import { WalletModel } from '../models/wallet'
import { CardModel } from '../models/card'
import challengeUtils = require('../lib/challengeUtils')
import * as utils from '../lib/utils'
import { challenges } from '../data/datacache'

const security = require('../lib/insecurity')

module.exports.upgradeToDeluxe = function upgradeToDeluxe () {
  return async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findOne({ where: { id: req.body.UserId, role: security.roles.customer } })
      if (user == null) {
        res.status(400).json({ status: 'error', error: 'Something went wrong. Please try again!' })
        return
      }
      if (req.body.paymentMode === 'wallet') {
        const wallet = await WalletModel.findOne({ where: { UserId: req.body.UserId } })
        if ((wallet != null) && wallet.balance < 49) {
          res.status(400).json({ status: 'error', error: 'Insuffienct funds in Wallet' })
          return
        } else {
          await WalletModel.decrement({ balance: 49 }, { where: { UserId: req.body.UserId } })
        }
      }

      if (req.body.paymentMode === 'card') {
        const card = await CardModel.findOne({ where: { id: req.body.paymentId, UserId: req.body.UserId } })
        if ((card == null) || card.expYear < new Date().getFullYear() || (card.expYear === new Date().getFullYear() && card.expMonth - 1 < new Date().getMonth())) {
          res.status(400).json({ status: 'error', error: 'Invalid Card' })
          return
        }
      }

      user.update({ role: security.roles.deluxe, deluxeToken: security.deluxeToken(user.email) })
        .then(user => {
          challengeUtils.solveIf(challenges.freeDeluxeChallenge, () => { return security.verify(utils.jwtFrom(req)) && req.body.paymentMode !== 'wallet' && req.body.paymentMode !== 'card' })
          // @ts-expect-error FIXME some properties missing in user
          user = utils.queryResultToJson(user)
          const updatedToken = security.authorize(user)
          security.authenticatedUsers.put(updatedToken, user)
          res.status(200).json({ status: 'success', data: { confirmation: 'Congratulations! You are now a deluxe member!', token: updatedToken } })
        }).catch(() => {
          res.status(400).json({ status: 'error', error: 'Something went wrong. Please try again!' })
        })
    } catch (err: unknown) {
      res.status(400).json({ status: 'error', error: 'Something went wrong: ' + utils.getErrorMessage(err) })
    }
  }
}

module.exports.deluxeMembershipStatus = function deluxeMembershipStatus () {
  return (req: Request, res: Response) => {
    if (security.isCustomer(req)) {
      res.status(200).json({ status: 'success', data: { membershipCost: 49 } })
    } else if (security.isDeluxe(req)) {
      res.status(400).json({ status: 'error', error: 'You are already a deluxe member!' })
    } else {
      res.status(400).json({ status: 'error', error: 'You are not eligible for deluxe membership!' })
    }
  }
}
