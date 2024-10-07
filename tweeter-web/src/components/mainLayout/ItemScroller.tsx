import { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import useToastListener from "../toaster/ToastListenerHook";
import useUserInfoHook from "../userInfo/userInfoHook";
import {
  PagedItemPresenter,
  PagedItemView,
} from "../../presenters/PagedItemPresenter";

interface Props<T, U> {
  // Defined function to pass in view to create the presenter
  presenterGenerator: (view: PagedItemView<T>) => PagedItemPresenter<T, U>;
  itemComponentGenerator: (item: T) => JSX.Element;
}

const UserItemScroller = <T, U>(props: Props<T, U>) => {
  const { displayErrorMessage } = useToastListener();
  const [items, setItems] = useState<T[]>([]);

  //   const [newItems, setNewItems] = useState<User[]>([]);
  //   const [changedDisplayedUser, setChangedDisplayedUser] = useState(true);
  //   const { displayedUser, authToken } = useUserInfoHook();

  const itemsReference = useRef(items);
  itemsReference.current = items;

  const { displayedUser, authToken } = useUserInfoHook();
  // Initialize the component whenever the displayed user changes
  useEffect(() => {
    loadMoreItems();
  }, []);

  // New presenter to remove dups
  const listener: PagedItemView<T> = {
    addItems: (newItems: T[]) =>
      setItems([...itemsReference.current, ...newItems]),
    displayErrorMessage: displayErrorMessage,
  };

  const [presenter] = useState(props.presenterGenerator(listener));

  const loadMoreItems = async () => {
    presenter.loadMoreItems(authToken!, displayedUser!.alias);
  };

  // Load initial items whenever the displayed user changes. Done in a separate useEffect hook so the changes from reset will be visible.
  //   useEffect(() => {
  //     if (changedDisplayedUser) {
  //       loadMoreItems();
  //     }
  //   }, [changedDisplayedUser]);

  //   // Add new items whenever there are new items to add
  //   useEffect(() => {
  //     if (newItems) {
  //       setItems([...items, ...newItems]);
  //     }
  //   }, [newItems]);

  //   const reset = async () => {
  //     setItems([]);
  //     setNewItems([]);
  //     setChangedDisplayedUser(true);
  //     presenter.reset();
  //   };

  // NEW ADD
  //   const listener: UserItemView = {
  //     addItems: (newItems: User[]) => setNewItems(newItems),
  //     displayErrorMessage: displayErrorMessage,
  //   };

  //   const [presenter] = useState(props.presenterGenerator(listener));

  //   const loadMoreItems = async () => {
  //     presenter.loadMoreItems(authToken!, displayedUser!.alias);
  //     setChangedDisplayedUser(false);
  //   };

  return (
    <div className="container px-0 overflow-visible vh-100">
      <InfiniteScroll
        className="pr-0 mr-0"
        dataLength={items.length}
        next={loadMoreItems}
        hasMore={presenter.hasMoreItems}
        loader={<h4>Loading...</h4>}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="row mb-3 mx-0 px-0 border rounded bg-white"
          >
            {props.itemComponentGenerator(item)}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default UserItemScroller;
