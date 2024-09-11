import { ChangeEvent } from "react";

interface Props {
  onAliasChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const AuthenticationFields: React.FC<Props> = ({
  onAliasChange,
  onPasswordChange,
}) => {
  return (
    <>
      <div className="form-floating">
        <input
          type="text"
          className="form-control"
          size={50}
          id="aliasInput"
          placeholder="name@example.com"
          //onKeyDown={loginOnEnter}
          onChange={onAliasChange}
        />
        <label htmlFor="aliasInput">Alias</label>
      </div>
      <div className="form-floating mb-3">
        <input
          type="password"
          className="form-control bottom"
          id="passwordInput"
          placeholder="Password"
          //onKeyDown={loginOnEnter}
          onChange={onPasswordChange}
        />
        <label htmlFor="passwordInput">Password</label>
      </div>
    </>
  );
};

export default AuthenticationFields;
