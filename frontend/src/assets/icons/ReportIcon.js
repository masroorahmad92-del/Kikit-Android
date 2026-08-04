import * as React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";
const ReportIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    viewBox="0 0 18 18"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip0_6413_15871)">
      <Path
        d="M9 4.6875C9.31066 4.6875 9.5625 4.93934 9.5625 5.25V9.75C9.5625 10.0607 9.31066 10.3125 9 10.3125C8.68934 10.3125 8.4375 10.0607 8.4375 9.75V5.25C8.4375 4.93934 8.68934 4.6875 9 4.6875Z"
        fill="#FF2B1F"
      />
      <Path
        d="M9 12.75C9.41421 12.75 9.75 12.4142 9.75 12C9.75 11.5858 9.41421 11.25 9 11.25C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75Z"
        fill="#FF2B1F"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.9375 9C0.9375 4.5472 4.5472 0.9375 9 0.9375C13.4528 0.9375 17.0625 4.5472 17.0625 9C17.0625 13.4528 13.4528 17.0625 9 17.0625C4.5472 17.0625 0.9375 13.4528 0.9375 9ZM9 2.0625C5.16852 2.0625 2.0625 5.16852 2.0625 9C2.0625 12.8315 5.16852 15.9375 9 15.9375C12.8315 15.9375 15.9375 12.8315 15.9375 9C15.9375 5.16852 12.8315 2.0625 9 2.0625Z"
        fill="#FF2B1F"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_6413_15871">
        <Rect width={18} height={18} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default ReportIcon;
