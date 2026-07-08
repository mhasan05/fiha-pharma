import { Image, type ImageProps } from "expo-image";

/**
 * App image backed by expo-image: disk + memory caching and a subtle fade-in.
 * Remote images download once, then load instantly on scroll / revisit / app
 * reopen. Use `contentFit` ("contain" | "cover"), NOT `resizeMode`.
 */
export function Img(props: ImageProps): React.ReactElement {
  return <Image cachePolicy="memory-disk" transition={180} {...props} />;
}
