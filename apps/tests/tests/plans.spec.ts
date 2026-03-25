import { expect, test } from "@playwright/test";

test.describe("travel sync frontend slice", () => {
  test("shows the landing page promise clearly", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Pick the best meeting point after the data speaks.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Start a plan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review plans" })).toBeVisible();
  });

  test("creates a plan through the wizard and lands on its detail page", async ({ page }) => {
    await page.goto("/plans/new");

    await page.getByLabel("Plan name").fill("Pan-Americas Summit");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Guest name").fill("Carlos");
    await page.getByLabel("Departure city").fill("Miami");
    await page.getByLabel("Departure airport").selectOption("103");
    await page.getByRole("button", { name: "Add participant" }).click();
    await expect(page.getByText("Carlos")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Create plan" }).click();

    await expect(page).toHaveURL(/\/plans\/\d+$/);
    await expect(page.getByRole("heading", { name: "Pan-Americas Summit" })).toBeVisible();
    await expect(page.getByText("Carlos")).toBeVisible();
  });

  test("adds a participant from the plan detail page", async ({ page }) => {
    await page.goto("/plans/1");

    await page.getByLabel("Guest name").fill("Marta");
    await page.getByLabel("Departure city").fill("Toronto");
    await page.getByLabel("Departure airport").selectOption("201");
    await page.getByRole("button", { name: "Add participant" }).click();

    await expect(page.getByText("Participant added.")).toBeVisible();
    await expect(page.getByText("Marta")).toBeVisible();
  });

  test("runs a destination search from the plan detail page", async ({ page }) => {
    await page.goto("/plans/1");

    await page.getByRole("button", { name: "Run destination search" }).click();

    await expect(page.getByText("Destination search completed.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Panama City" }).first()).toBeVisible();
    await expect(page.getByText("Selected destination detail")).toBeVisible();
  });

  test("compares destinations side-by-side", async ({ page }) => {
    await page.goto("/plans/1");

    await page.getByRole("button", { name: "Run destination search" }).click();
    await page.getByRole("button", { name: "Compare Panama City" }).click();
    await page.getByRole("button", { name: "Compare Madrid" }).click();

    await expect(page.getByText("Comparison picks 2/3")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Side-by-side destination board" })).toBeVisible();
    await expect(page.getByText("Best cost:")).toBeVisible();
  });
});
