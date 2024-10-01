import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import { AuthToken, FakeData, User } from "tweeter-shared";
import useToastListener from "../../toaster/ToastListenerHook";
import AuthenticationFields from "../../authenticationFields/AuthenticationFields";
import useUserInfoHook from "../../userInfo/userInfoHook";
import { LoginPresenter } from "../../../presenters/LoginPresenter";

interface Props {
  originalUrl?: string;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { updateUserInfo } = useUserInfoHook();
  const { displayErrorMessage } = useToastListener();

  const authView = {
    authenticated: (user: User, authToken: AuthToken) => {
      updateUserInfo(user, user, authToken, rememberMe);
      if (props.originalUrl) {
        navigate(props.originalUrl);
      } else {
        navigate("/");
      }
    },
    displayErrorMessage: (message: string) => {
      displayErrorMessage(message);
    },
    setLoadingState: (isLoading: boolean) => {
      setIsLoading(isLoading);
    },
  };

  const presenter = new LoginPresenter(authView);

  const checkSubmitButtonStatus = (): boolean => {
    return !alias || !password;
  };

  const doLogin = () => {
    presenter.doLogin(alias, password);
  };

  // const loginOnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
  //   if (event.key == "Enter" && !checkSubmitButtonStatus()) {
  //     doLogin();
  //   }
  // };

  /////////////////////////// FUNCTION TO BE MODIFIED
  // const doLogin = async () => {
  //   try {
  //     setIsLoading(true);

  //     const [user, authToken] = await login(alias, password);

  //     updateUserInfo(user, user, authToken, rememberMe);

  //     if (!!props.originalUrl) {
  //       navigate(props.originalUrl);
  //     } else {
  //       navigate("/");
  //     }
  //   } catch (error) {
  //     displayErrorMessage(
  //       `Failed to log user in because of exception: ${error}`
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  /////////////////////////////////////////////
  // REMOVE AFTER CREATING PRESENTER
  // const login = async (
  //   alias: string,
  //   password: string
  // ): Promise<[User, AuthToken]> => {
  //   // TODO: Replace with the result of calling the server
  //   const user = FakeData.instance.firstUser;

  //   if (user === null) {
  //     throw new Error("Invalid alias or password");
  //   }

  //   return [user, FakeData.instance.authToken];
  // };
  //////////////////////////////////////////
  const inputFieldGenerator = () => {
    return (
      <AuthenticationFields
        onAliasChange={(event) => setAlias(event.target.value)}
        onPasswordChange={(event) => setPassword(event.target.value)}
      />
    );
  };

  const switchAuthenticationMethodGenerator = () => {
    return (
      <div className="mb-3">
        Not registered? <Link to="/register">Register</Link>
      </div>
    );
  };

  return (
    <AuthenticationFormLayout
      headingText="Please Sign In"
      submitButtonLabel="Sign in"
      oAuthHeading="Sign in with:"
      inputFieldGenerator={inputFieldGenerator}
      switchAuthenticationMethodGenerator={switchAuthenticationMethodGenerator}
      setRememberMe={setRememberMe}
      submitButtonDisabled={checkSubmitButtonStatus}
      isLoading={isLoading}
      submit={doLogin}
    />
  );
};

export default Login;
