import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const CheckDouble = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 18}
    height={props?.height || 18}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M1.5 12.5L5.57143 16.5L13 8.5"
      stroke={props?.stroke || '#60A5FA'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 12.5L12.0714 16.5L22.5 5.5"
      stroke={props?.stroke || '#60A5FA'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default CheckDouble;

