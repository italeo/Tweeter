import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import { AuthToken, User } from "tweeter-shared";
import useToastListener from "../../toaster/ToastListenerHook";
import AuthenticationFields from "../../authenticationFields/AuthenticationFields";
import { LoginPresenter } from "../../../presenters/LoginPresenter";
import useUserInfoHook from "../../userInfo/userInfoHook";

interface Props {
  originalUrl?: string;
  presenter?: LoginPresenter;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { updateUserInfo } = useUserInfoHook();
  const { displayErrorMessage } = useToastListener();

  const listener = {
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

  const [presenter] = useState(props.presenter ?? new LoginPresenter(listener));

  const checkSubmitButtonStatus = (): boolean => {
    return !alias || !password;
  };

  const doLogin = () => {
    presenter.doLogin(alias, password, props.originalUrl);
  };

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
