import { z } from 'zod';

const statusSchema = z.number().int().min(400).max(599);
const responseSchema = z.object({
  response: z.object({ status: statusSchema.optional(), data: z.unknown().optional() }).optional(),
});
const errorBodySchema = z.object({
  statusCode: statusSchema.optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
});

const readErrorResponse = (error: unknown) => responseSchema.safeParse(error).data?.response;

export const getApiErrorStatus = (error: unknown) => {
  const response = readErrorResponse(error);
  return response?.status ?? errorBodySchema.safeParse(response?.data).data?.statusCode;
};

export const getApiErrorMessage = (error: unknown) => {
  const message = errorBodySchema.safeParse(readErrorResponse(error)?.data).data?.message;
  return Array.isArray(message) ? message.join('\n') : message;
};
