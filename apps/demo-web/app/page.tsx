import { Demo } from '../components/demo';

/**
 * A server component: the static export renders the whole page to HTML at build time and the
 * client component below hydrates it. Nothing here touches `window`.
 */
export default function Page() {
  return <Demo />;
}
