import { destroyImages, uploadedImages } from './upload.middleware.js';

// Validates req.body against a zod schema and replaces it with the parsed
// result, so unknown fields are stripped before they reach a controller.
const validate = (schema) => async (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    // Images that were already uploaded for this request are no longer needed
    await destroyImages(uploadedImages(req.files));
    return res.status(400).json({
      message: result.error.issues[0].message,
      errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

export default validate;
