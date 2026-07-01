import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

vi.mock("@/hooks/useAuth");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockAuthBase = {
  user: null,
  loading: false,
  role: null,
  signIn: vi.fn().mockResolvedValue(undefined),
  signInWithGoogle: vi.fn().mockResolvedValue(null),
  signUp: vi.fn().mockResolvedValue(undefined),
  saveRole: vi.fn().mockResolvedValue(undefined),
  refreshMe: vi.fn().mockResolvedValue(null),
};

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuthBase as any);
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("shows welcome heading", () => {
      renderLogin();
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
    });

    it("shows Radah Works subtitle", () => {
      renderLogin();
      expect(screen.getByText("Sign in to Radah Works")).toBeInTheDocument();
    });

    it("renders email input", () => {
      renderLogin();
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    it("renders password input", () => {
      renderLogin();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });

    it("renders Sign In button", () => {
      renderLogin();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders Google sign-in button", () => {
      renderLogin();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      renderLogin();
      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    });

    it("renders sign up link", () => {
      renderLogin();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
    });

    it("huth is loading", () => {
      vi.mocked(useAuth).mockReturnValue({ ...mockAuthBase, loading: true } as any);
      renderLogin();
      expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows error when email is empty on submit", () => {
      renderLogin();
      const form = screen.getByPlaceholderText("you@example.com").closest("form")!;
      fireEvent.submit(form);
      expect(toast.error).toHaveBeenCalledWith("Enter a valid email");
    });

    it("shows error for invalid email format", () => {
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "not-an-email" },
      });
      const form = screen.getByPlaceholderText("you@example.com").closest("form")!;
      fireEvent.submit(form);
      expect(toast.error).toHaveBeenCalledWith("Enter a valid email");
    });

    it("shows error when password is too short", () => {
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "user@radahworks.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "123" },
      });
      const form = screen.getByPlaceholderText("you@example.com").closest("form")!;
      fireEvent.submit(form);
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters");
    });

    it("calls signIn with valid credentials", async () => {
      const signIn = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue({ ...mockAuthBase, signIn } as any);
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "user@radahworks.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "password123" },
      });
      const form = screen.getByPlaceholderText("you@example.com").closest("form")!;
      fireEvent.submit(form);
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith("user@radahworks.com", "password123", false);
      });
    });
  });
});
