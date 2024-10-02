import useToastListener from "../toaster/ToastListenerHook";
import useUserInfoHook from "./userInfoHook";
import {
  NavigateView,
  NavigationPresenter,
} from "../../presenters/NavigationPresenter";

const useUserNavigation = () => {
  const { displayErrorMessage } = useToastListener();
  const { setDisplayedUser, currentUser, authToken } = useUserInfoHook();

  // ------------ Listener -------------------------------
  const listener: NavigateView = {
    displayErrorMessage: displayErrorMessage,
    setDisplayedUser: setDisplayedUser,
  };

  // ------------ Presenter  -------------------------------
  const presenter = new NavigationPresenter(listener);

  // ------------ Presenter goes here maybe ?? -------------------------------
  const navigateToUser = async (event: React.MouseEvent): Promise<void> => {
    await presenter.navigateToUserCustom(authToken!, currentUser!, event);
  };

  return { navigateToUser };
};

export default useUserNavigation;
