import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { validate }       from '../../middleware/validate.middleware';
import { createUploader } from '../../middleware/upload.middleware';
import { COLLECTIONS }    from '../../config/upload.config';
import {
  UploadQuerySchema, FileUuidParamSchema, AttachSchema, ListByModelSchema,
} from './file.validators';
import {
  uploadSingle, uploadMultiple, downloadFile, getFile,
  listByModel, listMyFiles, attachFile, deleteFile,
  getCollections, handleMulterError,
} from './file.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload, download, and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileRecord:
 *       type: object
 *       properties:
 *         uuid:         { type: string, format: uuid }
 *         originalName: { type: string, example: "photo.jpg" }
 *         mimeType:     { type: string, example: "image/jpeg" }
 *         size:         { type: integer, example: 204800 }
 *         collection:   { type: string, example: "avatar" }
 *         isPublic:     { type: boolean }
 *         url:          { type: string, example: "/uploads/avatar/uuid.jpg" }
 *         createdAt:    { type: string, format: date-time }
 */

/**
 * @swagger
 * /files/collections:
 *   get:
 *     summary: List available upload collections and their constraints
 *     tags: [Files]
 *     security: []
 *     responses:
 *       200:
 *         description: Collection config map
 */
router.get('/collections', getCollections);

/**
 * @swagger
 * /files/{uuid}/download:
 *   get:
 *     summary: Download or stream a file
 *     tags: [Files]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: File stream }
 *       403: { description: Private file — authentication required }
 *       404: { description: Not found }
 */
router.get(
  '/:uuid/download',
  optionalAuthenticate,
  validate({ params: FileUuidParamSchema }),
  downloadFile,
);

// All other routes require authentication
router.use(authenticate);

// Build a dynamic uploader that picks the collection from the query string.
const dynamicSingle = (req: Request, res: Response, next: NextFunction): void => {
  const collection = (req.query['collection'] as string) || 'general';
  const cfg        = COLLECTIONS[collection];
  const maxCount   = cfg?.maxCount ?? 5;
  createUploader(collection).single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
};

const dynamicMultiple = (req: Request, res: Response, next: NextFunction): void => {
  const collection = (req.query['collection'] as string) || 'general';
  const cfg        = COLLECTIONS[collection];
  const maxCount   = cfg?.maxCount ?? 5;
  createUploader(collection).array('files', maxCount)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
};

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: collection
 *         schema: { type: string, enum: [avatar, listing_image, document, general], default: general }
 *       - in: query
 *         name: isPublic
 *         schema: { type: boolean, default: false }
 *       - in: query
 *         name: modelType
 *         schema: { type: string }
 *       - in: query
 *         name: modelId
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/FileRecord' }
 *       400: { description: File too large or invalid type }
 */
router.post(
  '/upload',
  validate({ query: UploadQuerySchema }),
  dynamicSingle,
  uploadSingle,
);

/**
 * @swagger
 * /files/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: collection
 *         schema: { type: string, enum: [avatar, listing_image, document, general], default: general }
 *       - in: query
 *         name: isPublic
 *         schema: { type: boolean }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Files uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FileRecord' }
 */
router.post(
  '/upload/multiple',
  validate({ query: UploadQuerySchema }),
  dynamicMultiple,
  uploadMultiple,
);

/**
 * @swagger
 * /files/my:
 *   get:
 *     summary: List files uploaded by the authenticated user
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: collection
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated file list
 */
router.get('/my', listMyFiles);

/**
 * @swagger
 * /files/by-model:
 *   get:
 *     summary: List files attached to a specific model instance
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: modelType
 *         required: true
 *         schema: { type: string, example: "User" }
 *       - in: query
 *         name: modelId
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200: { description: File list }
 */
router.get('/by-model', validate({ query: ListByModelSchema }), listByModel);

/**
 * @swagger
 * /files/{uuid}:
 *   get:
 *     summary: Get file metadata by UUID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/FileRecord' }
 *       404: { description: Not found }
 */
router.get('/:uuid', validate({ params: FileUuidParamSchema }), getFile);

/**
 * @swagger
 * /files/{uuid}/attach:
 *   patch:
 *     summary: Attach a file to a model instance
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [modelType, modelId]
 *             properties:
 *               modelType: { type: string, example: "Listing" }
 *               modelId:   { type: integer, example: 42 }
 *     responses:
 *       200: { description: File attached }
 *       404: { description: Not found }
 */
router.patch('/:uuid/attach', validate({ params: FileUuidParamSchema, body: AttachSchema }), attachFile);

/**
 * @swagger
 * /files/{uuid}:
 *   delete:
 *     summary: Delete a file record and the physical file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Forbidden — not your file }
 *       404: { description: Not found }
 */
router.delete('/:uuid', validate({ params: FileUuidParamSchema }), deleteFile);

export default router;
