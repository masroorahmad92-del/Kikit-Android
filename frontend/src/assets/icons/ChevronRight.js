import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const ChevronRight = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 24}
    height={props?.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M9 18L15 12L9 6"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default ChevronRight;

