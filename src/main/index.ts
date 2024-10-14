export { initialize, isInitialized, enable } from "./server";

import { isVersionGreaterOrEqual } from '../common/utils';

const electronVersion = process.versions.electron;

let WebContentsView: typeof Electron.WebContentsView | undefined;

if (isVersionGreaterOrEqual('29.0.0', electronVersion)) {
    WebContentsView = Electron.WebContentsView;
}

export { WebContentsView };