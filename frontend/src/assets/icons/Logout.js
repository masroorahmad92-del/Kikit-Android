import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const Logout = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 24}
    height={props?.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
      stroke={props?.stroke || '#FF2B1F'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17L21 12L16 7"
      stroke={props?.stroke || '#FF2B1F'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12H9"
      stroke={props?.stroke || '#FF2B1F'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default Logout;

