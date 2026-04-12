import { RenderPost } from '@codeware/shared/ui/cms-renderer';
import { t } from '@codeware/shared/util/i18n';
import {
  findBySlug,
  findNavigationDoc,
  getBlocksData
} from '@codeware/shared/util/payload-api';
import type { NavigationDoc, Post } from '@codeware/shared/util/payload-types';
import {
  type BlocksData,
  resolveMeta
} from '@codeware/shared/util/payload-utils';
import type { MetaFunction } from '@remix-run/node';
import {
  json,
  useLoaderData,
  useRouteError,
  useRouteLoaderData
} from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { RenderPagesDoc } from '../components/render-pages-doc';
import type { loader as rootLoader } from '../root';
import { defaultAppName } from '../utils/default-app-name';
import { ensurePayloadDoc } from '../utils/ensure-payload-doc';
import { getPayloadRequestOptions } from '../utils/get-payload-request-options';
import { getTenantConfigFromRoot } from '../utils/get-tenant-config-from-root';
import { TypedLoaderFunctionArgs } from '../utils/types';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  const tenantConfig = getTenantConfigFromRoot(matches);
  const appName = tenantConfig?.appName ?? defaultAppName;

  const post = (data as { post: Post | null } | undefined)?.post ?? null;
  const doc = ensurePayloadDoc(
    (data as { doc: NavigationDoc | null } | undefined)?.doc
  );
  const meta = resolveMeta(post ?? doc);

  return [{ title: `${appName} - ${meta?.title ?? 'Page'}` }];
};

/**
 * Fetch document data for the current route.
 */
export async function loader({
  context,
  params,
  request
}: TypedLoaderFunctionArgs) {
  const { collection, slug } = params;

  // Only slug is required
  if (!slug) {
    const error: LoaderError = {
      message: 'Page not found',
      status: 404
    };
    throw Response.json(error);
  }

  try {
    const requestOptions = getPayloadRequestOptions(
      'GET',
      context,
      request.headers
    );

    // Posts are fetched as full documents to support RenderPost
    if (collection === 'posts') {
      const post = await findBySlug('posts', slug, requestOptions);
      if (!post) {
        throw Response.json({ message: 'Page not found' }, { status: 404 });
      }
      return json({ doc: null, post, blocksData: {} as BlocksData });
    }

    const doc = await findNavigationDoc(collection, slug, requestOptions);
    if (!doc) {
      throw Response.json({ message: 'Page not found' }, { status: 404 });
    }

    const blocksData: BlocksData =
      doc.collection === 'pages'
        ? await getBlocksData(doc.layout, requestOptions)
        : {};

    return json({ doc, post: null, blocksData });
  } catch (e) {
    const error = e as Error;
    throw Response.json({ message: error.message }, { status: 404 });
  }
}

export default function Document() {
  const data = useLoaderData<typeof loader>();
  const doc = ensurePayloadDoc(data.doc);
  const post = data.post as Post | null;
  const blocksData = data.blocksData as BlocksData;

  return (
    <Container className="mt-16 sm:mt-32">
      {post && <RenderPost post={post} />}
      {doc?.collection === 'pages' && (
        <RenderPagesDoc doc={doc} blocksData={blocksData} />
      )}
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const locale = rootData?.requestInfo.userPrefs.locale ?? 'en';

  return (
    <ErrorContainer locale={locale} severity="error" stackTrace={error.message}>
      {t(locale, 'error.pageRenderFailed')}
    </ErrorContainer>
  );
}
