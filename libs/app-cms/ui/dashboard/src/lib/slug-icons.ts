import { CollectionSlug } from '@codeware/shared/util/payload-types';
import {
  Bars3Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  InboxIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  RectangleGroupIcon,
  SquaresPlusIcon,
  TagIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

import type { IconComponent } from './types';

const SLUG_ICON: Record<CollectionSlug, IconComponent> = {
  categories: RectangleGroupIcon,
  faq: QuestionMarkCircleIcon,
  forms: ClipboardDocumentListIcon,
  'form-submissions': InboxIcon,
  pages: DocumentIcon,
  posts: DocumentTextIcon,
  media: PhotoIcon,
  navigation: Bars3Icon,
  'reusable-content': SquaresPlusIcon,
  'site-settings': Cog6ToothIcon,
  tags: TagIcon,
  tenants: UserGroupIcon,
  users: UsersIcon
};

/** Resolve the icon for a collection slug, falling back to a folder. */
export function getSlugIcon(slug: string): IconComponent {
  return SLUG_ICON[slug as CollectionSlug] ?? FolderIcon;
}
