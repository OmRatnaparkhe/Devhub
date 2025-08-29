
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string | null;
        sessionId: string | null;
        orgId: string | null;
        getToken: ((options?: { template?: string | undefined; }) => Promise<string | null>) | null;
      };
    }
  }
}

// declare module for multer-storage-cloudinary
declare module "multer-storage-cloudinary" {
  import { StorageEngine } from "multer";

  export interface Params {
    folder?: string;
    format?: string | ((req: Express.Request, file: Express.Multer.File) => string);
    public_id?: string | ((req: Express.Request, file: Express.Multer.File) => string);
    allowed_formats?: string[];
    transformation?: object;
  }

  export interface CloudinaryStorageOptions {
    cloudinary: any;
    params?: Params | ((req: Express.Request, file: Express.Multer.File) => Params);
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
  }
}

export {}