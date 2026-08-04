import * as React from "react";
import Svg, { Path } from "react-native-svg";
const ArrowDown = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={22}
    height={22}
    viewBox="0 0 22 22"
    fill="none"
    {...props}
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.0614 7.80259C4.3085 7.51431 4.74252 7.48092 5.03081 7.72802L11.0001 12.8445L16.9693 7.72802C17.2576 7.48092 17.6916 7.51431 17.9387 7.80259C18.1858 8.09088 18.1524 8.5249 17.8641 8.772L11.4475 14.272C11.19 14.4927 10.8101 14.4927 10.5526 14.272L4.13597 8.772C3.84768 8.5249 3.81429 8.09088 4.0614 7.80259Z"
      fill="#6B7280"
    />
  </Svg>
);
export default ArrowDown;
