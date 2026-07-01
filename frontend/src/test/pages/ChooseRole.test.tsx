import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChooseRole from "@/pages/ChooseRole";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth");
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockUser = { uid: "user_123", email: "user@radahworks.com" };

const mockAuthBase = {
  user: mockUser,
  loading: false,
  role: null,
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  saveRole: vi.fn().mockResolvedValue(undefined),
  refreshMe: vi.fn(),
};

describe("ChooseRole Page", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuthBase as any);
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("shows Join Radah Works heading", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      expect(screen.getByText("Join Radah Works")).toBeInTheDocument();
    });

    it("shows Entrepreneur role card", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      expect(screen.getByText("Entrepreneur")).toBeInTheDocument();
    });

    it("shows Professional role card", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      expect(screen.getByText("Professional")).toBeInTheDocument();
    });

    it("continue button is disabled before any selection", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      expect(screen.getByRole("button", { name: /select a role/i })).toBeDisabled();
    });
  });

  describe("Role Selection", () => {
    it("selecting Entrepreneur shows Selected badge", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Entrepreneur").closest("button")!);
      expect(screen.getAllByText("Selected")).toHaveLength(1);
    });

    it("selecting Professional shows Selected badge", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Professional").closest("button")!);
      expect(screen.getAllByText("Selected")).toHaveLength(1);
    });

    it("continue button updates text when Entrepreneur selected", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Entrepreneur").closest("button")!);
      expect(screen.getByRole("button", { name: /continue as entrepreneur/i })).toBeInTheDocument();
    });

    it("continue button updates text when Professional selected", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Professional").closest("button")!);
      expect(screen.getByRole("button", { name: /continue as professional/i })).toBeInTheDocument();
    });

    it("continue button is enabled after selecting a role", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Entrepreneur").closest("button")!);
      expect(screen.getByRole("button", { name: /continue as entrepreneur/i })).not.toBeDisabled();
    });

    it("switching from Entrepreneur to Professional updates the badge", () => {
      render(<MemoryRouter><ChooseRole /></MemoryRouter>);
      fireEvent.click(screen.getByText("Entrepreneur").closest("button")!);
      fireEvent.click(screen.getByText("Professional").closest("button")!);
      expect(screen.getByRole("button", { name: /continue as professional/i })).toBeInTheDocument();
    });
  });
});
