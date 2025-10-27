/* eslint-disable jsx-a11y/anchor-has-content */
import { AnchorHTMLAttributes } from 'react';

import Link from 'next/link';
import type { LinkProps } from 'next/link';

const CustomLink = ({ href, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith('/');
  const isAnchorLink = href && href.startsWith('#');

  if (isInternalLink) {
    return <Link href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a href={href} {...rest} />;
  }

  return <a target="_blank" rel="noopener noreferrer" href={href} {...rest} />;
};

export default CustomLink;
