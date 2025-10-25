import { useCallback } from 'react';

export function useScrollToSection(offset: number) {
  const scrollToSection = useCallback(
    (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
        const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    },
    [offset],
  );

  return scrollToSection;
}
