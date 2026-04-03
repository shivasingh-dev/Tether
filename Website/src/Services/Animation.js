export const slideLeft = {
  initial: { x: -40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 1.1, ease: "easeInOut" }
};

export const slideDown = {
  initial: { y: -30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.8, ease: "easeInOut" }
};

export const fadeIn = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  transition: {duration: 0.7, ease: "easeInOut"}
}
