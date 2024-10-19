import React, { useContext } from "react";
import { MemoryRouter } from "react-router-dom";
import PostStatus from "../../../src/components/postStatus/PostStatus";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { anything, instance, mock, verify } from "ts-mockito";
import useInfoHook from "../../../src/components/userInfo/userInfoHook";
import { PostStatusPresenter } from "../../../src/presenters/PostStatusPresenter";

jest.mock("../../../src/components/userInfo/UserInfoHook", () => ({
  ...jest.requireActual("../../../src/components/userInfo/UserInfoHook"),
  __esModule: true,
  default: jest.fn(),
}));

const mockUserInstance = "mockUser";
const mockAuthTokenInstance = "mockAuthToken";

describe("PostStatus Component", () => {
  beforeAll(() => {
    (useInfoHook as jest.Mock).mockReturnValue({
      currentUser: mockUserInstance,
      authToken: mockAuthTokenInstance,
    });
  });
  it("starts with post status and clear button both disabled", () => {
    const { postStatusButton, clearPostButton } = renderPostStatusGetElements();

    expect(postStatusButton).toBeDisabled();
    expect(clearPostButton).toBeDisabled();
  });
});

const renderPostStatus = (presenter?: PostStatusPresenter) => {
  return render(
    <MemoryRouter>
      {!!presenter ? <PostStatus presenter={presenter} /> : <PostStatus />}
    </MemoryRouter>
  );
};

const renderPostStatusGetElements = (presenter?: PostStatusPresenter) => {
  const user = userEvent.setup();
  renderPostStatus(presenter);

  const postStatusButton = screen.getByRole("button", {
    name: /Post Status/i,
  });
  const clearPostButton = screen.getByRole("button", { name: /Clear/i });
  const postStatusTextArea = screen.getByLabelText("status field");

  return { postStatusButton, clearPostButton, postStatusTextArea, user };
};
