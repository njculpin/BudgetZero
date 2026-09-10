// Icons as Astro components.
//
// Astro compiles an imported .svg into a component, so an icon is used as
// `<BellIcon width={20} height={20} />` and inherits `currentColor` from
// whatever it sits in. They were previously pasted inline — the bell alone
// appeared four times, at three different stroke widths.
//
// These are Astro components and cannot be used inside a .tsx island; a Solid
// component still writes its own markup.

export { default as AlertCircleIcon } from './alert-circle.svg';
export { default as ArrowLeftIcon } from './arrow-left.svg';
export { default as AwardIcon } from './award.svg';
export { default as BellIcon } from './bell.svg';
export { default as CheckCircleIcon } from './check-circle.svg';
export { default as CheckIcon } from './check.svg';
export { default as ClockIcon } from './clock.svg';
export { default as DollarSignIcon } from './dollar-sign.svg';
export { default as DownloadIcon } from './download.svg';
export { default as FileTextIcon } from './file-text.svg';
export { default as FileIcon } from './file.svg';
export { default as ImageIcon } from './image.svg';
export { default as PackageIcon } from './package.svg';
export { default as SearchIcon } from './search.svg';
export { default as ShieldIcon } from './shield.svg';
export { default as ShoppingCartIcon } from './shopping-cart.svg';
export { default as SpinnerIcon } from './spinner.svg';
export { default as TagIcon } from './tag.svg';
export { default as UserIcon } from './user.svg';
export { default as XCircleIcon } from './x-circle.svg';
