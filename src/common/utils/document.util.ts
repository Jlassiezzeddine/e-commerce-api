import { Document } from 'mongoose';

/**
 * Safely extract string ID from a Mongoose document
 */
export function getDocumentId(doc: Document | { id?: string; _id?: unknown }): string {
  if ('id' in doc && typeof doc.id === 'string') {
    return doc.id;
  }
  if ('_id' in doc && doc._id) {
    return String(doc._id);
  }
  throw new Error('Document does not have a valid ID');
}
