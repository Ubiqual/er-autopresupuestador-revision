import fs from 'fs';
import path from 'path';

interface Metadata {
  title: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type MetadataRecord = Record<string, Metadata>;

export function extractMetadata(): MetadataRecord {
  const schemaFilePath = path.join(process.cwd(), 'prisma/schema.prisma');
  const schema = fs.readFileSync(schemaFilePath, 'utf8');
  const metadata: MetadataRecord = {};

  const modelRegex = /model (\w+) {([\s\S]+?)}/g;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelRegex.exec(schema)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];

    const titleMatch = /\/\/\/ Title: (.+)/.exec(modelBody);
    const canCreateMatch = /\/\/\/ CanCreate: (true|false)/.exec(modelBody);
    const canEditMatch = /\/\/\/ CanEdit: (true|false)/.exec(modelBody);
    const canDeleteMatch = /\/\/\/ CanDelete: (true|false)/.exec(modelBody);

    if (titleMatch && canCreateMatch && canEditMatch && canDeleteMatch) {
      metadata[modelName] = {
        title: titleMatch[1],
        canCreate: canCreateMatch[1] === 'true',
        canEdit: canEditMatch[1] === 'true',
        canDelete: canDeleteMatch[1] === 'true'
      };
    }
  }

  return metadata;
}
