import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  canEditDepartment,
  editableDepartments,
  getTimeGreeting,
  isActive,
  isAdmin,
  isOverseer,
  isStaff,
  isTreasurer,
} from "../lib/auth";

const profile = (overrides = {}) => ({
  id: "u1",
  display_name: "Test Person",
  role: "member",
  status: "active",
  ...overrides,
});

describe("role labels and assignable roles", () => {
  test("every assignable role has a human label", () => {
    ASSIGNABLE_ROLES.forEach((role) => {
      expect(ROLE_LABELS[role]).toBeTruthy();
    });
  });

  test("the six church roles are assignable", () => {
    expect(ASSIGNABLE_ROLES).toEqual([
      "member",
      "department_editor",
      "department_head",
      "treasurer",
      "pastor",
      "admin",
    ]);
  });
});

describe("time-aware greeting helper", () => {
  test("it returns a morning, afternoon, or evening greeting based on the clock", () => {
    expect(getTimeGreeting("Sarah", new Date("2026-09-12T08:30:00"))).toContain("Good morning, Sarah");
    expect(getTimeGreeting("Sarah", new Date("2026-09-12T14:30:00"))).toContain("Good afternoon, Sarah");
    expect(getTimeGreeting("Sarah", new Date("2026-09-12T20:30:00"))).toContain("Good evening, Sarah");
  });
});

describe("authority helpers", () => {
  test("only admin and pastor oversee every department", () => {
    expect(isOverseer(profile({ role: "admin" }))).toBe(true);
    expect(isOverseer(profile({ role: "pastor" }))).toBe(true);
    expect(isOverseer(profile({ role: "treasurer" }))).toBe(false);
    expect(isOverseer(profile({ role: "department_head" }))).toBe(false);
  });

  test("treasury authority includes treasurer, admin and pastor", () => {
    expect(isTreasurer(profile({ role: "treasurer" }))).toBe(true);
    expect(isTreasurer(profile({ role: "admin" }))).toBe(true);
    expect(isTreasurer(profile({ role: "pastor" }))).toBe(true);
    expect(isTreasurer(profile({ role: "department_editor" }))).toBe(false);
  });

  test("administrators are the only people managers", () => {
    expect(isAdmin(profile({ role: "admin" }))).toBe(true);
    expect(isAdmin(profile({ role: "pastor" }))).toBe(false);
  });

  test("a suspended account loses every elevated power", () => {
    const suspendedAdmin = profile({ role: "admin", status: "suspended" });
    const suspendedPastor = profile({ role: "pastor", status: "suspended" });
    expect(isActive(suspendedAdmin)).toBe(false);
    expect(isAdmin(suspendedAdmin)).toBe(false);
    expect(isOverseer(suspendedAdmin)).toBe(false);
    expect(isOverseer(suspendedPastor)).toBe(false);
    expect(isTreasurer(suspendedAdmin)).toBe(false);
    expect(isStaff(suspendedAdmin)).toBe(false);
  });
});

describe("department scoping", () => {
  test("overseers edit every department", () => {
    const admin = profile({ role: "admin" });
    expect(editableDepartments(admin)).toHaveLength(8);
    expect(canEditDepartment(admin, "youth")).toBe(true);
  });

  test("a department head only edits departments they lead or belong to", () => {
    const head = profile({
      role: "department_head",
      ledDepartments: ["youth"],
    });
    expect(canEditDepartment(head, "youth")).toBe(true);
    expect(canEditDepartment(head, "men", ["men"])).toBe(true);
    expect(canEditDepartment(head, "women")).toBe(false);
  });

  test("a plain member edits nothing", () => {
    const member = profile();
    expect(canEditDepartment(member, "youth")).toBe(false);
    expect(editableDepartments(member)).toHaveLength(0);
  });

  test("a suspended head edits nothing", () => {
    const suspendedHead = profile({
      role: "department_head",
      status: "suspended",
      ledDepartments: ["youth"],
    });
    expect(canEditDepartment(suspendedHead, "youth")).toBe(false);
  });
});
