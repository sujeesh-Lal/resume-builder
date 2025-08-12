export const getGreeting = (name: string) => {
  return `Hello, ${name}!`;
};

export const delayedCallback = (cb: (msg: string) => void) => {
  setTimeout(() => {
    cb('hello');
  }, 1000);
};

export const mathUtils = {
  add: (a: number, b: number) => a + b,
  multiply: (a: number, b: number) => a * b,
};


export function calculateSumAndProduct(x: number, y: number) {
  const sum = mathUtils.add(x, y);
  const product = mathUtils.multiply(x, y);
  return { sum, product };
}