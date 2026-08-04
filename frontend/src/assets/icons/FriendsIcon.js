import * as React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";
const FriendsIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 22}
    height={props?.height || 22}
    viewBox="0 0 22 22"
    fill="none"
    {...props}
  >
    <Ellipse
      cx={8.25089}
      cy={5.49992}
      rx={3.66667}
      ry={3.66667}
      fill={props?.fill || "#2F80ED"}
    />
    <Ellipse
      cx={8.2509}
      cy={15.5841}
      rx={6.41667}
      ry={3.66667}
      fill={props?.fill || "#2F80ED"}
    />
    <Path
      d="M19.2496 15.5838C19.2496 17.1026 17.3837 18.3338 15.1055 18.3338C15.7767 17.6002 16.2382 16.6793 16.2382 15.5851C16.2382 14.4896 15.7756 13.5679 15.1032 12.8338C17.3814 12.8338 19.2496 14.065 19.2496 15.5838Z"
      fill={props?.fill || "#2F80ED"}
    />
    <Path
      d="M16.4996 5.50073C16.4996 7.01952 15.2684 8.25073 13.7496 8.25073C13.4184 8.25073 13.1009 8.19219 12.8069 8.08489C13.2405 7.32214 13.4882 6.43985 13.4882 5.49971C13.4882 4.56027 13.2409 3.67859 12.8078 2.91622C13.1016 2.80914 13.4188 2.75073 13.7496 2.75073C15.2684 2.75073 16.4996 3.98195 16.4996 5.50073Z"
      fill={props?.fill || "#2F80ED"}
    />
  </Svg>
);
export default FriendsIcon;
