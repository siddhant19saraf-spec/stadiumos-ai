import "@testing-library/jest-dom";
import { createMockIntersectionObserver, createMockResizeObserver, createPerformanceObserverMock } from "./fixtures/mocks";

createMockIntersectionObserver();
createMockResizeObserver();
createPerformanceObserverMock();
