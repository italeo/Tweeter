import { anything, instance, mock, spy, verify, when } from "ts-mockito";
import {
  PostStatusPresenter,
  PostStatusView,
} from "../../src/presenters/PostStatusPresenter";
import { StatusService } from "../../src/model/service/StatusService";
import { AuthToken, User } from "tweeter-shared";

describe("PostStatusPresenter", () => {
  let mockPostStatusPresenterView: PostStatusView;
  let postStatusPresenter: PostStatusPresenter;
  let mockStatusService: StatusService;

  // Helper veriables
  const authToken = new AuthToken("abs123", Date.now());
  const post = "currentPost";
  const currentUser = new User("Ishmael", "Taleo", "alias", "imageUrl");

  beforeEach(() => {
    mockPostStatusPresenterView = mock<PostStatusView>();
    const mockPostStatusViewInstance = instance(mockPostStatusPresenterView);

    const postStatusPresenterSpy = spy(
      new PostStatusPresenter(mockPostStatusViewInstance)
    );
    postStatusPresenter = instance(postStatusPresenterSpy);

    mockStatusService = mock<StatusService>();
    const mockStatusServiceInstance = instance(mockStatusService);

    when(postStatusPresenterSpy.statusService).thenReturn(
      mockStatusServiceInstance
    );
  });

  it("tells the view to display a posting status message.", async () => {
    await postStatusPresenter.postStatus(authToken, post, currentUser);
    verify(
      mockPostStatusPresenterView.displayInfoMessage("Status posted!", 2000)
    ).once();
  });

  it(" calls postStatus on the post status service with the correct status string and auth token", async () => {
    await postStatusPresenter.postStatus(authToken, post, currentUser);
    verify(mockStatusService.postStatus(authToken, anything())).once();
  });

  it("tells the view to clear the last info message, clear the post, and display a status posted message.", async () => {
    await postStatusPresenter.postStatus(authToken, post, currentUser);
    verify(mockPostStatusPresenterView.clearLastInfoMessage()).once();
    verify(mockPostStatusPresenterView.clearPost()).once();

    verify(
      mockPostStatusPresenterView.displayErrorMessage(
        "Failed to post the status because of exception: An error occured"
      )
    ).never();
  });

  it("displays an error message and does not clear the last info message, clear the post, and display a status posted message.", async () => {
    const error = new Error("An error occured");
    when(mockStatusService.postStatus(authToken, anything())).thenThrow(error);

    await postStatusPresenter.postStatus(authToken, post, currentUser);

    verify(
      mockPostStatusPresenterView.displayErrorMessage(
        "Failed to post the status because of exception: An error occured"
      )
    ).once();

    verify(mockPostStatusPresenterView.clearLastInfoMessage()).never();
    verify(mockPostStatusPresenterView.clearPost()).never();
  });
});
