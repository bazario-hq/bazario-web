import * as Fa from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons';

// Icon names used across the app.
const ICONS = {
  cart: 'FaShoppingCart',
  heart: 'FaHeart',
  heartOutline: 'FaRegHeart',
  bell: 'FaBell',
  user: 'FaUserCircle',
  search: 'FaSearch',
  star: 'FaStar',
  store: 'FaStore',
  box: 'FaBox',
  truck: 'FaTruck',
  check: 'FaCheck',
  times: 'FaTimes',
  trash: 'FaTrash',
  plus: 'FaPlus',
  minus: 'FaMinus',
  edit: 'FaEdit',
  signOut: 'FaSignOutAlt',
  image: 'FaImage',
  upload: 'FaUpload',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & IconBaseProps) {
  const Component = (Fa as Record<string, (p: IconBaseProps) => JSX.Element>)[ICONS[name]];
  if (!Component) return null;
  return <Component aria-hidden="true" {...props} />;
}
