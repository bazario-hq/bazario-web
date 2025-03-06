import * as Fa from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons';

// Icon names used across the app. Keep this list in sync with the design kit (BZR-141).
const ICONS = {
  cart: 'FaShoppingCart',
  heart: 'FaHeart',
  heartOutline: 'FaRegHeart',
  bell: 'FaBell',
  user: 'FaUserCircle',
  search: 'FaSearch',
  star: 'FaStar',
  starHalf: 'FaStarHalfAlt',
  starOutline: 'FaRegStar',
  store: 'FaStore',
  box: 'FaBox',
  truck: 'FaTruck',
  check: 'FaCheck',
  times: 'FaTimes',
  trash: 'FaTrash',
  plus: 'FaPlus',
  minus: 'FaMinus',
  edit: 'FaEdit',
  chart: 'FaChartLine',
  warehouse: 'FaWarehouse',
  money: 'FaMoneyBillWave',
  users: 'FaUsers',
  shield: 'FaShieldAlt',
  list: 'FaListUl',
  signOut: 'FaSignOutAlt',
  chevronLeft: 'FaChevronLeft',
  chevronRight: 'FaChevronRight',
  tag: 'FaTag',
  fire: 'FaFire',
  image: 'FaImage',
  upload: 'FaUpload',
  history: 'FaHistory',
  info: 'FaInfoCircle',
  exclamation: 'FaExclamationTriangle',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & IconBaseProps) {
  const Component = (Fa as Record<string, (p: IconBaseProps) => JSX.Element>)[ICONS[name]];
  if (!Component) return null;
  return <Component aria-hidden="true" {...props} />;
}
