import { AuthToken, FakeData, User } from "tweeter-shared";
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

    // event.preventDefault();
    // try {
    //   const alias = extractAlias(event.target.toString());

    //   const user = await getUser(authToken!, alias);

    //   if (!!user) {
    //     if (currentUser!.equals(user)) {
    //       setDisplayedUser(currentUser!);
    //     } else {
    //       setDisplayedUser(user);
    //     }
    //   }
    // } catch (error) {
    //   displayErrorMessage(`Failed to get user because of exception: ${error}`);
    // }
  };

  // const extractAlias = (value: string): string => {
  //   const index = value.indexOf("@");
  //   return value.substring(index);
  // };
  // ------------ Add to UserService -------------------------------------
  // const getUser = async (
  //   authToken: AuthToken,
  //   alias: string
  // ): Promise<User | null> => {
  //   // TODO: Replace with the result of calling server
  //   return FakeData.instance.findUserByAlias(alias);
  // };
  // --------------------------------------------------------------

  return { navigateToUser };
};

export default useUserNavigation;
