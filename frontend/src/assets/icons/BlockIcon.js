import * as React from 'react';
import Svg, {Circle, Line} from 'react-native-svg';

const BlockIcon = ({width = 22, height = 22, color = '#FF2B1F', ...props}) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Line
      x1="5.636"
      y1="5.636"
      x2="18.364"
      y2="18.364"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default BlockIcon;
