import { describe, it, expect } from "vitest";
import { roleToPath } from "@/pages/Login";

describe("roleToPath utility", () => {
  it("routes admin to /admin", () => {
    expect(roleToPath("admin")).toBe("/admin");
  });
  it("routes professional to /professional-dashboard", () => {
    expect(roleToPath("professional")).toBe("/professional-dashboard");
  });
  it("routes entrepreneur to /Dashboard", () => {
    expect(roleToPath("entrepreneur")).toBe("/Dashboard");
  });
  it("routes null to /choose-role", () => {
    expect(roleToPath(null)).toBe("/choose-role");
  });
  it("routes undefined to /choose-role", () => {
    expect(roleToPath(undefined)).toBe("/choose-role");
  });
  it("routes unknown role to /choose-role", () => {
    expect(roleToPath("viewer")).toBe("/choose-role");
  });
});
