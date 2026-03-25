import { t } from '@/utils/i18n';
import { extractMetadata } from '@/utils/metadata';
import Link from 'next/link';

function AdminPage() {
  const metadata = extractMetadata();
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{t('admin.pages.title')}</h1>
        <nav>
          <ul className="list-none p-0">
            {Object.keys(metadata)
              .filter((key) => metadata[key].title)
              .map((key) => (
                <li key={key} className="mb-2">
                  <Link
                    href={{
                      pathname: `/admin/${key === 'User' ? 'roles' : key}`,
                      query: {
                        canCreate: metadata[key].canCreate,
                        canEdit: metadata[key].canEdit,
                        canDelete: metadata[key].canDelete
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 font-medium"
                  >
                    {t(`admin.pages.${metadata[key].title}`)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

export default AdminPage;
