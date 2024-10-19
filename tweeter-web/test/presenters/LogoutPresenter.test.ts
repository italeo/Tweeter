import { AuthToken } from "tweeter-shared";
import {
  LogoutView,
  LogoutPresenter,
} from "../../src/presenters/LogoutPresenter";
import { anything, instance, mock, spy, verify, when } from "ts-mockito";
import { UserService } from "../../src/model/service/UserService";

describe("LogoutPresenter", () => {
  let mockLogoutPresenterView: LogoutView;
  let logoutPresenter: LogoutPresenter;
  let mockUserService: UserService;

  // AuthToken needed for testing
  const authToken = new AuthToken("abc123", Date.now());

  beforeEach(() => {
    mockLogoutPresenterView = mock<LogoutView>();
    const mockLogoutPresenterViewInstance = instance(mockLogoutPresenterView);

    // the spy
    const logoutPresenterSpy = spy(
      new LogoutPresenter(mockLogoutPresenterViewInstance)
    );

    logoutPresenter = instance(logoutPresenterSpy);

    mockUserService = mock<UserService>();
    const mockUserServiceInstance = instance(mockUserService);

    when(logoutPresenterSpy.userService).thenReturn(mockUserServiceInstance);
  });

  it("tells the view to display the logging out message", async () => {
    logoutPresenter.logout(authToken);
    verify(
      mockLogoutPresenterView.displayInfoMessage("Logging Out...", 0)
    ).once();
  });

  // Add more test

  it("calls logout on the user with the correct authToken", async () => {
    await logoutPresenter.logout(authToken);
    verify(mockUserService.logout(authToken)).once();

    // let [capturedAuthToken] = capture(mockUserService.logout).last();
    // expect(capturedAuthToken).toEqual(authToken);
  });

  it("tells the view to clear the last info message, clear the user info, and navigate to the login page when logout is successful.", async () => {
    await logoutPresenter.logout(authToken);
    verify(mockLogoutPresenterView.clearLastInfoMessage()).once();
    verify(mockLogoutPresenterView.clearUserInfo()).once();
    verify(mockLogoutPresenterView.navigateToLogin()).once();

    verify(mockLogoutPresenterView.displayErrorMessage(anything())).never();
  });

  it("displays an error message and does not clear the last info message, the user info, and navigate to the login page when logout fails.", async () => {
    const error = new Error("An error occured");
    when(mockUserService.logout(authToken)).thenThrow(error);

    await logoutPresenter.logout(authToken);

    // Used to identify why the test was failing.

    // let [capturedErrorMessage] = capture(
    //   mockAppNavbarPresenterView.displayErrorMessage
    // ).last();
    // console.log(capturedErrorMessage);

    verify(
      mockLogoutPresenterView.displayErrorMessage(
        "Failed to log user out because of exception: An error occured"
      )
    ).once();
    verify(mockLogoutPresenterView.clearLastInfoMessage()).never();
    verify(mockLogoutPresenterView.clearUserInfo()).never();
    verify(mockLogoutPresenterView.navigateToLogin()).never();
  });
});
