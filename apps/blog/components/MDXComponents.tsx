import type { MDXComponents } from 'mdx/types';
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm';
import Pre from 'pliny/ui/Pre';
import TOCInline from 'pliny/ui/TOCInline';

import Image from './Image';
import CustomLink from './Link';
import TableWrapper from './TableWrapper';

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
};
