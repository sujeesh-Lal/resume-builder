import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Hello } from './Hello';
import { getGreeting } from '../utils/utils';
import { fetchUser } from '../utils/api';

jest.mock('../utils/utils', () => ({
  getGreeting: jest.fn(),
}));

// ✅ mock the module
jest.mock('../utils/api', () => ({
  fetchUser: jest.fn(),
}));

jest.useFakeTimers(); // ✅ Enable fake timers globally for this test file


describe('Hello component', () => {
  it('renders greeting with provided name', () => {
    render(<Hello name="Alice" />);
    expect(screen.getByTestId('name').textContent).toBe('Hello, Alice!');
  });

  it('renders the correct sum of 2 and 3', () => {
    render(<Hello name="Bob" />);
    expect(screen.getByTestId('sum').textContent).toBe('5');
  });

  it('renders greeting with provided name', () => {
    const { container } = render(<Hello name="Alice" />);

    const greeting = container.querySelector('#name');
    expect(greeting?.textContent).toBe('Hello, Alice!');

    const sum = container.querySelector('#sum');
    expect(sum?.textContent).toBe('5');
  });

  it('calls mock function with correct argument', () => {
    const mockFn = jest.fn();

    render(<Hello name="ciyanika" onFire={mockFn} />)
    fireEvent.click(screen.getByTestId('fire'));
    expect(mockFn).toHaveBeenCalledWith('ciyanika');
  });

  it('displays mocked greeting from getGreeting', () => {
    (getGreeting as jest.Mock).mockReturnValue('Hi, Mocked User!');

    render(<Hello name="Alice" />);

    expect(getGreeting).toHaveBeenCalledWith('Alice');
    expect(screen.getByTestId('gID').textContent).toBe('Hi, Mocked User!');
  });

  it('shows message after 3 seconds', () => {
    render(<Hello name="ravijith" />);

    // Before timeout
    expect(screen.getByTestId('msg').textContent).toBe('');

    // Fast-forward time by 3000ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    // Now the message should appear
    expect(screen.getByTestId('msg').textContent).toBe('Hello after delay!');
  });

  it('displays user name from mocked API', async () => {

    // ✅ mock async return value
    (fetchUser as jest.Mock).mockResolvedValue('Alice');


    render(<Hello name='sujeesh' />);

    // ✅ wait for the async call to complete and update UI
    await waitFor(() => {
      expect(screen.getByTestId('userName').textContent).toBe('');
    });

    // ✅ confirm the function was called
    expect(fetchUser).toHaveBeenCalled();
  });
});
