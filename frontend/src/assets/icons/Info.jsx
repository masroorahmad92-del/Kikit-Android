import * as React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

const Info = ({width = 20, height = 20, fill = '#000', ...props}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={fill}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M12 16V12M12 8H12.01"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Info;
