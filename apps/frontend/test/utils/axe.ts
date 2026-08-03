/**
 * Accessibility test harness using axe-core via jest-axe.
 */
import { axe, toHaveNoViolations } from "jest-axe";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

expect.extend(toHaveNoViolations);

export async function testAccessibility(container: HTMLElement): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export async function renderAndTestA11y(ui: ReactElement): Promise<RenderResult> {
  const result = render(ui);
  await testAccessibility(result.container);
  return result;
}
