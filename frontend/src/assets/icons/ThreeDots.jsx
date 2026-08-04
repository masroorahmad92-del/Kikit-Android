import * as React from 'react';
import Svg, {Circle} from 'react-native-svg';

const ThreeDots = ({width = 24, height = 24, fill = '#FFF', ...props}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Circle cx="12" cy="6" r="2" fill={fill} />
    <Circle cx="12" cy="12" r="2" fill={fill} />
    <Circle cx="12" cy="18" r="2" fill={fill} />
  </Svg>
);

export default ThreeDots;
