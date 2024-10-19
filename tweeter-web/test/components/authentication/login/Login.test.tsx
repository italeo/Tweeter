import Login from "../../../../src/components/authentication/login/Login";
import { render } from "@testing-library/react";

describe("Login Component", () => {
  it("starts with sign-in button disabled", () => {
    // const { signInButton } = renderGetElements("/");
    // expect(signInButton).toBeDisabled();
  });
});

const renderLogin = (originalUrl: string) => {
  return render(
    <MemoryRouter>
      {!!presenter ? (
        <Login originalUrl={originalUrl} presenter={presenter} />
      ) : (
        <Login originalUrl={originalUrl} />
      )}
    </MemoryRouter>
  );
};
