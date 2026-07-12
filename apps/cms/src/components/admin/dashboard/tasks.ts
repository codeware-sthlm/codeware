import {
  Bars3Icon,
  DocumentIcon,
  DocumentTextIcon,
  InboxIcon,
  PhotoIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import type { CollectionSlug } from 'payload';

import type { IconComponent } from '@codeware/app-cms/ui/dashboard';
import type { TranslationsKeys } from '@codeware/app-cms/util/i18n';

export type TaskDef = {
  labelKey: TranslationsKeys;
  subKey: TranslationsKeys;
  href: string;
  icon: IconComponent;
  /**
   * Collection this task creates a document in. When set, the task is only
   * shown to users with create permission for that collection.
   */
  createSlug?: CollectionSlug;
  /** Show a live count in the sub text when this collection has items. */
  countSlug?: string;
  countSubKey?: TranslationsKeys;
};

/** Quick-task cards on the dashboard Home tab. */
export const TASKS: TaskDef[] = [
  {
    labelKey: 'dashboard:taskWritePost',
    subKey: 'dashboard:taskWritePostSub',
    href: '/admin/collections/posts/create',
    icon: DocumentTextIcon,
    createSlug: 'posts'
  },
  {
    labelKey: 'dashboard:taskAddPage',
    subKey: 'dashboard:taskAddPageSub',
    href: '/admin/collections/pages/create',
    icon: DocumentIcon,
    createSlug: 'pages'
  },
  {
    labelKey: 'dashboard:taskUploadImage',
    subKey: 'dashboard:taskUploadImageSub',
    href: '/admin/collections/media/create',
    icon: PhotoIcon,
    createSlug: 'media'
  },
  {
    labelKey: 'dashboard:taskEditMenu',
    subKey: 'dashboard:taskEditMenuSub',
    href: '/admin/collections/navigation',
    icon: Bars3Icon
  },
  {
    labelKey: 'dashboard:taskReadMessages',
    subKey: 'dashboard:taskReadMessagesSub',
    href: '/admin/collections/form-submissions',
    icon: InboxIcon,
    countSlug: 'form-submissions',
    countSubKey: 'dashboard:taskReadMessagesSubCount'
  },
  {
    labelKey: 'dashboard:taskInviteTeammate',
    subKey: 'dashboard:taskInviteTeammateSub',
    href: '/admin/collections/users/create',
    icon: UserPlusIcon,
    createSlug: 'users'
  }
];
