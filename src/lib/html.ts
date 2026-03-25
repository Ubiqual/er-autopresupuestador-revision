export const scrollToElement = ({ ref, maxWidth }: { ref: React.RefObject<HTMLElement>; maxWidth?: number }) => {
  if (!ref.current || (maxWidth && window.innerWidth >= maxWidth)) {
    return;
  }
  const headerHeight = window.innerWidth < 1024 ? 44 : 60;
  const elementPosition = ref.current.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};
