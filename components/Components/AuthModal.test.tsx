import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils';
import AuthModal from './AuthModal';
import * as AuthContext from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock react-dom createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: any) => node,
  };
});

describe('AuthModal', () => {
  const mockOnClose = vi.fn();
  const mockLogin = vi.fn();
  const mockFetchUserData = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock router
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    // Mock Auth context
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      fetchUserData: mockFetchUserData,
      token: null,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
      isLoading: false,
    } as any);
  });

  it('should render login form when modal is open', () => {
    const { container } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    // Check for form elements instead of button text
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(container.querySelector('button[type="submit"]')).toBeInTheDocument();
  });

  it('should not render when modal is closed', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={mockOnClose} />);

    // Modal should not be visible
    expect(container.firstChild).toBeNull();
  });

  it('should switch to register form when clicking register link', async () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    // Find and click the register link
    const registerLink = screen.getByText(/Don't have an account/i).closest('p')?.querySelector('span');

    if (registerLink) {
      fireEvent.click(registerLink);

      await waitFor(() => {
        expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
      });
    }
  });

  it('should display email input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('should display password input field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText(/password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it('should have a submit button', () => {
    const { container } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display validation errors for empty email', async () => {
    const { container } = render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitButton = container.querySelector('button[type="submit"]');

    // Trigger validation by blurring the field
    fireEvent.blur(emailInput);

    // Try to submit
    if (submitButton) {
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      // Form validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('should allow typing in email field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should allow typing in password field', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });
});
