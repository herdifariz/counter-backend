import Joi from "joi";

export const VLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const VCounterSchema = Joi.object({
  name: Joi.string().required(),
  max_queue: Joi.number().integer().min(1).default(99),
  is_active: Joi.boolean().optional(),
});

export const VNextQueueSchema = Joi.object({
  counter_id: Joi.number().integer().required(),
});

export const VSkipQueueSchema = Joi.object({
  counter_id: Joi.number().integer().required(),
});

export const VResetQueueSchema = Joi.object({
  counter_id: Joi.number().integer().optional(),
});

export const VBaseID = Joi.object({
  id: Joi.number().integer().optional(),
});

export const VAdminSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required().min(6),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

export const VUpdateAdminSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().optional().allow("", null),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

export const VGetSearchSchema = Joi.object({
  q: Joi.string().optional().allow("", null),
});
