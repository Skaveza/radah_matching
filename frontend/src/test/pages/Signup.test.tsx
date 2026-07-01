import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "@/pages/Signup";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockAuthBase = {
  user: null,
  loading: false,
  role: null,
  signIn: vi.fn(),
  signInWithGoogle: vi.fn().mockResolvedValue(null),
  signUp: vi.fn().mockResolvedValue(undefined),
  saveRole: vi.fn(),
  refreshMe: vi.fn(),
};

describe("Signup Page", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuthBase as any);
    vi.clearAllMocks();
  });

  it("shows create account heading", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("shows subtitle", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Sign up to access teams and projects")).toBeInTheDocument();
  });

  it("renders full name input", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByPlaceholderText("Jane Doe")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("renders Create Account button", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders Google sign-up button", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("renders sign in link for existing users", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders region country selector placeholder", () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByText("Select your country")).toBeInTheDocument();
  });
});
