import React, { useEffect, useState } from 'react';

interface DynamicLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  baseUrl: string;
}

/**
 * A link that appends the current page's query parameters to the baseUrl.
 * @returns
 */
export const QueryParamsLink: React.FC<DynamicLinkProps> = ({ baseUrl, children, ...props }) => {
  const [linkHref, setLinkHref] = useState(baseUrl);

  useEffect(() => {
    // Get the current page's query parameters
    const queryParams = window.location.search;

    // If the baseUrl already has query parameters, append with "&", otherwise use "?"
    const updatedHref = baseUrl.includes('?')
      ? `${baseUrl}&${queryParams.substring(1)}` // Remove the leading "?" from queryParams
      : `${baseUrl}${queryParams}`;

    // Update the state with the new href
    setLinkHref(updatedHref);
  }, [baseUrl]); // Run effect when baseUrl changes

  return (
    <a href={linkHref} {...props}>
      {children}
    </a>
  );
};
