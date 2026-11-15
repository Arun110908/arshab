import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import AuthPage from "./AuthPage";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: null, login: vi.fn(), register: vi.fn() }),
}));

test("register form blocks short passwords", async () => {
  render(<MemoryRouter><AuthPage mode="register" /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/name/i), "Arun");
  await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
  await userEvent.type(screen.getByLabelText(/password/i), "short");
  await userEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8/i);
});
