import express from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import statusCode from '~/constants/statusCode'
import { EntityError, ErrorWithStatus } from '~/models/errors'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validateSchema = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    // Không có lỗi thì next tiếp tục request
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      // Trả về lỗi không phải là lỗi do validate
      if (msg instanceof ErrorWithStatus && msg.status !== statusCode.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = errorsObject[key]
    }
    next(entityError)
  }
}
