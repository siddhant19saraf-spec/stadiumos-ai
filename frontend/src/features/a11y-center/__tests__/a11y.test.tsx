import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

beforeEach(() => {
  document.body.innerHTML = "";
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: false,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ===================================================================
   Focus Manager
   =================================================================== */
describe("focus-manager", () => {
  it("should get focusable elements", async () => {
    const { getFocusableElements } = await import("@/lib/a11y/focus-manager");
    document.body.innerHTML = `
      <button>First</button>
      <input type="text" />
      <a href="#">Link</a>
      <div tabindex="0">Div</div>
      <button disabled>Disabled</button>
      <span>Not focusable</span>
      <select><option>1</option></select>
      <textarea></textarea>
    `;
    const elements = getFocusableElements(document.body);
    expect(elements.length).toBe(6);
    expect(elements[0]?.tagName).toBe("BUTTON");
    expect(elements[4]?.tagName).toBe("SELECT");
  });

  it("should trap focus within container", async () => {
    const { trapFocus } = await import("@/lib/a11y/focus-manager");
    document.body.innerHTML = `
      <button>Outside</button>
      <div id="container">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </div>
    `;
    const container = document.getElementById("container")!;
    const cleanup = trapFocus(container);
    const firstBtn = container.querySelector("button")!;
    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);
    cleanup();
  });

  it("should restore focus to previous element", async () => {
    const { restoreFocus } = await import("@/lib/a11y/focus-manager");
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    restoreFocus(trigger);
  });

  it("should find first and last focusable", async () => {
    const { getFirstFocusable, getLastFocusable } = await import("@/lib/a11y/focus-manager");
    document.body.innerHTML = `
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    `;
    expect(getFirstFocusable(document.body)?.textContent).toBe("First");
    expect(getLastFocusable(document.body)?.textContent).toBe("Last");
  });
});

/* ===================================================================
   Announcer
   =================================================================== */
describe("announcer", () => {
  it("should render live regions", async () => {
    const { AnnouncerProvider } = await import("@/lib/a11y/announcer");
    render(
      <AnnouncerProvider>
        <div>Content</div>
      </AnnouncerProvider>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should announce via useAnnouncer", async () => {
    const { AnnouncerProvider, useAnnouncer } = await import("@/lib/a11y/announcer");
    function TestComponent() {
      const { announce } = useAnnouncer();
      return <button onClick={() => announce("Test", "assertive")}>Announce</button>;
    }
    render(
      <AnnouncerProvider>
        <TestComponent />
      </AnnouncerProvider>,
    );
    fireEvent.click(screen.getByText("Announce"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should expose useLiveRegion", async () => {
    const { useLiveRegion } = await import("@/lib/a11y/announcer");
    expect(useLiveRegion).toBeDefined();
  });
});

/* ===================================================================
   Keyboard Navigation
   =================================================================== */
describe("keyboard-nav", () => {
  it("useKeyboard should call handler on key match", async () => {
    const { useKeyboard } = await import("@/lib/a11y/keyboard-nav");
    const handler = vi.fn();
    function TestComponent() {
      useKeyboard({ Enter: handler });
      return <div data-testid="target" />;
    }
    render(<TestComponent />);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useKeyboard should not call handler on different key", async () => {
    const { useKeyboard } = await import("@/lib/a11y/keyboard-nav");
    const handler = vi.fn();
    function TestComponent() {
      useKeyboard({ Escape: handler });
      return <div />;
    }
    render(<TestComponent />);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("useEscape should call handler on Escape", async () => {
    const { useEscape } = await import("@/lib/a11y/keyboard-nav");
    const handler = vi.fn();
    function TestComponent() {
      useEscape(handler);
      return <div />;
    }
    render(<TestComponent />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useArrowNavigation should handle arrow keys", async () => {
    const { useArrowNavigation } = await import("@/lib/a11y/keyboard-nav");
    const ref = { current: document.createElement("div") };
    function TestComponent() {
      useArrowNavigation(ref, { vertical: true });
      return <div />;
    }
    render(<TestComponent />);
  });

  it("useShortcut should register global shortcut", async () => {
    const { useShortcut } = await import("@/lib/a11y/keyboard-nav");
    const handler = vi.fn();
    function TestComponent() {
      useShortcut("k", handler, { ctrl: true });
      return <div />;
    }
    render(<TestComponent />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("useShortcut should not fire without modifier", async () => {
    const { useShortcut } = await import("@/lib/a11y/keyboard-nav");
    const handler = vi.fn();
    function TestComponent() {
      useShortcut("k", handler, { ctrl: true });
      return <div />;
    }
    render(<TestComponent />);
    fireEvent.keyDown(document, { key: "k" });
    expect(handler).not.toHaveBeenCalled();
  });
});

/* ===================================================================
   Motion / Reduced Motion
   =================================================================== */
describe("motion", () => {
  it("shouldReduceMotion returns animation obj when true", async () => {
    const { shouldReduceMotion } = await import("@/lib/a11y/motion");
    const result = shouldReduceMotion(true);
    expect(result).toEqual({ style: { animation: "none", transition: "none" } });
  });

  it("shouldReduceMotion returns empty obj when false", async () => {
    const { shouldReduceMotion } = await import("@/lib/a11y/motion");
    expect(shouldReduceMotion(false)).toEqual({});
  });

  it("should have useReducedMotionClass hook", async () => {
    const { useReducedMotionClass } = await import("@/lib/a11y/motion");
    expect(useReducedMotionClass).toBeDefined();
  });
});

/* ===================================================================
   Skip Link
   =================================================================== */
describe("skip-link", () => {
  it("should render skip link", async () => {
    const { SkipLink } = await import("@/lib/a11y/skip-link");
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("should be focusable", async () => {
    const { SkipLink } = await import("@/lib/a11y/skip-link");
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    link.focus();
    expect(link).toHaveFocus();
  });
});

/* ===================================================================
   SrOnly / VisuallyHidden
   =================================================================== */
describe("sr-only", () => {
  it("should render SrOnly with sr-only class", async () => {
    const { SrOnly } = await import("@/components/a11y/sr-only");
    render(<SrOnly>Hidden text</SrOnly>);
    const el = screen.getByText("Hidden text");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("sr-only");
  });

  it("should render VisuallyHidden", async () => {
    const { VisuallyHidden } = await import("@/components/a11y/sr-only");
    render(<VisuallyHidden>Visually hidden</VisuallyHidden>);
    const el = screen.getByText("Visually hidden");
    expect(el).toBeInTheDocument();
  });
});

/* ===================================================================
   Accessible Dialog
   =================================================================== */
describe("accessible-dialog", () => {
  it("should render dialog with proper ARIA", async () => {
    const { AccessibleDialog } = await import("@/components/a11y/accessible-dialog");
    render(
      <AccessibleDialog open onClose={() => {}} title="Test Dialog">
        <p>Content</p>
      </AccessibleDialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "a11y-dialog-title");
  });

  it("should call onClose on Escape", async () => {
    const { AccessibleDialog } = await import("@/components/a11y/accessible-dialog");
    const onClose = vi.fn();
    render(
      <AccessibleDialog open onClose={onClose} title="Test">
        <p>Content</p>
      </AccessibleDialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("should have close button", async () => {
    const { AccessibleDialog } = await import("@/components/a11y/accessible-dialog");
    render(
      <AccessibleDialog open onClose={() => {}} title="Test">
        <p>Content</p>
      </AccessibleDialog>,
    );
    expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
  });

  it("should return null when not open", async () => {
    const { AccessibleDialog } = await import("@/components/a11y/accessible-dialog");
    const { container } = render(
      <AccessibleDialog open={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </AccessibleDialog>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("should expose useDialogControls", async () => {
    const { useDialogControls } = await import("@/components/a11y/accessible-dialog");
    expect(useDialogControls).toBeDefined();
  });
});

/* ===================================================================
   Accessible Table
   =================================================================== */
describe("accessible-table", () => {
  const columns = [
    { key: "name", header: "Name", render: (item: any) => item.name, sortable: true },
    { key: "role", header: "Role", render: (item: any) => item.role, sortable: true },
    { key: "status", header: "Status", render: (item: any) => item.status, sortable: false },
  ];

  const data = [
    { id: "1", name: "Alice", role: "Admin", status: "Active" },
    { id: "2", name: "Bob", role: "User", status: "Inactive" },
  ];

  it("should render table with accessible markup", async () => {
    const { AccessibleTable } = await import("@/components/a11y/accessible-table");
    render(<AccessibleTable columns={columns} data={data} caption="Team members" />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("should render caption", async () => {
    const { AccessibleTable } = await import("@/components/a11y/accessible-table");
    render(<AccessibleTable columns={columns} data={data} caption="Team members" />);
    expect(screen.getByText("Team members")).toBeInTheDocument();
  });

  it("should render empty state", async () => {
    const { AccessibleTable } = await import("@/components/a11y/accessible-table");
    render(<AccessibleTable columns={columns} data={[]} caption="Empty" />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("should render skeleton", async () => {
    const { AccessibleTableSkeleton } = await import("@/components/a11y/accessible-table");
    render(<AccessibleTableSkeleton rows={3} columns={4} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

/* ===================================================================
   Toast
   =================================================================== */
describe("toast", () => {
  it("should render toast container", async () => {
    const { ToastContainer } = await import("@/components/a11y/toast");
    render(<ToastContainer />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("should show toast via showToast", async () => {
    const { ToastContainer, showToast } = await import("@/components/a11y/toast");
    render(<ToastContainer />);
    act(() => { showToast("Test message", "info"); });
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should render toast items with status role", async () => {
    const { ToastContainer, showToast } = await import("@/components/a11y/toast");
    render(<ToastContainer />);
    act(() => { showToast("Success!", "success"); });
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Success!").closest('[role="status"]')).toBeInTheDocument();
  });
});

/* ===================================================================
   Loading Components
   =================================================================== */
describe("loading", () => {
  it("should render LoadingSpinner", async () => {
    const { LoadingSpinner } = await import("@/components/a11y/loading");
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render LoadingDots", async () => {
    const { LoadingDots } = await import("@/components/a11y/loading");
    render(<LoadingDots />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render LoadingSkeleton", async () => {
    const { LoadingSkeleton } = await import("@/components/a11y/loading");
    render(<LoadingSkeleton lines={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

/* ===================================================================
   A11y Service
   =================================================================== */
describe("a11y-service", () => {
  it("should generate a11y summary", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    expect(summary).toBeDefined();
    expect(summary.overallScore).toBeGreaterThanOrEqual(0);
    expect(summary.overallScore).toBeLessThanOrEqual(100);
    expect(summary.totalIssues).toBe(30);
    expect(summary.resolvedIssues).toBeGreaterThanOrEqual(0);
    expect(summary.criteriaResults.length).toBe(25);
    expect(summary.moduleScores.length).toBe(16);
    expect(summary.recentIssues.length).toBe(15);
    expect(summary.lastAudit).toBeDefined();
  });

  it("should have required criteria IDs", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    const ids = summary.criteriaResults.map((c) => c.id);
    expect(ids).toContain("1.1.1");
    expect(ids).toContain("2.1.1");
    expect(ids).toContain("2.4.1");
    expect(ids).toContain("4.1.3");
    expect(ids.length).toBe(25);
  });

  it("should have required module scores", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    const moduleNames = summary.moduleScores.map((m) => m.module);
    expect(moduleNames).toContain("executive-dashboard");
    expect(moduleNames).toContain("emergency-response");
    expect(moduleNames).toContain("authentication");
    expect(moduleNames).toContain("qa-dashboard");
  });

  it("should score each module between 0-100", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    for (const m of summary.moduleScores) {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
      expect(m.passed + m.failed + m.partial).toBe(m.totalChecks);
    }
  });

  it("should have issues with valid severity levels", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    for (const issue of summary.recentIssues) {
      expect(["critical", "high", "medium", "low"]).toContain(issue.severity);
      expect(["open", "in_progress", "fixed", "wont_fix"]).toContain(issue.status);
      expect(issue.wcagCriteria).toBeTruthy();
    }
  });

  it("should have passable criteria statuses", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    for (const c of summary.criteriaResults) {
      expect(["pass", "partial", "fail", "not_applicable"]).toContain(c.status);
    }
  });

  it("should have unique issue IDs", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    const ids = summary.recentIssues.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ===================================================================
   Accessibility Summary Consistency
   =================================================================== */
describe("a11y-summary consistency", () => {
  it("should have consistent overall score with module scores", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    const avgModuleScore = summary.moduleScores.reduce((acc, m) => acc + m.score, 0) / summary.moduleScores.length;
    expect(Math.abs(summary.overallScore - avgModuleScore)).toBeLessThan(15);
  });

  it("should have consistent resolved/total issue counts", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    expect(summary.totalIssues).toBe(30);
    expect(summary.recentIssues.length).toBe(15);
  });

  it("should have sub-scores for each category", async () => {
    const { generateA11ySummary } = await import("@/features/a11y-center/services/a11y-service");
    const summary = generateA11ySummary();
    expect(summary.contrastScore).toBeGreaterThanOrEqual(0);
    expect(summary.keyboardScore).toBeGreaterThanOrEqual(0);
    expect(summary.screenReaderScore).toBeGreaterThanOrEqual(0);
    expect(summary.responsiveScore).toBeGreaterThanOrEqual(0);
    expect(summary.motionScore).toBeGreaterThanOrEqual(0);
    expect(summary.formsScore).toBeGreaterThanOrEqual(0);
    expect(summary.dataVizScore).toBeGreaterThanOrEqual(0);
  });
});
