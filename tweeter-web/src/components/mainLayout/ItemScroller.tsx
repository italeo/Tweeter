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

  // Required to allow the addItems method to see the current value of 'items'
  // instead of the value from when the closure was created.
  const itemsReference = useRef(items);
  itemsReference.current = items;

  const { displayedUser, authToken } = useUserInfoHook();
  // Initialize the component whenever the displayed user changes
  useEffect(() => {
    loadMoreItems();
  }, []);

  // New presenter to remove dups
  const listener: PagedItemView<T> = {
    addItems: (newItems: T[]) => {
      console.log("New items to be added:", newItems); // Log new items fetched
      console.log(
        "Existing items before adding new ones:",
        itemsReference.current
      ); // Log current items

      // Deduplicate based on a unique property (e.g., `id` or `timestamp`)
      const existingIds = new Set(
        itemsReference.current.map((item: any) => item.id || item.timestamp)
      );
      const uniqueItems = newItems.filter(
        (item: any) => !existingIds.has(item.id || item.timestamp)
      );

      console.log("Filtered unique items:", uniqueItems); // Log unique items
      setItems([...itemsReference.current, ...uniqueItems]);

      console.log("Updated items after adding:", [
        ...itemsReference.current,
        ...uniqueItems,
      ]); // Log the combined array
    },
    displayErrorMessage: displayErrorMessage,
    showEmptyState: () => {
      setItems([]); // Clear items and handle empty state
    },
    hideLoading: () => {
      // Optional: If you have specific UI for "loading", hide it here
      console.log("Loading indicator should be hidden now.");
    },
  };

  const [presenter] = useState(props.presenterGenerator(listener));

  const loadMoreItems = async () => {
    presenter.loadMoreItems(authToken!, displayedUser!.alias);
  };

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
