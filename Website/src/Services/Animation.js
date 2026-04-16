export const slideLeft = {
  initial: { x: -30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
};

export const slideDown = {
  initial: { y: -30, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, ease: "easeInOut" }
};

export const fadeIn = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  transition: {duration: 0.7, ease: "easeInOut"}
}
