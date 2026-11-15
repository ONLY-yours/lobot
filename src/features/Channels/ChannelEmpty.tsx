import { cssVar, Flexbox } from '@lobehub/ui';
import { LobeHub } from '@lobehub/ui/brand';

/**
 * The blank page beside the list when no conversation is open, like an IM client's: a faint
 * logo and nothing to act on, instead of a `#` header over an error.
 */
export const ChannelEmpty = () => (
  <Flexbox align="center" data-testid="channel-empty" flex={1} height="100%" justify="center">
    {/* Lobot ships no custom logo image (`BRANDING_LOGO_URL` is empty), so `ProductLogo` would
        render a broken image. The wordmark draws in `currentColor`, so a fill token fades it. */}
    <LobeHub size={36} style={{ color: cssVar.colorFill }} type="text" />
  </Flexbox>
);
