import Joi from "joi";

export const loginSchema = Joi.object({
  username: Joi.string().min(3),
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
}).or("username", "email");

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
});

export const updateUserSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(3).required(),
  password: Joi.string().min(6),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
