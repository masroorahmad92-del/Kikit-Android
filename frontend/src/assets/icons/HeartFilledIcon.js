import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const HeartFilledIcon = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 22}
    height={props?.height || 22}
    viewBox="0 0 22 22"
    fill="none"
    {...props}>
    <Path
      d="M1.83337 8.37573C1.83337 12.8334 5.51785 15.2089 8.21496 17.335C9.16671 18.0853 10.0834 18.7917 11 18.7917C11.9167 18.7917 12.8334 18.0853 13.7851 17.335C16.4822 15.2089 20.1667 12.8334 20.1667 8.37573C20.1667 3.91804 15.1249 0.756737 11 5.04231C6.87519 0.756737 1.83337 3.91804 1.83337 8.37573Z"
      fill={props?.fill || '#FF2C79'}
    />
  </Svg>
);
export default HeartFilledIcon;
