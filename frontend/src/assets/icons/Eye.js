import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const Eye = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 24}
    height={props?.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default Eye;

