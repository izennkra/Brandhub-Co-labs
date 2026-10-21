import { useId, type SVGProps } from 'react';
import styles from './Icon.module.css';
import { icons, type IconDefinition } from './icons.registry';

export type IconName = keyof typeof icons;
export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

// Central n'a pas de trait réglable : on choisit la variante (trait 1,5 ou 2, dessinée en 24 px)
// qui donne un trait affiché régulier à chaque taille (voir docs/design-tokens.md § 7).
const STROKE_BY_SIZE: Record<IconSize, 'stroke15' | 'stroke2'> = {
  xs: 'stroke2', // 12 px → trait affiché 1 px
  sm: 'stroke2', // 16 px → 1,33 px
  md: 'stroke15', // 20 px → 1,25 px
  lg: 'stroke15', // 24 px → 1,5 px
};

type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  'name' | 'stroke' | 'children' | 'dangerouslySetInnerHTML' | 'width' | 'height'
> & {
  name: IconName;
  size?: IconSize;
  title?: string;
};

export function Icon({ name, size = 'sm', title, className, ...props }: IconProps) {
  const id = useId();
  const icon = (icons as Record<string, IconDefinition>)[name];
  if (!icon) throw new Error(`Icône inconnue : ${name}`);
  const labeled = Boolean(title || props['aria-label'] || props['aria-labelledby']);

  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      color="currentColor"
      data-size={size}
      className={[styles.icon, styles[size], className].filter(Boolean).join(' ')}
      aria-hidden={labeled ? undefined : true}
      role={labeled ? 'img' : undefined}
      aria-labelledby={title ? `${id}-title` : undefined}
      focusable="false"
      {...props}
    >
      {title && <title id={`${id}-title`}>{title}</title>}
      {icon[STROKE_BY_SIZE[size]](id)}
    </svg>
  );
}
