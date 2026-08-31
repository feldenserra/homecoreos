import Svg, { Path } from "react-native-svg";
import { colors } from "../theme/tokens";

/**
 * The house glyph. Same path as the web version; `currentColor` has no
 * equivalent in React Native, so the colour is an explicit prop.
 */
export function HouseMark({
  size = 16,
  color = colors.clay,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 2.4 14.4 8h-1.7v5.2H3.3V8H1.6L8 2.4z" fill={color} />
    </Svg>
  );
}
