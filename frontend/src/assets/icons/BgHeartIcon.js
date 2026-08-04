import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const BgHeartIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 23}
    height={props?.height || 21}
    viewBox="0 0 23 21"
    fill="none"
    {...props}>
    <Path
      d="M21.3393 15.2462C22.8292 12.5979 22.1612 8.95751 18.908 7.05779C16.3104 5.54176 13.0789 6.89559 13.0789 6.89559C13.0789 6.89559 12.9888 3.38158 10.5482 1.62068C7.49227 -0.58318 3.90816 0.293371 2.11067 2.74054C0.33337 5.15964 0.634766 8.58007 1.06355 11.0506C1.6477 14.4102 3.19506 18.4483 4.26548 20.5523C6.61605 20.6724 10.9195 20.44 14.2115 19.6009C16.6351 18.9864 19.8665 17.8634 21.3393 15.2462Z"
      fill={props?.fill || '#FAEBFF'}
    />
  </Svg>
);
export default BgHeartIcon;
