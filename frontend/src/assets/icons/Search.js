import * as React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';
const Search = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 22}
    height={props?.height || 22}
    viewBox="0 0 22 22"
    fill="none"
    {...props}>
    <Circle
      cx="9.5"
      cy="9.5"
      r="7"
      stroke={props?.stroke || '#9CA3AF'}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M14.5 14.5L19.5 19.5"
      stroke={props?.stroke || '#9CA3AF'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);
export default Search;

