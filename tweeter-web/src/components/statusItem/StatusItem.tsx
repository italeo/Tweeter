import { Link } from "react-router-dom";
import { Status } from "tweeter-shared";
import Post from "./Post";
import useUserNavigation from "../userInfo/userNavigationHook";

interface Props {
  value: Status;
}

const StatusItem = ({ value }: Props) => {
  const { navigateToUser } = useUserNavigation();

  return (
    <div className="col bg-light mx-0 px-0">
      <div className="container px-0">
        <div className="row mx-0 px-0">
          <div className="col-auto p-3">
            <img
              src={value.user.imageUrl}
              className="img-fluid"
              width="80"
              alt="Posting user"
            />
          </div>
          <div className="col">
            <h2>
              <b>
                {value.user.firstName} {value.user.lastName}
              </b>{" "}
              -{" "}
              <Link
                to={value.user.alias}
                onClick={(event) => navigateToUser(event)}
              >
                {value.user.alias}
              </Link>
            </h2>
            {value.formattedDate}
            <br />
            <Post status={value} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusItem;
