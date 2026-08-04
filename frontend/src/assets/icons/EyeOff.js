import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const EyeOff = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width || 24}
    height={props?.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M3 3L21 21"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.584 10.587C10.2087 10.9621 9.99778 11.4706 9.99756 12.0013C9.99734 12.5319 10.2078 13.0406 10.5828 13.416C10.9578 13.7913 11.4663 14.0022 11.997 14.0025C12.5276 14.0027 13.0363 13.7922 13.4117 13.4172"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.363 5.365C10.2204 5.11972 11.1082 4.99684 12 5C19 5 22 12 22 12C21.5529 12.8571 21.0329 13.6739 20.446 14.441"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.659 6.66C5.08097 7.8091 3.80202 9.33781 2.93896 11.1149C2.85296 11.2922 2.80896 11.4873 2.81077 11.6847C2.81259 11.8821 2.86015 12.0764 2.94996 12.252C3.81402 13.9822 5.07302 15.475 6.62896 16.615"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.12 14.12C13.7496 14.4947 13.3078 14.7904 12.8211 14.9895C12.3343 15.1886 11.8129 15.2871 11.2877 15.279C10.7624 15.271 10.2444 15.1565 9.76386 14.9429C9.28332 14.7292 8.85128 14.4207 8.49395 14.0363C8.13661 13.6519 7.86052 13.1997 7.68269 12.7066C7.50487 12.2134 7.42891 11.6896 7.45934 11.1666C7.48976 10.6436 7.62603 10.1323 7.85954 9.66416C8.09305 9.19604 8.41896 8.78106 8.81796 8.44501"
      stroke={props?.stroke || '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default EyeOff;

