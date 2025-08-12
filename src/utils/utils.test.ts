import { calculateSumAndProduct, mathUtils } from './utils';

describe('calculateSumAndProduct', () => {
  it('spies on add method', () => {
    const spyAdd = jest.spyOn(mathUtils, 'add');
    const spyMultiply = jest.spyOn(mathUtils, 'multiply');

    const result = calculateSumAndProduct(3, 4);

    expect(spyAdd).toHaveBeenCalledWith(3, 4);
    expect(spyMultiply).toHaveBeenCalledWith(3, 4);

    expect(result).toEqual({ sum: 7, product: 12 });

    spyAdd.mockRestore();
    spyMultiply.mockRestore();
  });

  it('mocks add method to return fixed value', () => {
    const spyAdd = jest.spyOn(mathUtils, 'add').mockImplementation(() => 42);

    const result = calculateSumAndProduct(3, 4);

    expect(spyAdd).toHaveBeenCalledWith(3, 4);
    expect(result.sum).toBe(42);  // mocked result
    expect(result.product).toBe(12); // real multiply called

    spyAdd.mockRestore();
  });
});
