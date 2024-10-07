import "./App.css";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./components/authentication/login/Login";
import Register from "./components/authentication/register/Register";
import MainLayout from "./components/mainLayout/MainLayout";
import Toaster from "./components/toaster/Toaster";
import useUserInfoHook from "./components/userInfo/userInfoHook";
import { FolloweePresenter } from "./presenters/FolloweePresenter";
import { FollowerPresenter } from "./presenters/FollowerPresenter";
import { StoryPresenter } from "./presenters/StoryPresenter";
import { FeedPresenter } from "./presenters/FeedPresenter";
import ItemScroller from "./components/mainLayout/ItemScroller";
import { PagedItemView } from "./presenters/PagedItemPresenter";
import { Status, User } from "tweeter-shared";
import StatusItem from "./components/statusItem/StatusItem";
import UserItem from "./components/userItem/UserItem";

const App = () => {
  const { currentUser, authToken } = useUserInfoHook();

  const isAuthenticated = (): boolean => {
    return !!currentUser && !!authToken;
  };

  return (
    <div>
      <Toaster position="top-right" />
      <BrowserRouter>
        {isAuthenticated() ? (
          <AuthenticatedRoutes />
        ) : (
          <UnauthenticatedRoutes />
        )}
      </BrowserRouter>
    </div>
  );
};

const AuthenticatedRoutes = () => {
  const statusItemGenerator = (item: Status) => <StatusItem value={item} />;
  const userItemGenerator = (item: User) => <UserItem value={item} />;
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/feed" />} />
        <Route
          path="feed"
          element={
            <ItemScroller
              key={3}
              // Call presenter after setting up FeedPresenter
              presenterGenerator={(view: PagedItemView<Status>) =>
                new FeedPresenter(view)
              }
              itemComponentGenerator={statusItemGenerator}
            />
          }
        />
        <Route
          path="story"
          element={
            <ItemScroller
              key={4}
              // Call presenter after setting up StoryPresenter
              presenterGenerator={(view: PagedItemView<Status>) =>
                new StoryPresenter(view)
              }
              itemComponentGenerator={statusItemGenerator}
            />
          }
        />
        <Route
          path="followees"
          element={
            <ItemScroller
              key={1}
              presenterGenerator={(view: PagedItemView<User>) =>
                new FolloweePresenter(view)
              }
              itemComponentGenerator={userItemGenerator}
            />
          }
        />
        <Route
          path="followers"
          element={
            <ItemScroller
              key={2}
              presenterGenerator={(view: PagedItemView<User>) =>
                new FollowerPresenter(view)
              }
              itemComponentGenerator={userItemGenerator}
            />
          }
        />
        <Route path="logout" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/feed" />} />
      </Route>
    </Routes>
  );
};

const UnauthenticatedRoutes = () => {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Login originalUrl={location.pathname} />} />
    </Routes>
  );
};

export default App;
