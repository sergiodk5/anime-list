import { vi } from "vitest";

export const mockShowToast = vi.fn();
export const mockGetAnimeStatus = vi.fn();
export const mockClearAllHidden = vi.fn();

// Button creation mocks
export const mockCreateCombined = vi.fn();
export const mockCreateStartButton = vi.fn();
export const mockCreateRemoveButton = vi.fn();
export const mockCreatePlanButton = vi.fn();
export const mockCreateHideButton = vi.fn();

// Service and component mocks
export const mockExtractFromListItem = vi.fn();
export const mockShouldRunFeature = vi.fn();
export const mockInjectStyles = vi.fn();
